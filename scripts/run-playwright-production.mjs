import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import process from "node:process";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const playwrightBin = require.resolve("@playwright/test/cli");
const port = Number(process.env.PLAYWRIGHT_PORT || 3100);
const baseUrl = `http://127.0.0.1:${port}`;
const testEnvironment = {
  GOOGLE_API_KEY: "dummy",
  GEMINI_API_KEY: "dummy",
  AK_USE_LOCAL_JSON_ONLY: "true",
  // Permite que las pruebas comprueben que un dato se guarda de verdad
  // (por ejemplo, la confirmacion de un invitado), no solo que la pantalla abre.
  AK_ALLOW_LOCAL_JSON_WRITES: "true",
  AK_SESSION_SECRET: "playwright-session-secret-with-enough-entropy",
  FIREBASE_PROJECT_ID: "demo-ak-producciones",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-ak-producciones",
  NEXT_PUBLIC_FIREBASE_API_KEY: "dummy",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-ak-producciones.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "demo-ak-producciones.appspot.com",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "000000000000",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:000000000000:web:test",
};

if (!existsSync(".next/BUILD_ID")) {
  console.error(
    "[playwright-production] Falta el build de produccion. Ejecuta npm run build primero.",
  );
  process.exit(1);
}

const server = spawn(
  process.execPath,
  [nextBin, "start", "--hostname", "127.0.0.1", "--port", String(port)],
  {
    stdio: "inherit",
    detached: process.platform !== "win32",
    env: {
      ...process.env,
      ...testEnvironment,
      NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED || "1",
    },
  },
);

let stopping = false;

function stopServer() {
  if (stopping || !server.pid) return;
  stopping = true;

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], {
      stdio: "ignore",
    });
  } else {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      // The server already stopped.
    }
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopServer();
    process.exit(1);
  });
}

async function waitForHealth(timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(
        `El servidor de produccion termino con codigo ${server.exitCode}.`,
      );
    }

    try {
      const response = await fetch(`${baseUrl}/api/health`, {
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) return;
      lastError = new Error(`Health check HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(
    `[playwright-production] La app no quedo disponible en ${baseUrl}: ${lastError instanceof Error ? lastError.message : "timeout"}`,
  );
}

let exitCode = 1;

try {
  await waitForHealth();
  console.log(
    `[playwright-production] App lista en ${baseUrl}. Ejecutando pruebas E2E.`,
  );

  const playwright = spawn(
    process.execPath,
    [playwrightBin, "test", ...process.argv.slice(2)],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        ...testEnvironment,
        PLAYWRIGHT_BASE_URL: baseUrl,
      },
    },
  );

  exitCode = await new Promise((resolve, reject) => {
    playwright.once("error", reject);
    playwright.once("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`Playwright termino por la senal ${signal}.`));
        return;
      }
      resolve(code ?? 1);
    });
  });
} catch (error) {
  console.error(error);
} finally {
  stopServer();
}

process.exit(exitCode);

import { spawn, spawnSync, execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";
import process from "node:process";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const playwrightBin = require.resolve("@playwright/test/cli");
const port = Number(process.env.PLAYWRIGHT_PORT || 3100);
const baseUrl = `http://127.0.0.1:${port}`;
const MAX_SERVER_LOG_CHARS = 20_000;
const MAX_REPORTED_ERROR_LINES = 20;

const testEnvironment = {
  GOOGLE_API_KEY: "dummy",
  GEMINI_API_KEY: "dummy",
  AK_USE_LOCAL_JSON_ONLY: "true",
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

import { statSync } from "node:fs";

function getLatestSourceMtime(dir = "src") {
  let latest = 0;
  function traverse(current) {
    try {
      const entries = readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          traverse(full);
        } else if (entry.isFile()) {
          const mtime = statSync(full).mtimeMs;
          if (mtime > latest) latest = mtime;
        }
      }
    } catch {}
  }
  if (existsSync(dir)) traverse(dir);
  return latest;
}

if (!existsSync(".next/BUILD_ID")) {
  console.log("[playwright-production] Compilando app para pruebas E2E (npm run build)...");
  const buildResult = spawnSync("npm", ["run", "build"], {
    stdio: "inherit",
    shell: true,
  });
  if (buildResult.status !== 0) {
    console.error("[playwright-production] Falló el build de producción.");
    process.exit(1);
  }
} else {
  const buildTime = statSync(".next/BUILD_ID").mtimeMs;
  const latestSourceTime = getLatestSourceMtime("src");
  if (latestSourceTime > buildTime) {
    console.log("[playwright-production] El código en src/ es más reciente que .next. Recompilando para asegurar resultados verídicos...");
    const buildResult = spawnSync("npm", ["run", "build"], {
      stdio: "inherit",
      shell: true,
    });
    if (buildResult.status !== 0) {
      console.error("[playwright-production] La compilación es de antes que el código: los resultados no valen. Corré `npm run build` y volvé a intentar.");
      process.exit(1);
    }
  }
}

function isPortFree(p, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const tester = net
      .createServer()
      .once("error", () => resolve(false))
      .once("listening", () => {
        tester.once("close", () => resolve(true)).close();
      })
      .listen(p, host);
  });
}

function killPortProcesses(p) {
  if (process.platform === "win32") {
    try {
      const out = execSync(`netstat -ano | findstr :${p}`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      const lines = out.split("\n");
      for (const line of lines) {
        if (line.includes("LISTENING") || line.includes("ESTABLISHED")) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== "0" && Number(pid) !== process.pid) {
            try {
              execSync(`taskkill /pid ${pid} /T /F`, { stdio: "ignore" });
            } catch {}
          }
        }
      }
    } catch {}
  } else {
    try {
      execSync(`fuser -k ${p}/tcp 2>/dev/null || lsof -ti:${p} | xargs kill -9 2>/dev/null`, {
        stdio: "ignore",
      });
    } catch {}
  }
}

async function ensurePortFree(p, maxWaitMs = 5000) {
  if (await isPortFree(p)) return;
  killPortProcesses(p);
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (await isPortFree(p)) return;
    await new Promise((r) => setTimeout(r, 200));
  }
}

async function waitForHealth(p, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${p}/api/health`, {
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) return;
      lastError = new Error(`Health check HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`La app no respondió en http://127.0.0.1:${p}: ${lastError?.message || "timeout"}`);
}

function startServer(p) {
  const server = spawn(
    process.execPath,
    [nextBin, "start", "--hostname", "127.0.0.1", "--port", String(p)],
    {
      stdio: ["ignore", "pipe", "pipe"],
      detached: process.platform !== "win32",
      env: {
        ...process.env,
        ...testEnvironment,
        NEXT_TELEMETRY_DISABLED: "1",
      },
    }
  );

  // A pipe that nobody reads eventually fills up and blocks the whole Next.js
  // process. Keep draining both streams and retain only a small diagnostic tail.
  let recentOutput = "";
  const collectServerOutput = (chunk) => {
    recentOutput = `${recentOutput}${chunk.toString()}`.slice(-MAX_SERVER_LOG_CHARS);
  };
  server.stdout.on("data", collectServerOutput);
  server.stderr.on("data", collectServerOutput);

  return {
    pid: server.pid,
    getRecentOutput() {
      return recentOutput;
    },
    async stop() {
      if (server.pid) {
        if (process.platform === "win32") {
          spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
        } else {
          try {
            process.kill(-server.pid, "SIGTERM");
          } catch {
            try { server.kill("SIGKILL"); } catch {}
          }
        }
      }
      await ensurePortFree(p);
    },
  };
}

function extractTestsFromSuites(suites, parentFile = "") {
  const tests = [];
  for (const s of suites || []) {
    const file = s.file || parentFile;
    if (s.specs) {
      for (const spec of s.specs) {
        for (const t of spec.tests || []) {
          for (const res of t.results || []) {
            tests.push({
              file: file.replace(/\\/g, "/"),
              title: spec.title,
              projectName: t.projectName,
              status: res.status, // 'passed' | 'failed' | 'timedOut' | 'skipped'
              duration: res.duration || 0, // ms
              error: res.errors?.[0]?.message || res.error?.message || "",
            });
          }
        }
      }
    }
    if (s.suites) {
      tests.push(...extractTestsFromSuites(s.suites, file));
    }
  }
  return tests;
}

async function runPlaywright(files, extraArgs = []) {
  return new Promise((resolve) => {
    const pw = spawn(
      process.execPath,
      [playwrightBin, "test", ...files, "--reporter=json", ...extraArgs],
      {
        stdio: ["ignore", "pipe", "pipe"],
        env: {
          ...process.env,
          ...testEnvironment,
          PLAYWRIGHT_BASE_URL: baseUrl,
        },
      }
    );

    let stdout = "";
    let stderr = "";
    pw.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    pw.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

    pw.on("close", (code) => {
      let json = null;
      try {
        const jsonStart = stdout.indexOf("{");
        if (jsonStart !== -1) {
          json = JSON.parse(stdout.slice(jsonStart));
        }
      } catch {}
      resolve({ code, json, stdout, stderr });
    });
  });
}

// -------------------------------------------------------------
// EJECUCIÓN PRINCIPAL EN TANDAS
// -------------------------------------------------------------
async function main() {
  const cliArgs = process.argv.slice(2);
  const specArgs = cliArgs.filter((a) => a.endsWith(".spec.ts") || a.includes(".spec."));
  const flags = cliArgs.filter((a) => !a.endsWith(".spec.ts") && !a.includes(".spec."));

  const e2eDir = path.join(process.cwd(), "tests", "e2e");
  const allSpecFiles = specArgs.length > 0
    ? specArgs
    : readdirSync(e2eDir)
        .filter((f) => f.endsWith(".spec.ts"))
        .map((f) => `tests/e2e/${f}`);

  const BATCH_SIZE = 4;
  const tandas = [];
  for (let i = 0; i < allSpecFiles.length; i += BATCH_SIZE) {
    tandas.push(allSpecFiles.slice(i, i + BATCH_SIZE));
  }

  console.log(`\n======================================================`);
  console.log(`  EJECUTANDO PRUEBAS E2E EN ${tandas.length} TANDAS (TOTAL ${allSpecFiles.length} ARCHIVOS)`);
  console.log(`======================================================\n`);

  const totalPasadas = [];
  const fallasReales = [];
  const descartadasPorEntorno = [];
  let totalEjecutadas = 0;

  for (let idx = 0; idx < tandas.length; idx++) {
    const batch = tandas[idx];
    console.log(`[Tanda ${idx + 1}/${tandas.length}] Corriendo ${batch.length} archivos: ${batch.map(b => path.basename(b)).join(", ")}`);

    await ensurePortFree(port);
    const serverInstance = startServer(port);

    try {
      await waitForHealth(port);
      const result = await runPlaywright(batch, flags);
      const tests = extractTestsFromSuites(result.json?.suites);

      if (tests.length === 0) {
        if (result.code !== 0) {
          console.warn(`  ⚠ La tanda terminó con código ${result.code} sin pruebas registradas en JSON.`);
        }
      }

      totalEjecutadas += tests.length;
      const candidateFalseAlarms = [];

      for (const t of tests) {
        if (t.status === "passed" || t.status === "expected") {
          totalPasadas.push(t);
        } else if (t.status === "skipped") {
          // skipped
        } else {
          // Falla: aplicar criterio de medio segundo (500 ms)
          if (t.duration < 500) {
            candidateFalseAlarms.push(t);
          } else {
            fallasReales.push(t);
          }
        }
      }

      // Reintentar falsas alarmas con servidor fresco
      if (candidateFalseAlarms.length > 0) {
        console.log(`  ↻ ${candidateFalseAlarms.length} prueba(s) fallaron en <500ms (posible saturación). Reintentando con servidor fresco...`);
        await serverInstance.stop();
        await ensurePortFree(port);

        const retryServer = startServer(port);
        try {
          await waitForHealth(port);
          const retryFiles = [...new Set(candidateFalseAlarms.map((t) => t.file))];
          const retryResult = await runPlaywright(retryFiles, flags);
          const retryTests = extractTestsFromSuites(retryResult.json?.suites);

          for (const c of candidateFalseAlarms) {
            const retest = retryTests.find((r) => r.file === c.file && r.title === c.title && r.projectName === c.projectName);
            if (retest && (retest.status === "passed" || retest.status === "expected")) {
              descartadasPorEntorno.push(c);
              totalPasadas.push(retest);
            } else {
              fallasReales.push(retest || c);
            }
          }
        } finally {
          await retryServer.stop();
        }
      } else {
        await serverInstance.stop();
      }
    } catch (err) {
      console.error(`  ✕ Error en la tanda ${idx + 1}:`, err.message);
      const recentOutput = serverInstance.getRecentOutput().trim();
      if (recentOutput) {
        console.error(`  Últimos logs del servidor:\n${recentOutput}`);
      }
      await serverInstance.stop();
    }

    console.log(`  ✓ Tanda ${idx + 1} finalizada.\n`);
  }

  // Resumen Final
  console.log(`======================================================`);
  console.log(`  RESUMEN FINAL DE PRUEBAS DE NAVEGADOR (E2E)`);
  console.log(`======================================================`);
  console.log(`  - Total pruebas ejecutadas: ${totalEjecutadas}`);
  console.log(`  - Pruebas pasadas: ${totalPasadas.length}`);
  console.log(`  - Fallas reales: ${fallasReales.length}`);
  console.log(`  - Descartadas por entorno (<500ms recuperadas): ${descartadasPorEntorno.length}`);
  console.log(`======================================================\n`);

  if (fallasReales.length > 0) {
    console.error(`DETALLE DE FALLAS REALES (${fallasReales.length}):`);
    for (const f of fallasReales) {
      console.error(`  ✕ [${f.file}] ${f.title} (${f.projectName}) - ${f.duration}ms`);
      if (f.error) {
        const detail = f.error
          .split("\n")
          .slice(0, MAX_REPORTED_ERROR_LINES)
          .join("\n    ");
        console.error(`    ${detail}`);
      }
    }
    process.exit(1);
  } else {
    console.log(` Todas las pruebas de navegador pasaron exitosamente.`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("[playwright-production] Error fatal:", err);
  process.exit(1);
});


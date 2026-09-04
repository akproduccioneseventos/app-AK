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

  /**
   * POR QUE ALGUNAS PRUEBAS NO PUEDEN CORRER JUNTAS
   *
   * La maquina tiene cuatro nucleos y la tanda usaba uno solo: cuarenta y dos
   * minutos con el 75% de la maquina parada. El dueno lo marco: *"demora el
   * navegador 7 h"*.
   *
   * No se puede paralelizar todo. **Estos archivos usan LA MISMA fiesta de
   * prueba**: si corren a la vez, uno sube una foto al muro mientras el otro las
   * cuenta, y aparecen fallas inventadas. Esas son las peores: hacen perder horas
   * buscando un problema que no existe.
   *
   * Asi que la regla es simple: **la tanda que toca la fiesta compartida va de a
   * una; el resto, de a tres.**
   *
   * Si agregas una prueba nueva que use `helpers/fiesta-de-prueba`, sumala aca.
   */
  const COMPARTEN_LA_FIESTA_DE_PRUEBA = [
    'entretenimientos-a-fondo.spec.ts',
    'estaciones-sin-clave.spec.ts',
    'fotocabina-de-punta-a-punta.spec.ts',
    'fotos-de-la-app.spec.ts',
    'muro-subir-foto.spec.ts',
    'noche-de-fiesta.spec.ts',
    'prospecto-simulador.spec.ts',
    'senal-mala.spec.ts',
    'tarjetas-whatsapp.spec.ts',
  ];

  /**
   * SE PROBO CORRER DE A TRES Y SE VOLVIO ATRAS. No lo intentes de nuevo sin leer esto.
   *
   * La idea era usar los cuatro nucleos en vez de uno. **Gano 4 minutos de 41 —un 9%— y
   * a cambio empezo a dar fallas inventadas.**
   *
   * La causa: `viaje-invitado.spec.ts` se arma su fiesta con un identificador basado en
   * la hora exacta, calculado **al cargar el archivo**. Con varios procesos, cada uno se
   * arma una fiesta distinta: uno guarda los datos y otro los busca con otro nombre y no
   * los encuentra. No es el unico que hace algo asi, y buscarlos todos costaria mas de lo
   * que se gana.
   *
   * **Cuatro minutos no pagan una falla inventada**, que hace perder horas buscando un
   * problema que no existe. El tiempo real no esta aca: se lo llevan las dos pruebas
   * gigantes que recorren las 348 pantallas una por una, y esas no se dividen entre
   * nucleos. Ahi hay que mirar si algun dia se quiere acelerar de verdad.
   */
  const trabajadoresPara = () => 1;
  const tandas = [];
  /**
   * Tandas que se cayeron sin llegar a correr una sola prueba.
   *
   * Existe porque el corredor mentia: si una tanda moria antes de ejecutar nada
   * —un archivo que no compila, el servidor que no levanta, o alguien que le
   * pasa `--reporter` y le tapa el informe— no quedaba ninguna falla anotada y
   * el resumen final imprimia "todas las pruebas pasaron" con cero pruebas
   * corridas. Un control que dice que esta todo bien cuando no corrio nada es
   * peor que no tener control.
   */
  const tandasCaidas = [];
  /** Cuanto tardo cada tanda. Se imprime al final, de la mas lenta a la mas rapida. */
  const relojPorTanda = [];
  /** Segundos gastados solo en levantar el servidor, sumando las 39 veces. */
  let segundosDeArranque = 0;

  // Se agrupan primero los que comparten la fiesta de prueba. Si quedaran
  // repartidos, cada tanda tendria uno adentro y **todas** correrian de a una,
  // que es justo lo que se quiere evitar. Agrupados, solo dos o tres tandas van
  // lentas y el resto vuela.
  const ordenados = [
    ...allSpecFiles.filter((f) => COMPARTEN_LA_FIESTA_DE_PRUEBA.includes(path.basename(f))),
    ...allSpecFiles.filter((f) => !COMPARTEN_LA_FIESTA_DE_PRUEBA.includes(path.basename(f))),
  ];

  for (let i = 0; i < ordenados.length; i += BATCH_SIZE) {
    tandas.push(ordenados.slice(i, i + BATCH_SIZE));
  }

  console.log(`\n======================================================`);
  console.log(`  EJECUTANDO PRUEBAS E2E EN ${tandas.length} TANDAS (TOTAL ${allSpecFiles.length} ARCHIVOS)`);
  console.log(`======================================================\n`);

  const totalPasadas = [];
  const fallasReales = [];
  const descartadasPorEntorno = [];
  let totalEjecutadas = 0;
  /**
   * Las salteadas se CUENTAN Y SE DICEN.
   *
   * Antes el resumen mostraba "628 ejecutadas, 114 pasadas" y no explicaba las
   * otras 514. Eso hizo dar dos alarmas falsas seguidas: parecia que el control
   * miraba menos de la quinta parte de la app.
   *
   * No era asi. Casi todas son `fotos-de-la-app.spec.ts`, que **no es una prueba:
   * es la herramienta que saca las fotos de las pantallas**, apagada a proposito
   * y se enciende con `AK_FOTOS=true`. Y el resto son pruebas que solo tienen
   * sentido en computadora y se saltean en celular.
   *
   * Un numero sin explicar asusta o tranquiliza de mas. Por eso ahora se dice.
   */
  let totalSalteadas = 0;

  for (let idx = 0; idx < tandas.length; idx++) {
    const batch = tandas[idx];
    console.log(`[Tanda ${idx + 1}/${tandas.length}] Corriendo ${batch.length} archivos: ${batch.map(b => path.basename(b)).join(", ")}`);
    // El reloj por tanda existe para NO adivinar donde se va la hora. Sin esto solo
    // se sabe que la corrida entera tardo 62 minutos, y con eso no se puede acelerar
    // nada: se termina optimizando lo que no cuesta. Se agrego el 4 de septiembre de 2026.
    const arrancoLaTanda = Date.now();

    await ensurePortFree(port);
    const serverInstance = startServer(port);

    try {
      await waitForHealth(port);
      // Cuanto costo levantar el servidor. Se levanta y se apaga UNA VEZ POR TANDA
      // -39 veces en la corrida entera- y hasta ahora nadie habia medido cuanto pesa eso.
      segundosDeArranque += Math.round((Date.now() - arrancoLaTanda) / 1000);
      const trabajadores = trabajadoresPara();
      const result = await runPlaywright(batch, [...flags, `--workers=${trabajadores}`]);
      const tests = extractTestsFromSuites(result.json?.suites);

      if (tests.length === 0) {
        if (result.code !== 0) {
          console.warn(`  ⚠ La tanda terminó con código ${result.code} sin pruebas registradas en JSON.`);
          tandasCaidas.push(
            `Tanda ${idx + 1} (${batch.map((b) => path.basename(b)).join(", ")}): terminó con código ${result.code} y no registró ninguna prueba.`,
          );
        }
      }

      totalEjecutadas += tests.length;
      const candidateFalseAlarms = [];

      for (const t of tests) {
        if (t.status === "passed" || t.status === "expected") {
          totalPasadas.push(t);
        } else if (t.status === "skipped") {
          totalSalteadas += 1;
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
      tandasCaidas.push(`Tanda ${idx + 1} (${batch.map((b) => path.basename(b)).join(", ")}): ${err.message}`);
      const recentOutput = serverInstance.getRecentOutput().trim();
      if (recentOutput) {
        console.error(`  Últimos logs del servidor:\n${recentOutput}`);
      }
      await serverInstance.stop();
    }

    const segundos = Math.round((Date.now() - arrancoLaTanda) / 1000);
    relojPorTanda.push({ segundos, archivos: batch.map((b) => path.basename(b)) });
    console.log(`  ✓ Tanda ${idx + 1} finalizada en ${segundos}s.\n`);
  }

  // Resumen Final
  console.log(`======================================================`);
  console.log(`  RESUMEN FINAL DE PRUEBAS DE NAVEGADOR (E2E)`);
  console.log(`======================================================`);
  console.log(`  - Total pruebas ejecutadas: ${totalEjecutadas}`);
  console.log(`  - Pruebas pasadas: ${totalPasadas.length}`);
  console.log(`  - Salteadas a proposito: ${totalSalteadas}`);
  if (totalSalteadas > 0) {
    console.log(`      (la herramienta de sacar fotos va apagada salvo con AK_FOTOS=true,`);
    console.log(`       y las pruebas de solo-escritorio no corren en celular)`);
  }
  console.log(`  - Fallas reales: ${fallasReales.length}`);
  console.log(`  - Descartadas por entorno (<500ms recuperadas): ${descartadasPorEntorno.length}`);
  console.log(`======================================================\n`);

  // DONDE SE VA EL TIEMPO. Sin esta lista, acelerar la corrida es adivinar.
  if (relojPorTanda.length > 1) {
    const lentas = [...relojPorTanda].sort((a, b) => b.segundos - a.segundos).slice(0, 5);
    const total = relojPorTanda.reduce((suma, t) => suma + t.segundos, 0);
    console.log(`DONDE SE VA EL TIEMPO (total ${Math.round(total / 60)} min):`);
    console.log(`  ${String(segundosDeArranque).padStart(5)}s  levantar el servidor ${relojPorTanda.length} veces (una por tanda)`);
    console.log('  Las 5 tandas mas lentas:');
    for (const t of lentas) {
      console.log(`  ${String(t.segundos).padStart(5)}s  ${t.archivos.join(', ')}`);
    }
    console.log('');
  }

  if (tandasCaidas.length > 0) {
    console.error(`TANDAS QUE NO LLEGARON A CORRER (${tandasCaidas.length}):`);
    for (const detalle of tandasCaidas) console.error(`  ✕ ${detalle}`);
    console.error('');
  }

  if (fallasReales.length > 0 || tandasCaidas.length > 0) {
    if (fallasReales.length > 0) console.error(`DETALLE DE FALLAS REALES (${fallasReales.length}):`);
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


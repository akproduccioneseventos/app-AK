#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';
import { getAllRoutes } from './helpers/route-inventory.mjs';

const require = createRequire(import.meta.url);
const nextBin = require.resolve('next/dist/bin/next');
const playwrightBin = require.resolve('@playwright/test/cli');

const RAIZ = process.cwd();
const MODO_PUERTA = process.argv.includes('--puerta');
const PUERTO = Number(process.env.PLAYWRIGHT_ROBOT_PORT || 3110);
const WORKERS = Number(process.env.ROBOT_WORKERS || 2);
const BATCH_SIZE = Number(process.env.ROBOT_BATCH_SIZE || 25);
const RESULTADOS_ROBOT = path.join(RAIZ, 'test-results', 'robot', 'resultados.json');
const EXCEPCIONES_PATH = path.join(RAIZ, 'docs', 'robot-excepciones.json');

function construirAmbienteEmulador() {
  const emulatorFirestore = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  const emulatorStorage = process.env.FIREBASE_STORAGE_EMULATOR_HOST || '127.0.0.1:9199';

  return {
    ...process.env,
    NODE_OPTIONS: '--max-old-space-size=4096',
    AK_USE_LOCAL_JSON_ONLY: '',
    AK_ALLOW_LOCAL_JSON_WRITES: '',
    GOOGLE_APPLICATION_CREDENTIALS: '',
    FIREBASE_CLIENT_EMAIL: '',
    FIREBASE_PRIVATE_KEY: '',
    GOOGLE_API_KEY: 'dummy',
    GEMINI_API_KEY: 'dummy',
    MERCADO_PAGO_ACCESS_TOKEN: '',
    MERCADO_PAGO_WEBHOOK_SECRET: '',
    INSTAGRAM_ACCESS_TOKEN: '',
    META_INSTAGRAM_ACCESS_TOKEN: '',
    WHATSAPP_TOKEN: '',
    SMTP_HOST: '',
    GMAIL_CLIENT_SECRET: '',
    GOOGLE_CLIENT_SECRET: '',
    AK_SESSION_SECRET: 'playwright-session-secret-with-enough-entropy',
    FIRESTORE_EMULATOR_HOST: emulatorFirestore,
    FIREBASE_STORAGE_EMULATOR_HOST: emulatorStorage,
    FIREBASE_PROJECT_ID: 'demo-ak-producciones',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-ak-producciones',
    NEXT_PUBLIC_FIREBASE_API_KEY: 'dummy',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-ak-producciones.firebaseapp.com',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-ak-producciones.appspot.com',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
    NEXT_PUBLIC_FIREBASE_APP_ID: '1:000000000000:web:test',
  };
}

function puertoLibre(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.once('listening', () => srv.close(() => resolve(true)));
    srv.listen(port, '127.0.0.1');
  });
}

async function buscarPuertoLibre(inicial) {
  for (let p = inicial; p < inicial + 50; p++) {
    if (await puertoLibre(p)) return p;
  }
  return inicial;
}

async function esperarSalud(url, timeoutMs = 120_000) {
  const limite = Date.now() + timeoutMs;
  while (Date.now() < limite) {
    try {
      const res = await fetch(`${url}/api/health`);
      if (res.ok) return true;
    } catch {
      // sigue intentando
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  return false;
}

function leerExcepciones() {
  if (!fs.existsSync(EXCEPCIONES_PATH)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(EXCEPCIONES_PATH, 'utf8'));
    return Array.isArray(data?.excepciones) ? data.excepciones : [];
  } catch {
    return [];
  }
}

function estaExceptuada(excepciones, ruta, regla) {
  return excepciones.some(
    (e) =>
      e &&
      e.ruta === ruta &&
      (e.regla === regla || e.regla === `robot:${regla}` || `robot:${e.regla}` === regla),
  );
}

async function main() {
  const env = construirAmbienteEmulador();

  // Limpieza inicial de parciales solo cuando !process.env.ROBOT_RUTAS
  const parcialesDir = path.join(RAIZ, 'test-results', 'robot', 'parciales');
  if (!process.env.ROBOT_RUTAS && fs.existsSync(parcialesDir)) {
    fs.rmSync(parcialesDir, { recursive: true, force: true });
  }

  // Siembra inicial con sembrar.ts sobre el emulador
  console.log('[robot] Sembrando base del emulador...');
  const siembra = spawnSync(process.execPath, [path.join(RAIZ, 'tests', 'robot', 'sembrar.ts')], {
    cwd: RAIZ,
    env,
    stdio: 'inherit',
  });
  if (siembra.status !== 0) {
    console.error('[robot] Falló el sembrado del emulador.');
    process.exit(siembra.status || 1);
  }

  // Armar lotes de rutas (batches)
  let batches = [];
  if (process.env.ROBOT_RUTAS && process.env.ROBOT_RUTAS.trim() !== '') {
    batches = [process.env.ROBOT_RUTAS];
  } else {
    const todasRutas = getAllRoutes().map((r) => r.routeTemplate);
    const tamLote = Math.max(1, BATCH_SIZE);
    for (let i = 0; i < todasRutas.length; i += tamLote) {
      batches.push(todasRutas.slice(i, i + tamLote).join(','));
    }
  }

  const registrosPorRuta = new Map();

  let ultimoStatus = 0;
  let servidorActual = null;

  const globalExitHandler = () => {
    if (servidorActual && !servidorActual.killed) {
      try {
        servidorActual.kill('SIGTERM');
      } catch {}
    }
  };
  const globalSigintHandler = () => {
    globalExitHandler();
    process.exit(130);
  };

  process.on('exit', globalExitHandler);
  process.on('SIGINT', globalSigintHandler);

  try {
    for (let loteIndex = 0; loteIndex < batches.length; loteIndex++) {
      const batchStr = batches[loteIndex];
      console.log(`[robot] Procesando lote ${loteIndex + 1} de ${batches.length} (rutas: ${batchStr})`);

      const puertoLibreLote = await buscarPuertoLibre(PUERTO + loteIndex * 10);
      const baseUrl = `http://127.0.0.1:${puertoLibreLote}`;

      const usarStart = fs.existsSync(path.join(RAIZ, '.next', 'BUILD_ID'));
      const nextArgs = [nextBin, usarStart ? 'start' : 'dev', '--hostname', '127.0.0.1', '--port', String(puertoLibreLote)];
      console.log(`[robot] Levantando servidor Next (${usarStart ? 'start' : 'dev'}) en ${baseUrl}...`);

      const server = spawn(process.execPath, nextArgs, {
        cwd: RAIZ,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      servidorActual = server;

      const logs = [];
      const pushLog = (d) => {
        logs.push(d.toString());
        if (logs.length >= 50) {
          logs.shift();
        }
      };
      server.stdout.on('data', pushLog);
      server.stderr.on('data', pushLog);

      let deteniendo = false;
      let serverSalio = false;
      server.on('exit', (code, signal) => {
        serverSalio = true;
        if (!deteniendo) {
          console.error(`[robot] Servidor Next salió inesperadamente (code=${code}, signal=${signal}). Últimos logs:\n${logs.slice(-15).join('')}`);
        }
      });

      const detenerServidorActual = async () => {
        deteniendo = true;
        if (!serverSalio) {
          try {
            server.kill('SIGTERM');
          } catch {}
        }
        const limiteEspera = Date.now() + 1500;
        while (!serverSalio && Date.now() < limiteEspera) {
          await new Promise((r) => setTimeout(r, 100));
        }
        if (!serverSalio) {
          try {
            server.kill('SIGKILL');
          } catch {}
        }
      };

      try {
        const listo = await esperarSalud(baseUrl);
        if (!listo) {
          console.error('[robot] El servidor Next no respondió a tiempo en /api/health.');
          console.error(logs.slice(-20).join(''));
          ultimoStatus = 1;
          break;
        }

        console.log(`[robot] Corriendo Playwright auditor-robot con ${WORKERS} worker(s)...`);
        const pw = spawnSync(
          process.execPath,
          [playwrightBin, 'test', '--project=auditor-robot', `--workers=${WORKERS}`],
          {
            cwd: RAIZ,
            env: {
              ...env,
              ROBOT_RUTAS: batchStr,
              PLAYWRIGHT_BASE_URL: baseUrl,
              PLAYWRIGHT_ROBOT_EMULATOR: 'true',
            },
            stdio: 'inherit',
          },
        );

        if (pw.status !== 0) {
          ultimoStatus = pw.status || 1;
        }
      } finally {
        if (fs.existsSync(parcialesDir)) {
          try {
            const archivosParciales = fs.readdirSync(parcialesDir).filter((f) => f.endsWith('.json'));
            for (const archivo of archivosParciales) {
              try {
                const contenido = fs.readFileSync(path.join(parcialesDir, archivo), 'utf8');
                const data = JSON.parse(contenido);
                if (data && (data.routeTemplate || archivo)) {
                  registrosPorRuta.set(data.routeTemplate || archivo, data);
                }
              } catch {}
            }
          } catch {}
        }
        await detenerServidorActual();
        servidorActual = null;
      }
    }

    // Consolidar atómicamente todos los .json de test-results/robot/parciales en resultados.json
    try {
      if (fs.existsSync(parcialesDir)) {
        const archivos = fs.readdirSync(parcialesDir).filter((f) => f.endsWith('.json'));
        for (const archivo of archivos) {
          try {
            const data = JSON.parse(fs.readFileSync(path.join(parcialesDir, archivo), 'utf8'));
            if (data && (data.routeTemplate || archivo)) {
              registrosPorRuta.set(data.routeTemplate || archivo, data);
            }
          } catch {}
        }
      }
      const registros = Array.from(registrosPorRuta.values());
      if (registros.length > 0) {
        fs.mkdirSync(parcialesDir, { recursive: true });
        for (const reg of registros) {
          if (reg && reg.routeTemplate) {
            const nombreLimpio = reg.routeTemplate.replace(/[^a-zA-Z0-9_-]/g, '_') + '.json';
            try {
              fs.writeFileSync(path.join(parcialesDir, nombreLimpio), JSON.stringify(reg, null, 2) + '\n', 'utf8');
            } catch {}
          }
        }
        fs.mkdirSync(path.dirname(RESULTADOS_ROBOT), { recursive: true });
        const tmpFile = path.join(path.dirname(RESULTADOS_ROBOT), `resultados.${process.pid}.${Date.now()}.tmp`);
        fs.writeFileSync(tmpFile, JSON.stringify(registros, null, 2) + '\n', 'utf8');
        fs.renameSync(tmpFile, RESULTADOS_ROBOT);
      }
    } catch (e) {
      console.warn('[robot] Advertencia al consolidar parciales:', e);
    }

    console.log('[robot] Actualizando docs/lista-de-cierre.mjs --actualizar...');
    spawnSync(process.execPath, [path.join(RAIZ, 'scripts', 'lista-de-cierre.mjs'), '--actualizar'], {
      cwd: RAIZ,
      env,
      stdio: 'inherit',
    });

    if (ultimoStatus !== 0 && !fs.existsSync(RESULTADOS_ROBOT)) {
      process.exit(ultimoStatus || 1);
    }

    if (MODO_PUERTA && fs.existsSync(RESULTADOS_ROBOT)) {
      const resultados = JSON.parse(fs.readFileSync(RESULTADOS_ROBOT, 'utf8'));
      const excepciones = leerExcepciones();
      const filtro = (process.env.ROBOT_RUTAS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const relevantes = filtro.length > 0
        ? resultados.filter((r) => filtro.includes(r.routeTemplate) || filtro.includes(r.pathname))
        : resultados;

      const rojas = [];
      for (const r of relevantes) {
        for (const f of r.fallas || []) {
          if (!estaExceptuada(excepciones, f.ruta || r.routeTemplate, f.regla)) {
            rojas.push(f);
          }
        }
      }

      if (rojas.length > 0) {
        console.error(`\n[robot] FRENA LA PUERTA: ${rojas.length} falla(s) en pantallas tocadas:`);
        for (const f of rojas) {
          console.error(`  - ${f.ruta} [${f.regla}] (${f.elemento}): ${f.motivo}`);
        }
        process.exit(1);
      }
      console.log('[robot] Todas las pantallas tocadas pasaron las reglas del auditor robot.');
    }
  } finally {
    globalExitHandler();
  }
}

main().catch((err) => {
  console.error('[robot] Error fatal:', err);
  process.exit(1);
});


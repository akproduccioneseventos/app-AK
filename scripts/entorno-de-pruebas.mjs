#!/usr/bin/env node
/**
 * ENTORNO DE PRUEBAS AISLADO (orden 92, Codex, 27 de septiembre de 2026).
 *
 * Codex pidió recorrer lo interno como organizador, cliente e invitado **sin tocar fiestas ni cobros
 * reales**. Esto levanta la app compilada con datos de mentira en archivos locales y SIN ninguna
 * credencial de un servicio real: no puede leer ni escribir la base de producción, ni mandar un
 * mensaje, ni cobrar. No se paga nada por mes.
 *
 * Uso: `npm run entorno:pruebas`. Imprime cómo entrar con cada rol y queda andando hasta Ctrl+C.
 * Al cerrarse borra la fiesta de prueba que sembró.
 *
 * Cómo se aísla, en dos capas:
 * 1. **El ambiente del proceso** se arma DESDE CERO (`ambienteAislado`): sólo pasa lo que está en
 *    `PERMITIDAS`, así que una credencial que se agregue mañana a la máquina tampoco se cuela.
 * 2. **Los archivos de la carpeta** (orden 93, Codex): Next lee solo `.env.local`, `.env.production`
 *    y compañía desde la carpeta donde corre. Por eso la app se compila y se sirve desde una
 *    **copia descartable** del código commiteado (`prepararCarpetaAislada`): los `.env*` están
 *    ignorados por git y no viajan, y los datos reales de la carpeta tampoco. Antes de arrancar se
 *    calcula el ambiente que Next va a ver de verdad (`ambienteQueVeNext`) y, si aparece cualquier
 *    nombre que no esté en la lista, **no arranca**. No se toca ningún archivo de claves del usuario.
 *
 * Corre lo COMMITEADO: lo que esté sin guardar en la carpeta no entra a la copia.
 */
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const createRequireDesde = (dir) => createRequire(path.join(dir, 'package.json'));

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUERTO = Number(process.env.AK_ENTORNO_PUERTO || 3300);
const CLAVE_DEL_EQUIPO = 'entorno-aislado-ak';
const SALIDA = path.join(os.tmpdir(), `ak-entorno-aislado-${process.pid}.json`);

/** Lo único que pasa del ambiente de la máquina: nada que abra un servicio real. */
const PERMITIDAS = ['PATH', 'HOME', 'LANG', 'LC_ALL', 'TMPDIR', 'TEMP', 'TMP', 'SYSTEMROOT', 'NODE_OPTIONS',
  'PLAYWRIGHT_BROWSERS_PATH', 'PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH', 'PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD'];

/** Lo que se fuerza: datos locales, proyecto de demostración y claves falsas. */
const FORZADAS = {
  NODE_ENV: 'production',
  NEXT_TELEMETRY_DISABLED: '1',
  AK_USE_LOCAL_JSON_ONLY: 'true',
  AK_ALLOW_LOCAL_JSON_WRITES: 'true',
  AK_ENTORNO_AISLADO: 'true',
  AK_SESSION_SECRET: 'playwright-session-secret-with-enough-entropy',
  APP_PASSWORD: CLAVE_DEL_EQUIPO,
  GOOGLE_API_KEY: 'dummy',
  GEMINI_API_KEY: 'dummy',
  FIREBASE_PROJECT_ID: 'demo-ak-producciones',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-ak-producciones',
  NEXT_PUBLIC_FIREBASE_API_KEY: 'dummy',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-ak-producciones.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-ak-producciones.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:000000000000:web:test',
};

export function ambienteAislado(ambienteDeLaMaquina = process.env) {
  const limpio = {};
  for (const nombre of PERMITIDAS) {
    if (ambienteDeLaMaquina[nombre] !== undefined) limpio[nombre] = ambienteDeLaMaquina[nombre];
  }
  return { ...limpio, ...FORZADAS };
}

/** Los archivos que Next carga solo desde la carpeta donde corre. */
const ARCHIVOS_QUE_LEE_NEXT = /^\.env(\.(local|production|development|test)(\.local)?)?$/;

/**
 * Copia descartable del código commiteado, sin ningún `.env*` que Next pueda leer. Usa un
 * `git worktree`: sólo trae lo que está en git, y los `.env*` están ignorados.
 */
export function prepararCarpetaAislada(raiz, destino) {
  execFileSync('git', ['-C', raiz, 'worktree', 'add', '--detach', '--force', destino, 'HEAD'], { stdio: 'ignore' });
  const modulos = path.join(raiz, 'node_modules');
  if (fs.existsSync(modulos)) fs.symlinkSync(modulos, path.join(destino, 'node_modules'), 'dir');
  // Si alguno estuviera commiteado, se saca de la COPIA (nunca del original).
  for (const nombre of fs.readdirSync(destino)) {
    if (ARCHIVOS_QUE_LEE_NEXT.test(nombre)) fs.rmSync(path.join(destino, nombre), { force: true });
  }
  const quedan = fs.readdirSync(destino).filter((n) => ARCHIVOS_QUE_LEE_NEXT.test(n));
  if (quedan.length) throw new Error(`La copia aislada todavía tiene ${quedan.join(', ')}`);
  return destino;
}

export function borrarCarpetaAislada(raiz, destino) {
  try { execFileSync('git', ['-C', raiz, 'worktree', 'remove', '--force', destino], { stdio: 'ignore' }); } catch {}
  try { fs.rmSync(destino, { recursive: true, force: true }); } catch {}
  try { execFileSync('git', ['-C', raiz, 'worktree', 'prune'], { stdio: 'ignore' }); } catch {}
}

/**
 * El ambiente que Next va a ver DE VERDAD en esa carpeta: el del proceso más lo que cargue de
 * archivos. Se calcula con el mismo cargador que usa Next (`@next/env`), en un proceso aparte.
 */
export function ambienteQueVeNext(carpeta, ambienteDelProceso) {
  const cargador = createRequireDesde(RAIZ).resolve('@next/env');
  const r = spawnSync(process.execPath, ['-e', `
    const { loadEnvConfig } = require(${JSON.stringify(cargador)});
    loadEnvConfig(process.argv[1], false, { info() {}, error() {} });
    process.stdout.write(JSON.stringify(Object.keys(process.env).sort()));
  `, carpeta], { env: { ...ambienteDelProceso, NODE_ENV: 'production' }, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`No se pudo calcular el ambiente: ${r.stderr}`);
  return JSON.parse(r.stdout);
}

/** Nombres que no deberían estar: todo lo que no vino de la lista permitida ni de lo forzado. */
export function nombresQueSobran(nombres) {
  const esperados = new Set([...PERMITIDAS, ...Object.keys(FORZADAS)]);
  // Las que agrega el propio Node al arrancar un proceso no son de la máquina ni de archivos.
  return nombres.filter((n) => !esperados.has(n) && !['_', 'PWD', 'SHLVL', 'OLDPWD', '__NEXT_PROCESSED_ENV'].includes(n));
}

const ambiente = ambienteAislado();

if (process.env.AK_ENTORNO_PROBAR_CARPETA) {
  // Para la prueba: prepara la copia de OTRO repositorio (uno de mentira, con `.env*` inventados),
  // calcula lo que vería Next y devuelve sólo los nombres. Nunca valores.
  const origen = process.env.AK_ENTORNO_PROBAR_CARPETA;
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-entorno-prueba-'));
  fs.rmSync(destino, { recursive: true, force: true });
  try {
    // Sin copia (sólo para la prueba): muestra que el control SÍ ve lo que dejan los archivos.
    const sinCopia = process.env.AK_ENTORNO_PROBAR_SIN_COPIA === 'true';
    if (!sinCopia) prepararCarpetaAislada(origen, destino);
    const nombres = ambienteQueVeNext(sinCopia ? origen : destino, ambienteAislado(process.env));
    console.log(JSON.stringify({ nombres, sobran: nombresQueSobran(nombres) }));
  } finally {
    borrarCarpetaAislada(origen, destino);
  }
  process.exit(0);
}

if (process.env.AK_ENTORNO_SOLO_MOSTRAR_AMBIENTE === 'true') {
  // Para la prueba: sólo los nombres, nunca los valores de la máquina.
  console.log(JSON.stringify({ nombres: Object.keys(ambiente).sort(), forzadas: FORZADAS }));
  process.exit(0);
}

// 0. La copia descartable, y el control de lo que Next va a ver en ella.
const CARPETA = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-entorno-aislado-'));
fs.rmSync(CARPETA, { recursive: true, force: true });
console.log(`\n[entorno aislado] Preparando una copia descartable del código en ${CARPETA}...`);
prepararCarpetaAislada(RAIZ, CARPETA);
const sobran = nombresQueSobran(ambienteQueVeNext(CARPETA, ambiente));
if (sobran.length) {
  borrarCarpetaAislada(RAIZ, CARPETA);
  console.error(`\nNO SE ARRANCA: el servidor vería estas variables que no son de prueba: ${sobran.join(', ')}`);
  process.exit(1);
}

function correr(comando, args, extra = {}) {
  const r = spawnSync(comando, args, { cwd: CARPETA, stdio: 'inherit', env: ambiente, ...extra });
  if (r.status !== 0) {
    console.error(`\nNo se pudo: ${comando} ${args.join(' ')}`);
    process.exit(r.status || 1);
  }
}

// 1. Compilar con el ambiente aislado. Se compila siempre: una compilación hecha con otro ambiente
//    puede traer adentro los datos públicos del proyecto real.
console.log('\n[entorno aislado] Compilando la app con datos de prueba (unos minutos)...');
correr(process.execPath, ['scripts/build-next-with-memory.mjs']);

// 2. Sembrar la fiesta de prueba y sus enlaces.
console.log('\n[entorno aislado] Sembrando la fiesta de prueba...');
fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
correr(process.execPath, [path.join('node_modules', '@playwright', 'test', 'cli.js'), 'test', '--config', 'playwright.entorno.config.ts'], {
  env: { ...ambiente, AK_ENTORNO_SALIDA: SALIDA },
});
const sembrado = JSON.parse(fs.readFileSync(SALIDA, 'utf8'));

// 3. Levantar el servidor.
const base = `http://127.0.0.1:${PUERTO}`;
const servidor = spawn(process.execPath, [path.join('node_modules', 'next', 'dist', 'bin', 'next'), 'start', '--hostname', '127.0.0.1', '--port', String(PUERTO)], {
  cwd: CARPETA, stdio: 'inherit', env: ambiente,
});

let limpio = false;
const limpiar = () => {
  if (limpio) return;
  limpio = true;
  try { servidor.kill('SIGTERM'); } catch {}
  // La fiesta sembrada vive dentro de la copia: se va con ella.
  borrarCarpetaAislada(RAIZ, CARPETA);
  try { fs.unlinkSync(SALIDA); } catch {}
};
process.on('SIGINT', () => { limpiar(); process.exit(0); });
process.on('SIGTERM', () => { limpiar(); process.exit(0); });
servidor.on('exit', (codigo) => { limpiar(); process.exit(codigo ?? 0); });

setTimeout(() => {
  const l = (ruta) => `${base}${ruta}`;
  console.log(`
============================================================
  ENTORNO DE PRUEBAS AISLADO — nada de esto toca datos reales
============================================================
  Organizador (equipo AK)
    ${l('/login')}   clave: ${CLAVE_DEL_EQUIPO}
    Fiesta de prueba: ${l(`/fiestas/${sembrado.fiestaId}/centro`)}

  Cliente (portal)
    ${l(`/portal-cliente/${sembrado.fiestaId}`)}   clave del portal: ${sembrado.clavePortal}

  Invitados (cada uno con su enlace)
${sembrado.invitados.map((i) => `    ${i.nombre}: ${l(i.ruta)}`).join('\n')}
    Confirmación pública: ${l(`/invitacion/${sembrado.fiestaId}/rsvp`)}

  Estaciones (operador)
${sembrado.estaciones.map((e) => `    ${e.nombre}: ${l(e.ruta)}`).join('\n')}

  Sin credenciales reales: no se manda ningún mensaje, no se cobra, y la IA
  contesta con el efecto local. Ctrl+C para cerrar (borra la fiesta de prueba).
============================================================
`);
}, 8000);

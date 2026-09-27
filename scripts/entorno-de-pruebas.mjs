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
 * Cómo se aísla, y por qué con lista de lo permitido y no de lo prohibido: el servidor arranca con un
 * ambiente armado DESDE CERO (`ambienteAislado`). Si mañana alguien agrega una credencial nueva al
 * ambiente de la máquina, no se cuela: sólo pasa lo que está en `PERMITIDAS`.
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUERTO = Number(process.env.AK_ENTORNO_PUERTO || 3300);
const CLAVE_DEL_EQUIPO = 'entorno-aislado-ak';
const SALIDA = path.join(RAIZ, 'test-results', 'entorno-aislado.json');

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

const ambiente = ambienteAislado();

if (process.env.AK_ENTORNO_SOLO_MOSTRAR_AMBIENTE === 'true') {
  // Para la prueba: sólo los nombres, nunca los valores de la máquina.
  console.log(JSON.stringify({ nombres: Object.keys(ambiente).sort(), forzadas: FORZADAS }));
  process.exit(0);
}

function correr(comando, args, extra = {}) {
  const r = spawnSync(comando, args, { cwd: RAIZ, stdio: 'inherit', env: ambiente, ...extra });
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
  cwd: RAIZ, stdio: 'inherit', env: ambiente,
});

const limpiar = () => {
  for (const archivo of sembrado.archivos || []) {
    try { fs.unlinkSync(archivo); } catch {}
  }
  try { servidor.kill('SIGTERM'); } catch {}
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

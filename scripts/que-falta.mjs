#!/usr/bin/env node
/**
 * ¿QUE FALTA? — la lista completa, sin que nadie tenga que preguntar.
 *
 * **Lo dijo el dueño el 2 de septiembre de 2026: *"si no pregunto, no queda"*,
 * *"el algoritmo debe decirlo solo"*.** Tenia razon, y era el agujero que
 * quedaba: habia cuatro listas -las ordenes, lo que la app dice tener, lo
 * arreglado y la comparacion con el rubro- y **ninguna las juntaba ni las
 * ordenaba por importancia**. Para saber que faltaba habia que preguntar, y lo
 * que no se pregunta no se hace.
 *
 * Esto junta TODO y lo ordena por lo que le cuesta plata al negocio:
 *
 *   1. Lo ROTO que ve un cliente o un invitado.
 *   2. Lo que se pidio y no se hizo (las ordenes a medias).
 *   3. Lo que tienen las plataformas del rubro y nosotros no.
 *
 * Se imprime solo al abrir cada sesion. Nadie tiene que acordarse de correrlo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const raiz = process.cwd();
const leer = (p) => {
  try { return fs.readFileSync(path.join(raiz, p), 'utf8'); } catch { return null; }
};

/** Las mismas comprobaciones que usa `npm run ordenes?`. */
function comprobar(tipo, valor) {
  if (tipo === 'archivo' || tipo === 'prueba') return fs.existsSync(path.join(raiz, valor));
  if (tipo === 'usa') {
    const m = valor.match(/^(.+?)\s+en\s+(.+)$/);
    if (!m) return false;
    const c = leer(m[2].trim());
    return Boolean(c && c.includes(m[1].trim()));
  }
  return false;
}

function ordenesAMedias() {
  const dir = path.join(raiz, 'docs', 'ordenes');
  if (!fs.existsSync(dir)) return [];
  const salida = [];
  for (const archivo of fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
    const txt = fs.readFileSync(path.join(dir, archivo), 'utf8');
    const lineas = [...txt.matchAll(/```comprobar\n([\s\S]*?)```/g)]
      .flatMap((b) => b[1].split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')));
    if (lineas.length === 0) continue;
    const faltan = lineas.filter((l) => {
      const [tipo, ...resto] = l.split(':');
      return !comprobar(tipo.trim(), resto.join(':').trim());
    });
    if (faltan.length > 0) {
      const titulo = (txt.match(/^#\s+(.+)$/m) || [, archivo])[1];
      salida.push({ archivo, titulo, hechas: lineas.length - faltan.length, total: lineas.length, faltan });
    }
  }
  return salida;
}

function rubro() {
  const txt = leer('docs/COMPARACION-CON-EL-RUBRO.md');
  if (!txt) return [];
  return [...txt.matchAll(/```rubro ([^\n]+)\n([\s\S]*?)```/g)].map((b) => {
    const funciones = b[2].split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
      .map((linea) => {
        const [nombre, ...resto] = linea.split('::');
        const cond = resto.join('::').trim();
        if (!cond || /^FALTA$/i.test(cond)) return { nombre: nombre.trim(), tenemos: false, sinCopiar: false };
        if (/^NO SE COPIA$/i.test(cond)) return { nombre: nombre.trim(), tenemos: true, sinCopiar: true };
        const [tipo, ...v] = cond.split(':');
        return { nombre: nombre.trim(), tenemos: comprobar(tipo.trim(), v.join(':').trim()), sinCopiar: false };
      });
    return { modulo: b[1].trim(), funciones };
  }).sort((a, b) => {
    const p = (m) => m.funciones.filter((f) => f.tenemos).length / m.funciones.length;
    return p(a) - p(b);
  });
}

function pantallasRotas() {
  try {
    const d = JSON.parse(leer('docs/pantallas-rotas-conocidas.json'));
    return d.rotas || [];
  } catch { return []; }
}

/** Una devolucion abierta es trabajo pedido que todavia no volvio. */
function devolucionesAbiertas() {
  const dir = path.join(raiz, 'docs', 'ordenes');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.startsWith('DEVOLUCION') && f.endsWith('.md'));
}

const VE_EL_CLIENTE = /^\/(portal|portal-cliente|invitado|invitacion|evento|landing|bodas|quinceaneras|public|simulador)/;

// De que version se esta hablando. **Importa y confunde si no se dice:** esto
// mide la rama en la que estas parado, y el trabajo que todavia esta en la rama
// de Gemini figura como faltante hasta que se fusiona.
let rama = '';
try {
  rama = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
} catch { /* sin git, no pasa nada */ }

console.log('\n' + '='.repeat(64));
console.log('  QUÉ FALTA — ordenado por lo que le cuesta plata al negocio');
if (rama) {
  console.log(`  Medido sobre la rama "${rama}". Lo que todavia esta sin fusionar`);
  console.log('  figura como faltante aunque ya este programado en otra rama.');
}
console.log('='.repeat(64));

// ---- 1. Lo roto que ve un cliente o un invitado ----
const rotas = pantallasRotas();
const rotasQueSeVen = rotas.filter((r) => VE_EL_CLIENTE.test(r));
console.log('\n1. ROTO — pantallas que no abren bien\n');
if (rotas.length === 0) {
  console.log('   Ninguna. ');
} else {
  console.log(`   ${rotas.length} en total, y ${rotasQueSeVen.length} las ve un cliente o un invitado:`);
  for (const r of rotasQueSeVen) console.log(`      ${r}`);
  const internas = rotas.filter((r) => !VE_EL_CLIENTE.test(r));
  if (internas.length > 0) console.log(`   Las otras ${internas.length} son internas: ${internas.join(', ')}`);
}

// ---- 2. Lo que se pidio y no se hizo ----
const medias = ordenesAMedias();
console.log('\n2. PEDIDO Y NO HECHO\n');
if (medias.length === 0) {
  console.log('   Nada. Todas las órdenes con comprobación están hechas.');
} else {
  for (const o of medias) {
    console.log(`   ${o.titulo}`);
    console.log(`      va ${o.hechas} de ${o.total}  ->  docs/ordenes/${o.archivo}`);
    for (const f of o.faltan.slice(0, 3)) console.log(`      falta: ${f}`);
    if (o.faltan.length > 3) console.log(`      ...y ${o.faltan.length - 3} más`);
  }
}

const devoluciones = devolucionesAbiertas();
if (devoluciones.length > 0) {
  console.log('\n   Devoluciones escritas, esperando que vuelvan:');
  for (const d of devoluciones) console.log(`      docs/ordenes/${d}`);
}

// ---- 3. Contra el rubro ----
console.log('\n3. LO QUE TIENEN ELLOS Y NOSOTROS NO — del más flojo al mejor\n');
for (const m of rubro()) {
  const tenemos = m.funciones.filter((f) => f.tenemos).length;
  const faltan = m.funciones.filter((f) => !f.tenemos);
  const marca = faltan.length === 0 ? 'completo' : `faltan ${faltan.length}`;
  console.log(`   ${m.modulo}: ${tenemos} de ${m.funciones.length}  (${marca})`);
  for (const f of faltan.slice(0, 4)) console.log(`      ${f.nombre}`);
  if (faltan.length > 4) console.log(`      ...y ${faltan.length - 4} más`);
}

console.log('\n' + '='.repeat(64));
console.log('  Esto se imprime solo al abrir cada sesión.');
console.log('  Para verlo cuando quieras: npm run "falta?"');
console.log('='.repeat(64) + '\n');

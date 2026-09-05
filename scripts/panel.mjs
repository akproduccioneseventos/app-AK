#!/usr/bin/env node
/**
 * EL PANEL — una sola pantalla que dice como esta cada modulo de la app.
 *
 * **Pedido del dueño, 4 de septiembre de 2026:** *"un panel que mida mejoras,
 * faltas y usos de cada modulo y seccion"*, *"para poder terminar algun dia"*.
 *
 * Tenia razon en el diagnostico: no faltaban controles, **sobraban**. Habia seis
 * lugares que contestaban pedazos de la misma pregunta -las ordenes, lo que la app
 * dice tener, lo ya arreglado, la comparacion con el rubro, las pantallas rotas y
 * las devoluciones- y para saber como venia la mano habia que juntar los seis.
 *
 * Esto no mide nada nuevo: **junta lo que ya esta medido** y lo muestra por modulo.
 * Se arma solo, no hay que cargar nada a mano.
 *
 *   npm run panel     -> escribe panel-de-la-app.html
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const raiz = process.cwd();
const leer = (p) => {
  try { return fs.readFileSync(path.join(raiz, p), 'utf8'); } catch { return null; }
};

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

/** Los archivos de prueba de navegador, leidos una sola vez. */
const pruebasE2E = (() => {
  const dir = path.join(raiz, 'tests', 'e2e');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.spec.ts'))
    .map((f) => ({ nombre: f, texto: fs.readFileSync(path.join(dir, f), 'utf8') }));
})();

/**
 * De que carpeta vive cada modulo. NO se escribe a mano: se deduce de las propias
 * lineas del bloque del rubro, que ya dicen en que archivo esta cada funcion.
 * Escrito a mano se despega del codigo en un mes.
 */
function carpetaDelModulo(funciones) {
  const cuenta = new Map();
  for (const f of funciones) {
    const m = (f.donde || '').match(/src\/app\/([^/]+(?:\/[^/[]+)?)/);
    if (!m) continue;
    const clave = m[1].replace(/\/$/, '');
    cuenta.set(clave, (cuenta.get(clave) || 0) + 1);
  }
  let mejor = null;
  for (const [clave, n] of cuenta) if (!mejor || n > mejor[1]) mejor = [clave, n];
  return mejor ? mejor[0] : null;
}

function rubro() {
  const txt = leer('docs/COMPARACION-CON-EL-RUBRO.md');
  if (!txt) return [];
  return [...txt.matchAll(/```rubro ([^\n]+)\n([\s\S]*?)```/g)].map((b) => {
    const funciones = b[2].split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
      .map((linea) => {
        const [nombre, ...resto] = linea.split('::');
        const cond = resto.join('::').trim();
        const base = { nombre: nombre.trim(), donde: '' };
        if (!cond || /^FALTA$/i.test(cond)) return { ...base, tenemos: false, sinCopiar: false };
        if (/^NO SE COPIA$/i.test(cond)) return { ...base, tenemos: true, sinCopiar: true };
        const [tipo, ...v] = cond.split(':');
        const valor = v.join(':').trim();
        const donde = (valor.match(/\sen\s+(.+)$/) || [, valor])[1] || '';
        return { ...base, donde, tenemos: comprobar(tipo.trim(), valor), sinCopiar: false };
      });
    const carpeta = carpetaDelModulo(funciones);
    const mirado = carpeta
      ? pruebasE2E.filter((p) => p.texto.includes(carpeta.split('/').pop())).map((p) => p.nombre)
      : [];
    return { modulo: b[1].trim(), funciones, carpeta, pruebas: mirado };
  }).sort((a, b) => {
    const p = (m) => m.funciones.filter((f) => f.tenemos).length / m.funciones.length;
    return p(a) - p(b);
  });
}

function ordenesAMedias() {
  const dir = path.join(raiz, 'docs', 'ordenes');
  if (!fs.existsSync(dir)) return [];
  const salida = [];
  for (const archivo of fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
    const txt = fs.readFileSync(path.join(dir, archivo), 'utf8');
    const lineas = [...txt.matchAll(/```comprobar\r?\n([\s\S]*?)```/g)]
      .flatMap((b) => b[1].split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')));
    if (lineas.length === 0) continue;
    const faltan = lineas.filter((l) => {
      const [tipo, ...resto] = l.split(':');
      return !comprobar(tipo.trim(), resto.join(':').trim());
    });
    const titulo = (txt.match(/^#\s+(.+)$/m) || [, archivo])[1];
    salida.push({ archivo, titulo, hechas: lineas.length - faltan.length, total: lineas.length, faltan });
  }
  return salida;
}

function pantallasRotas() {
  try { return JSON.parse(leer('docs/pantallas-rotas-conocidas.json')).rotas || []; } catch { return []; }
}

function devolucionesAbiertas() {
  const dir = path.join(raiz, 'docs', 'ordenes');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.startsWith('DEVOLUCION') && f.endsWith('.md'));
}

function matafuegos() {
  const txt = leer('CLAUDE.md') || '';
  const bloque = txt.match(/\| Error que pasó \| Matafuego \|([\s\S]*?)\n\n/);
  if (!bloque) return 0;
  return bloque[1].split('\n').filter((l) => l.trim().startsWith('|') && !l.includes('---')).length;
}

const VE_EL_CLIENTE = /^\/(portal|portal-cliente|invitado|invitacion|evento|landing|bodas|quinceaneras|public|simulador)/;

let rama = '';
try { rama = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(); } catch {}

const modulos = rubro();
const ordenes = ordenesAMedias();
const rotas = pantallasRotas();
const devoluciones = devolucionesAbiertas();

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const hoy = new Date().toLocaleDateString('es-UY', { day: 'numeric', month: 'long', year: 'numeric' });

const totalRubro = modulos.reduce((s, m) => s + m.funciones.length, 0);
const tenemosRubro = modulos.reduce((s, m) => s + m.funciones.filter((f) => f.tenemos).length, 0);

function filaModulo(m) {
  const tenemos = m.funciones.filter((f) => f.tenemos).length;
  const faltan = m.funciones.filter((f) => !f.tenemos);
  const pct = Math.round((tenemos / m.funciones.length) * 100);
  const estado = pct === 100 ? 'ok' : pct >= 75 ? 'medio' : 'flojo';
  return `
  <article class="modulo ${estado}">
    <div class="cabeza">
      <h3>${esc(m.modulo)}</h3>
      <span class="cuenta"><b>${tenemos}</b><span>/${m.funciones.length}</span></span>
    </div>
    <div class="riel"><i style="width:${pct}%"></i></div>
    <p class="mira">${m.pruebas.length > 0
      ? `${m.pruebas.length} prueba${m.pruebas.length === 1 ? '' : 's'} de navegador lo miran`
      : '<span class="sinojo">Ninguna prueba de navegador lo mira</span>'}</p>
    ${faltan.length === 0
      ? '<p class="listo">Completo contra el rubro</p>'
      : `<ul class="faltan">${faltan.map((f) => `<li>${esc(f.nombre)}</li>`).join('')}</ul>`}
  </article>`;
}

const html = `<title>Panel de AK</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;800&family=Instrument+Sans:wght@400;500;600&display=swap">
<style>
  :root{
    --fondo:#f4f2f2; --papel:#fff; --borde:#e3dedf; --tinta:#1a1618; --suave:#6f6a6c;
    --acento:#b0182a; --ok:#1c7a5b; --medio:#a86200; --flojo:#b0182a; --sombra:0 1px 2px rgba(26,22,24,.05);
  }
  @media (prefers-color-scheme:dark){ :root:not([data-theme="light"]){
    --fondo:#121012; --papel:#1b181a; --borde:#2c2729; --tinta:#f3f0f1; --suave:#a29b9e;
    --acento:#f0788a; --ok:#4cc79b; --medio:#e0a13a; --flojo:#f0788a; --sombra:none;
  }}
  :root[data-theme="dark"]{
    --fondo:#121012; --papel:#1b181a; --borde:#2c2729; --tinta:#f3f0f1; --suave:#a29b9e;
    --acento:#f0788a; --ok:#4cc79b; --medio:#e0a13a; --flojo:#f0788a; --sombra:none;
  }
  *{box-sizing:border-box}
  body{background:var(--fondo);color:var(--tinta);margin:0;padding:40px 20px 80px;
       font:400 16px/1.55 "Instrument Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
       font-variant-numeric:tabular-nums}
  .caja{max-width:1000px;margin:0 auto}
  .eyebrow{font-family:"Archivo",sans-serif;font-weight:600;font-size:12px;letter-spacing:.14em;
           text-transform:uppercase;color:var(--acento);margin:0 0 6px}
  h1{font-family:"Archivo",sans-serif;font-weight:800;font-size:clamp(30px,5vw,42px);line-height:1.05;
     letter-spacing:-.025em;margin:0 0 8px;text-wrap:balance}
  .sub{color:var(--suave);margin:0 0 32px;font-size:15px;max-width:62ch}
  h2{font-family:"Archivo",sans-serif;font-weight:600;font-size:13px;letter-spacing:.12em;
     text-transform:uppercase;color:var(--suave);margin:44px 0 14px;
     padding-bottom:8px;border-bottom:1px solid var(--borde)}

  .cifras{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1px;
          background:var(--borde);border:1px solid var(--borde);border-radius:10px;overflow:hidden}
  .cifra{background:var(--papel);padding:16px 18px}
  .cifra b{display:block;font-family:"Archivo",sans-serif;font-weight:800;font-size:26px;
           line-height:1.1;letter-spacing:-.02em}
  .cifra span{font-size:13px;color:var(--suave);display:block;margin-top:2px}
  .cifra.mal b{color:var(--flojo)}

  .grilla{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
  .modulo{background:var(--papel);border:1px solid var(--borde);border-left:3px solid var(--medio);
          border-radius:8px;padding:14px 16px 15px;box-shadow:var(--sombra)}
  .modulo.ok{border-left-color:var(--ok)} .modulo.flojo{border-left-color:var(--flojo)}
  .cabeza{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
  .modulo h3{font-family:"Archivo",sans-serif;font-weight:600;font-size:16px;margin:0;letter-spacing:-.01em}
  .cuenta{font-family:"Archivo",sans-serif;white-space:nowrap;color:var(--suave);font-size:13px}
  .cuenta b{font-size:17px;font-weight:800;color:var(--tinta)}
  .riel{height:4px;background:var(--borde);border-radius:2px;overflow:hidden;margin:11px 0 9px}
  .riel i{display:block;height:100%;background:var(--medio)}
  .ok .riel i{background:var(--ok)} .flojo .riel i{background:var(--flojo)}
  .mira{font-size:13px;color:var(--suave);margin:0}
  .sinojo{color:var(--flojo);font-weight:600}
  .listo{color:var(--ok);font-size:14px;margin:9px 0 0;font-weight:500}
  .faltan{margin:9px 0 0;padding:0;list-style:none;font-size:14px}
  .faltan li{padding:3px 0 3px 15px;position:relative;color:var(--tinta)}
  .faltan li::before{content:"";position:absolute;left:0;top:11px;width:6px;height:1px;background:var(--suave)}

  .lista{background:var(--papel);border:1px solid var(--borde);border-radius:8px;
         padding:6px 18px;box-shadow:var(--sombra)}
  .lista ul{margin:0;padding:0;list-style:none}
  .lista li{padding:9px 0;border-bottom:1px solid var(--borde);font-size:15px;
            display:flex;justify-content:space-between;gap:14px;align-items:baseline}
  .lista li:last-child{border-bottom:none}
  .quien{font-size:13px;color:var(--suave);white-space:nowrap}
  .quien.grave{color:var(--flojo);font-weight:600}
  .avance{font-family:"Archivo",sans-serif;font-size:13px;color:var(--suave);white-space:nowrap}
  .avance.hecho{color:var(--ok)}
  .pie{color:var(--suave);font-size:13px;margin-top:44px;border-top:1px solid var(--borde);padding-top:16px}
  code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;
       background:var(--fondo);border:1px solid var(--borde);padding:1px 6px;border-radius:4px}
</style>
<div class="caja">
  <p class="eyebrow">AK Producciones · Salto</p>
  <h1>Como viene cada parte de la app</h1>
  <p class="sub">Se arma solo con lo que ya esta medido en el proyecto: no hay nada cargado a mano.
     Al ${esc(hoy)}${rama ? `, sobre la version <code>${esc(rama)}</code>` : ''}.
     Lo que todavia no se fusiono figura como faltante.</p>

  <div class="cifras">
    <div class="cifra"><b>${tenemosRubro} de ${totalRubro}</b><span>funciones que ofrece el rubro</span></div>
    <div class="cifra${rotas.length ? ' mal' : ''}"><b>${rotas.length}</b><span>pantallas que no abren bien</span></div>
    <div class="cifra"><b>${ordenes.filter((o) => o.faltan.length > 0).length}</b><span>pedidos a medias</span></div>
    <div class="cifra"><b>${devoluciones.length}</b><span>devoluciones esperando</span></div>
    <div class="cifra"><b>${matafuegos()}</b><span>controles que frenan errores</span></div>
  </div>

  <h2>Modulo por modulo, del mas flojo al mejor</h2>
  <div class="grilla">${modulos.map(filaModulo).join('')}</div>

  <h2>Pantallas que no abren bien</h2>
  <div class="lista">${rotas.length === 0 ? '<ul><li>Ninguna.</li></ul>' : `<ul>${rotas.map((r) => {
    const laVe = VE_EL_CLIENTE.test(r);
    return `<li><span>${esc(r)}</span><span class="quien${laVe ? ' grave' : ''}">${laVe ? 'la ve un cliente' : 'interna'}</span></li>`;
  }).join('')}</ul>`}</div>

  <h2>Lo que se pidio, y como va</h2>
  <div class="lista"><ul>${ordenes.map((o) =>
    `<li><span>${esc(o.titulo)}</span><span class="avance${o.faltan.length ? '' : ' hecho'}">${o.faltan.length ? `${o.hechas} de ${o.total}` : 'listo'}</span></li>`
  ).join('')}</ul></div>

  ${devoluciones.length === 0 ? '' : `<h2>Devuelto a quien lo programo, esperando que vuelva</h2>
  <div class="lista"><ul>${devoluciones.map((d) =>
    `<li><span>${esc(d.replace(/^DEVOLUCION-|\.md$/g, '').replace(/-/g, ' '))}</span></li>`).join('')}</ul></div>`}

  <p class="pie">Se rehace con <code>npm run panel</code>.</p>
</div>
`;

const salida = path.join(raiz, 'panel-de-la-app.html');
fs.writeFileSync(salida, html, 'utf8');
console.log(`\nPanel armado: ${path.relative(raiz, salida)}`);
console.log(`  ${tenemosRubro} de ${totalRubro} funciones del rubro · ${rotas.length} pantallas rotas · ${devoluciones.length} devoluciones\n`);

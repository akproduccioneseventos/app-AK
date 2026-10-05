#!/usr/bin/env node
/**
 * QUE PANTALLAS TOCA ESTE CAMBIO.
 *
 * **Por que existe.** El recorrido abria las 358 pantallas siempre, aunque el
 * cambio tocara una sola. Son quince minutos por corrida, y el dueno lo dijo
 * claro el 8 de septiembre de 2026: *"tiene que recorrer lo que se cambia, no
 * todo"*.
 *
 * **Como decide, y por que no se le escapa nada.** No mira solo el archivo de la
 * pantalla: arma el arbol de quien importa a quien y sube. Si se toca un boton
 * que usan cuarenta pantallas, salen las cuarenta.
 *
 * **Y ante la duda, recorre todo.** Si se toca algo que afecta a la app entera
 * -la configuracion, el armazon comun, el guardian de sesion, las dependencias-
 * o si lo tocado alcanza a mas de la mitad de las pantallas, devuelve `TODO`.
 * Un recorrido de mas cuesta minutos; uno de menos deja pasar una pantalla rota.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const RAIZ = process.cwd();
const SRC = path.join(RAIZ, 'src');
const APP = path.join(SRC, 'app');

/** Tocar cualquiera de estos cambia toda la app: se recorre entera. */
const AFECTAN_TODO = [
  /^next\.config\.js$/,
  /^middleware\.ts$/,
  /^package(-lock)?\.json$/,
  /^tailwind\.config\./,
  /^src\/app\/layout\.tsx$/,
  /^src\/app\/globals\.css$/,
  /^src\/middleware\.ts$/,
  /^scripts\/helpers\/route-inventory\.mjs$/,
  /^tests\/e2e\/recorrido-de-pantallas\.spec\.ts$/,
];

function archivosCambiados() {
  const base = spawnSync('git merge-base origin/main HEAD', { shell: true, encoding: 'utf8' });
  const ref = base.status === 0 && base.stdout.trim() ? base.stdout.trim() : null;
  if (!ref) return null; // sin base no se puede acotar: se recorre todo
  const guardados = spawnSync(`git diff --name-only ${ref}...HEAD`, { shell: true, encoding: 'utf8' });
  const sinGuardar = spawnSync('git status --porcelain', { shell: true, encoding: 'utf8' });
  if (guardados.status !== 0) return null;
  return [
    ...(guardados.stdout || '').split('\n'),
    ...(sinGuardar.stdout || '').split('\n').map((l) => l.slice(3)),
  ]
    .map((f) => f.trim())
    .filter(Boolean);
}

function todosLosArchivosDeCodigo(dir, acc = []) {
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const completo = path.join(dir, entrada.name);
    if (entrada.isDirectory()) todosLosArchivosDeCodigo(completo, acc);
    else if (/\.(ts|tsx|js|jsx)$/.test(entrada.name)) acc.push(completo);
  }
  return acc;
}

const EXTENSIONES = ['.ts', '.tsx', '.js', '.jsx'];

function resolverImport(desde, especificador) {
  let base;
  if (especificador.startsWith('@/')) base = path.join(SRC, especificador.slice(2));
  else if (especificador.startsWith('.')) base = path.resolve(path.dirname(desde), especificador);
  else return null; // biblioteca de afuera
  for (const ext of EXTENSIONES) {
    if (fs.existsSync(base + ext)) return base + ext;
  }
  for (const ext of EXTENSIONES) {
    const indice = path.join(base, 'index' + ext);
    if (fs.existsSync(indice)) return indice;
  }
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  return null;
}

/**
 * Qué nombres trae un import: `['a','b']`, o `'*'` si trae todo (por defecto, `* as`, dinámico).
 */
export function nombresImportados(sentencia) {
  if (/^import\s*\(/.test(sentencia)) return '*';
  const llaves = sentencia.match(/\{([^}]*)\}/);
  const sinLlaves = sentencia.replace(/\{[^}]*\}/, '');
  if (/\*\s+as\s/.test(sinLlaves) || /^import\s+[A-Za-z_$][\w$]*\s*(,|from)/.test(sinLlaves)) return '*';
  if (!llaves) return '*';
  return llaves[1].split(',').map((n) => n.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim()).filter(Boolean);
}

/** Mapa: archivo -> (quien lo importa -> qué nombres le trae). */
function armarQuienUsaAQuien(archivos) {
  const usadoPor = new Map();
  const regex = /(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g;
  for (const archivo of archivos) {
    let texto;
    try { texto = fs.readFileSync(archivo, 'utf8'); } catch { continue; }
    let m;
    while ((m = regex.exec(texto))) {
      // `import type` no lleva nada a la pantalla: cambiar ese archivo no cambia lo que se ve.
      if (esSoloTipo(texto, m.index)) continue;
      const destino = resolverImport(archivo, m[1]);
      if (!destino) continue;
      const antes = texto.slice(0, m.index);
      const inicio = Math.max(antes.lastIndexOf('import '), antes.lastIndexOf('export '), antes.lastIndexOf('import('));
      const nombres = m[0].startsWith('import') ? '*' : nombresImportados(texto.slice(inicio, m.index + m[0].length));
      if (!usadoPor.has(destino)) usadoPor.set(destino, new Map());
      const previos = usadoPor.get(destino).get(archivo);
      usadoPor.get(destino).set(archivo, previos === '*' || nombres === '*' ? '*' : [...(previos || []), ...nombres]);
    }
  }
  return usadoPor;
}

const DECLARACION = /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:const|let|var|function\*?|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/;

/**
 * Qué nombres exportados cambiaron en un archivo, mirando en qué declaración cae cada renglón
 * tocado. Si un cambio cae fuera de un `export …` (un ayudante interno, los imports), devuelve
 * `'*'`: no se puede saber a quién afecta. Pedido del dueño el 2/10/2026: probar sólo lo tocado.
 */
export function nombresCambiadosDesde(lineasNuevas, renglonesTocados) {
  const nombres = new Set();
  for (const n of renglonesTocados) {
    // Un comentario o un renglón en blanco no cambia nada de lo que corre.
    const propio = (lineasNuevas[n - 1] ?? '').trim();
    if (propio === '' || /^(\/\/|\/\*|\*)/.test(propio)) continue;
    let encontrado = null;
    for (let i = Math.min(n, lineasNuevas.length) - 1; i >= 0; i--) {
      const linea = lineasNuevas[i];
      // Sólo cuenta un renglón que empieza código; el texto de un string largo no.
      if (/^(export|const|let|var|function|async|class|interface|type|enum|import|declare)\b/.test(linea)) {
        const d = linea.match(DECLARACION);
        encontrado = d ? d[1] : '*';
        break;
      }
    }
    if (!encontrado || encontrado === '*') return '*';
    nombres.add(encontrado);
  }
  return [...nombres];
}

/**
 * Dentro de un archivo que usa `nombres`, qué exporta que dependa de ellos. Parte el archivo en
 * declaraciones de primer nivel y sigue el uso hasta que no crece. Un uso suelto (fuera de una
 * declaración con nombre) devuelve `'*'`.
 */
export function exportsQueUsan(texto, nombres) {
  if (nombres === '*') return '*';
  const lineas = texto.split('\n');
  const bloques = [];
  let actual = null;
  for (const linea of lineas) {
    if (/^\S/.test(linea) && !/^[}\])]/.test(linea) && !/^\/[/*]|^\*/.test(linea)) {
      const d = linea.match(/^(export\s+)?(?:default\s+)?(?:async\s+)?(?:const|let|var|function\*?|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/);
      actual = { nombre: d ? d[2] : null, exportado: !!(d && d[1]), suelto: !d && !/^(import|export\s*\{|export\s+\*|'use |"use )/.test(linea), texto: '' };
      bloques.push(actual);
    }
    if (actual) actual.texto += linea + '\n';
  }
  const usados = new Set(nombres);
  const toca = (t) => [...usados].some((n) => new RegExp(`(^|[^\\w$.])${n.replace(/[$]/g, '\\$')}(?![\\w$])`).test(t));
  let creció = true;
  while (creció) {
    creció = false;
    for (const b of bloques) {
      if (!b.nombre || usados.has(b.nombre)) continue;
      if (toca(b.texto)) { usados.add(b.nombre); creció = true; }
    }
  }
  if (bloques.some((b) => b.suelto && toca(b.texto))) return '*';
  return bloques.filter((b) => b.exportado && usados.has(b.nombre)).map((b) => b.nombre);
}

function nombresCambiadosEnGit(rel) {
  const base = spawnSync('git merge-base origin/main HEAD', { shell: true, encoding: 'utf8' });
  const ref = base.status === 0 ? base.stdout.trim() : '';
  if (!ref) return '*';
  const diff = spawnSync(`git diff -U0 ${ref} -- "${rel}"`, { shell: true, encoding: 'utf8' });
  if (diff.status !== 0) return '*';
  const renglones = [];
  for (const m of (diff.stdout || '').matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
    const desde = Number(m[1]);
    const cuantos = m[2] === undefined ? 1 : Number(m[2]);
    if (cuantos === 0) renglones.push(Math.max(1, desde));
    for (let i = 0; i < cuantos; i++) renglones.push(desde + i);
  }
  if (renglones.length === 0) return '*';
  let lineas;
  try { lineas = fs.readFileSync(path.join(RAIZ, rel), 'utf8').split('\n'); } catch { return '*'; }
  return nombresCambiadosDesde(lineas, renglones);
}

/** Si el `from` en esa posición cierra un `import type …` o `export type …`. */
export function esSoloTipo(texto, posicion) {
  const antes = texto.slice(0, posicion);
  const inicio = Math.max(antes.lastIndexOf('import '), antes.lastIndexOf('export '));
  if (inicio === -1) return false;
  return /^(import|export)\s+type\s/.test(antes.slice(inicio));
}

function rutaDePagina(archivo) {
  const rel = path.relative(APP, path.dirname(archivo)).replace(/\\/g, '/');
  const segmentos = rel ? rel.split('/') : [];
  const visibles = segmentos.filter((s) => !(s.startsWith('(') && s.endsWith(')')));
  return '/' + visibles.join('/');
}

export function pantallasTocadas() {
  return pantallasTocadasDesde(archivosCambiados());
}

/**
 * La parte que se puede probar sin git: se le pasa la lista de archivos
 * cambiados y devuelve las pantallas, o `TODO`.
 */
/**
 * Codigo que SOLO corre contra la base de verdad. Las pruebas de navegador y el recorrido corren
 * con la base de prueba local (`AK_USE_LOCAL_JSON_ONLY`), asi que no lo ejecutan nunca: tocarlo
 * no puede cambiar nada de lo que ellas ven. Lo cuidan sus pruebas de Jest.
 *
 * Medido el 25 de septiembre de 2026: un cambio en `generic-json-store.ts` hacia correr las 84
 * pruebas de navegador (veinte minutos) sin que ninguna pasara por ese codigo.
 */
export const SOLO_CON_LA_BASE_REAL = [
  'src/lib/firebase-sync.ts',
  'src/lib/generic-json-store.ts',
  'src/lib/marca-de-lectura.ts',
];


/**
 * CODIGO QUE CORRE SOLO EN EL SERVIDOR (5 de octubre de 2026, el dueño: *"no es toda la app, es solo
 * esas cosas; 40 minutos deberia ser 5"*).
 *
 * Medido ese dia: cambiar un permiso adentro de `presupuestos.ts` hacia correr las 380 pruebas de
 * navegador, porque esa accion la importan 126 pantallas y, subiendo de importacion en importacion
 * (componentes, armazones), terminaba "alcanzando" las 370. Pero un cambio adentro de una accion del
 * servidor no cambia como se DIBUJA una pantalla: cambia lo que contesta cuando se la llama. Eso lo
 * cuidan sus pruebas de Jest (corren todas, siempre) y las pruebas de navegador que la nombran.
 *
 * Por eso, desde un archivo del servidor se sigue por el servidor (una accion que usa el permiso) y
 * se llega SOLO a la primera pantalla o componente que lo usa, sin seguir subiendo ni expandir armazones: el recorrido abre esas pantallas para ver que
 * no se rompan, y las pruebas de navegador se eligen por nombre (`pruebas-que-tocan.mjs`).
 */
export function esSoloDelServidor(relativo, texto) {
  const rel = relativo.replace(/\\/g, '/');
  if (rel.startsWith('src/app/api/')) return true;
  const contenido = texto ?? (() => { try { return fs.readFileSync(path.join(RAIZ, rel), 'utf8'); } catch { return ''; } })();
  return /^\s*(['"])use server\1/.test(contenido) || /import\s+['"]server-only['"]/.test(contenido);
}

export function pantallasTocadasDesde(cambiadosTodos, nombresDe = nombresCambiadosEnGit, opciones = {}) {
  if (!cambiadosTodos) return 'TODO';
  const cambiados = cambiadosTodos.filter((f) => !SOLO_CON_LA_BASE_REAL.includes(f));
  if (cambiados.length === 0) return [];
  if (cambiados.some((f) => AFECTAN_TODO.some((p) => p.test(f)))) return 'TODO';

  const archivos = todosLosArchivosDeCodigo(SRC);
  const usadoPor = armarQuienUsaAQuien(archivos);

  const semillas = cambiados
    .filter((f) => f.startsWith('src/'))
    .map((f) => path.join(RAIZ, f))
    // Sólo archivos: una carpeta nueva sin seguimiento (datos de la corrida) llegaba como "cambio"
    // y leerla rompía el recorrido (5/10/2026).
    .filter((f) => fs.existsSync(f) && fs.statSync(f).isFile());
  if (semillas.length === 0) return [];

  // Se sigue de archivo en archivo llevando QUÉ nombres cambiaron: a quien importa uno de esos
  // nombres le cambian sólo las partes que lo usan, y eso es lo que sigue subiendo.
  const alcanzados = new Set(semillas);
  const llevados = new Map();
  const cola = [];
  // Lo que sale de un archivo del servidor llega sólo a quien lo importa directo (ver arriba).
  const soloUnSalto = new Set();
  const directos = new Set();
  const pasosDeServidor = new Map();
  for (const semilla of semillas) {
    const rel = path.relative(RAIZ, semilla).replace(/\\/g, '/');
    const propios = nombresDe(rel);
    const texto = fs.readFileSync(semilla, 'utf8');
    llevados.set(semilla, propios === '*' ? '*' : exportsQueUsan(texto, propios));
    if (esSoloDelServidor(rel, texto)) soloUnSalto.add(semilla);
    cola.push(semilla);
  }
  const textoDe = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return ''; } };
  while (cola.length) {
    const actual = cola.pop();
    const cambiaron = llevados.get(actual);
    for (const [quien, trae] of usadoPor.get(actual) || []) {
      const usa = cambiaron === '*' || trae === '*' ? '*' : trae.filter((n) => cambiaron.includes(n));
      if (usa !== '*' && usa.length === 0) continue;
      const nuevos = usa === '*' ? '*' : exportsQueUsan(textoDe(quien), usa);
      const previos = llevados.get(quien);
      const juntos = previos === '*' || nuevos === '*' ? '*' : [...new Set([...(previos || []), ...nuevos])];
      const crecio = !alcanzados.has(quien) || (previos !== '*' && (juntos === '*' || juntos.length > previos.length));
      if (soloUnSalto.has(actual)) {
        const relQuien = path.relative(RAIZ, quien).replace(/\\/g, '/');
        if (esSoloDelServidor(relQuien, textoDe(quien))) {
          // Servidor que usa servidor (una acción que usa el permiso): se sigue UN paso más por el
          // servidor, no indefinidamente. Medido: siguiendo la cadena entera, `presupuestos.ts`
          // llegaba a `fiesta.actions.ts` y de ahí a todas las pantallas.
          if ((pasosDeServidor.get(actual) ?? 0) >= (opciones.pasosDeServidor ?? 1)) continue;
          pasosDeServidor.set(quien, (pasosDeServidor.get(actual) ?? 0) + 1);
          soloUnSalto.add(quien);
        } else {
          // La primera pantalla o componente que lo usa: se anota y no se sigue subiendo.
          if (!alcanzados.has(quien)) directos.add(quien);
          alcanzados.add(quien);
          llevados.set(quien, juntos);
          continue;
        }
      }
      if (directos.has(quien)) directos.delete(quien);
      alcanzados.add(quien);
      llevados.set(quien, juntos);
      if (crecio) cola.push(quien);
    }
  }

  const rutas = new Set();
  for (const archivo of alcanzados) {
    const nombre = path.basename(archivo);
    if (!archivo.startsWith(APP)) continue;
    if (nombre === 'page.tsx' || nombre === 'page.ts') {
      rutas.add(rutaDePagina(archivo));
    } else if ((nombre === 'layout.tsx' || nombre === 'template.tsx') && semillas.includes(archivo)) {
      // Sólo si el armazón MISMO cambió (5/10/2026). Si cambió algo que el armazón usa —el
      // asistente flotante, por ejemplo—, las pruebas de humo ya abren el armazón; expandirlo a
      // todas sus pantallas hacía correr las 380 pruebas por un cambio en el botón de voz.
      // Un armazon manda sobre todas las pantallas que cuelgan de el.
      const carpeta = path.dirname(archivo);
      for (const otro of archivos) {
        if (otro.startsWith(carpeta) && /page\.tsx?$/.test(otro)) rutas.add(rutaDePagina(otro));
      }
    }
  }

  const totalPantallas = archivos.filter((f) => f.startsWith(APP) && /page\.tsx?$/.test(f)).length;
  if (rutas.size > totalPantallas * 0.5) return 'TODO';
  return [...rutas];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = pantallasTocadas();
  if (r === 'TODO') console.log('TODO');
  else console.log(r.join(','));
}

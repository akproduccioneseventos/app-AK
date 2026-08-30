#!/usr/bin/env node
/**
 * EL CONTROL DE PROMESAS
 *
 * Los otros controles preguntan "¿esto se rompe?". Este pregunta otra cosa:
 * "¿esto que se agregó HACE lo que dice que hace?".
 *
 * Nació de tres fallas reales, todas con la misma forma: código escrito, que
 * compilaba, con las pruebas en verde, y que en la pantalla no hacía nada.
 *
 *   1. El GIF animado de la fotocabina estaba escrito y NADIE LO LLAMABA.
 *   2. El tablero de la noche mostraba un cero escrito a mano: el dato nunca
 *      llegaba.
 *   3. 147 de 225 pruebas de navegador sólo confirmaban que la pantalla ABRÍA,
 *      sin mirar el resultado.
 *
 * Por eso mira tres cosas, y por cada una frena:
 *
 *   A) ¿ALGUIEN LO LLAMA?  Lo nuevo que nadie importa está muerto.
 *   B) ¿TIENE QUIEN LO PRUEBE?  Una pantalla o una acción nueva sin una sola
 *      prueba que la nombre es una promesa sin respaldo.
 *   C) ¿LA PRUEBA TERMINA EL TRABAJO?  Una prueba nueva donde TODAS las
 *      comprobaciones son "se ve" no prueba nada: la pantalla puede abrir vacía.
 *
 * Es a propósito CONSERVADOR: sólo avisa de lo que está seguro. Vale más que se
 * le escape algo a que llene la pantalla de falsas alarmas y se deje de mirar.
 *
 *   node scripts/lo-que-se-dijo-es-lo-que-es.mjs           (lo que cambió)
 *   node scripts/lo-que-se-dijo-es-lo-que-es.mjs --todo    (la app entera)
 */

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const MIRAR_TODO = process.argv.includes('--todo') || process.argv.includes('--trinquete');
const MODO_TRINQUETE = process.argv.includes('--trinquete');
const ARCHIVO_DEUDA = 'docs/deuda-medida.json';

function sh(comando) {
  const r = spawnSync(comando, { shell: true, encoding: 'utf8' });
  return { ok: r.status === 0, salida: `${r.stdout || ''}${r.stderr || ''}` };
}

/** Contra qué se compara: la versión principal de ahora. */
function baseDeComparacion() {
  for (const ref of ['origin/main', 'main']) {
    const { ok, salida } = sh(`git merge-base ${ref} HEAD`);
    if (ok && salida.trim()) return salida.trim();
  }
  return null;
}

function archivosQueCambiaron() {
  if (MIRAR_TODO) {
    const { ok, salida } = sh('git ls-files src tests');
    if (!ok) return null;
    return salida
      .split('\n')
      .map((s) => s.trim().replace(/\\/g, '/'))
      .filter(Boolean)
      .filter((f) => /\.tsx?$/.test(f));
  }
  const base = baseDeComparacion();
  if (!base) return null;
  const { ok, salida } = sh(`git diff --name-only --diff-filter=ACMR ${base}...HEAD`);
  if (!ok) return null;
  return salida
    .split('\n')
    .map((s) => s.trim().replace(/\\/g, '/'))
    .filter(Boolean)
    .filter((f) => /\.tsx?$/.test(f));
}

function leer(archivo) {
  try {
    return readFileSync(archivo, 'utf8');
  } catch {
    return null;
  }
}

/**
 * El índice de nombres.
 *
 * Buscar cada nombre uno por uno tardaba una eternidad al recorrer la app
 * entera. Se lee todo una sola vez y se arma una guía: qué nombre aparece en
 * qué archivos. Después cada consulta es instantánea.
 */
let INDICE = null;

function armarIndice() {
  if (INDICE) return INDICE;
  const { ok, salida } = sh('git ls-files src tests');
  if (!ok) return null;
  const guia = new Map();
  const archivos = salida
    .split('\n')
    .map((s) => s.trim().replace(/\\/g, '/'))
    .filter(Boolean)
    .filter((f) => /\.(ts|tsx|js|mjs)$/.test(f));
  for (const archivo of archivos) {
    const texto = leer(archivo);
    if (texto === null) continue;
    for (const palabra of new Set(texto.match(/[A-Za-z_][\w]*/g) || [])) {
      let donde = guia.get(palabra);
      if (!donde) guia.set(palabra, (donde = new Set()));
      donde.add(archivo);
    }
    // Las rutas de pantalla no son palabras sueltas: se guardan enteras.
    for (const ruta of new Set(texto.match(/\/[a-z0-9][a-z0-9\-\/[\]]*/gi) || [])) {
      let donde = guia.get(ruta);
      if (!donde) guia.set(ruta, (donde = new Set()));
      donde.add(archivo);
    }
  }
  INDICE = guia;
  return INDICE;
}

/** Busca un nombre en el código, sin contar el archivo donde vive. */
function quienLoNombra(nombre, exceptoEste, soloEn) {
  const guia = armarIndice();
  if (!guia) return [];
  const donde = guia.get(nombre);
  if (!donde) return [];
  const exceptoNorm = exceptoEste?.replace(/\\/g, '/');
  return [...donde].filter((f) => {
    const fnorm = f.replace(/\\/g, '/');
    return fnorm !== exceptoNorm && (!soloEn || soloEn.some((pre) => fnorm.startsWith(pre.replace(/\\/g, '/'))));
  });
}

/* ------------------------------------------------------------------ */
/* A) ¿alguien lo llama?                                              */
/* ------------------------------------------------------------------ */

/** Las pantallas y los layouts los llama Next por convención: no hace falta importarlos. */
function loLlamaElSistema(archivo) {
  return /src\/app\/(.*\/)?(page|layout|route|template|loading|error|global-error|not-found|sitemap|robots|manifest|opengraph-image|icon|apple-icon)\.tsx?$/.test(
    archivo
  );
}

function nombresQueExporta(texto) {
  const nombres = new Set();
  const patrones = [
    /export\s+(?:async\s+)?function\s+([A-Za-z_][\w]*)/g,
    /export\s+const\s+([A-Za-z_][\w]*)/g,
    /export\s+default\s+function\s+([A-Za-z_][\w]*)/g,
    /export\s+(?:async\s+)?(?:class|type|interface|enum)\s+([A-Za-z_][\w]*)/g,
  ];
  for (const p of patrones) {
    let m;
    while ((m = p.exec(texto)) !== null) nombres.add(m[1]);
  }
  // La forma `export { useToast, toast }` al final del archivo. Sin esto se
  // contaba mal: quedaba a la vista un solo nombre suelto sin usar y el archivo
  // entero se marcaba como muerto cuando en realidad lo usa media app.
  const enLlaves = /export\s*\{([^}]*)\}(?!\s*from)/g;
  let bloque;
  while ((bloque = enLlaves.exec(texto)) !== null) {
    for (const parte of bloque[1].split(',')) {
      const nombre = parte.trim().split(/\s+as\s+/).pop()?.trim();
      if (nombre && /^[A-Za-z_][\w]*$/.test(nombre)) nombres.add(nombre);
    }
  }
  return [...nombres];
}

/* ------------------------------------------------------------------ */
/* C) ¿la prueba termina el trabajo?                                  */
/* ------------------------------------------------------------------ */

/** Comprobaciones que sólo miran que algo esté dibujado. No prueban el resultado. */
const SOLO_MIRA = /\.(toBeVisible|toBeAttached|toBeTruthy|toBeDefined|toBeInTheDocument)\s*\(/;

/** Comprobaciones que miran el RESULTADO: un texto, un número, un valor, una cuenta. */
const MIRA_EL_RESULTADO =
  /\.(toHaveText|toContainText|toContain|toHaveValue|toHaveCount|toHaveURL|toHaveAttribute|toEqual|toStrictEqual|toMatch|toMatchObject|toBeGreaterThan|toBeLessThan|toBeCloseTo|toHaveLength|toHaveBeenCalled\w*|toHaveScreenshot)\s*\(|\.toBe\s*\(\s*(?!true\s*\)|false\s*\))/;

/**
 * Las pruebas que recorren TODAS las pantallas de corrido no prueban ninguna.
 *
 * Hay una que arma la lista leyendo las carpetas y visita las 348 pantallas.
 * Es útil —detecta una pantalla que explota al abrir— pero sólo mira que la
 * pantalla ABRA. Contarla como prueba de cada pantalla es exactamente el
 * agujero por el que se coló la fotocabina rota: la auditoría daba verde y en
 * la fiesta no funcionaba.
 */
function esUnRecorridoDeTodo(texto) {
  return /readdirSync|readdir\(/.test(texto) && /src[/\\]app/.test(texto);
}

function esArchivoDePrueba(archivo) {
  return /(^tests[/\\]|__tests__[/\\]|\.spec\.tsx?$|\.test\.tsx?$)/.test(archivo);
}

/* ------------------------------------------------------------------ */

const hallazgos = [];

function avisar(gravedad, archivo, que, porque) {
  hallazgos.push({ gravedad, archivo, que, porque });
}

const archivos = archivosQueCambiaron();

if (archivos === null) {
  console.error('\nEl control de promesas NO PUDO MIRAR: no se pudo leer la lista de archivos.');
  console.error('No se sigue: un control que no mira no puede decir que está todo bien.\n');
  process.exit(1);
}

const deCodigo = archivos.filter((f) => f.startsWith('src/') && !esArchivoDePrueba(f));
const dePrueba = archivos.filter((f) => esArchivoDePrueba(f));

for (const archivo of deCodigo) {
  if (!existsSync(archivo)) continue;
  const texto = leer(archivo);
  if (texto === null) continue;

  // A) lo escrito que nadie llama
  if (!loLlamaElSistema(archivo)) {
    const exportados = nombresQueExporta(texto);
    const huerfanos = exportados.filter(
      (n) => quienLoNombra(n, archivo, null).length === 0
    );
    if (exportados.length > 0 && huerfanos.length === exportados.length) {
      avisar(
        'frena',
        archivo,
        `nadie lo llama (${huerfanos.slice(0, 3).join(', ')})`,
        'Está escrito y no lo usa nadie: en la pantalla no pasa nada.'
      );
    }
  }

  // B) pantallas y acciones nuevas sin una sola prueba que las nombre
  const esPantalla = /src\/app\/.*\/page\.tsx$/.test(archivo);
  const esAccion = /src\/app\/actions\//.test(archivo);
  if (esPantalla || esAccion) {
    // Las carpetas entre paréntesis agrupan archivos y NO aparecen en la
    // dirección que ve el usuario: /(app)/admin es /admin. Contarlas daba
    // falsas alarmas en casi todas las pantallas internas.
    const ruta = esPantalla
      ? archivo
          .replace(/^src\/app/, '')
          .replace(/\/page\.tsx$/, '')
          .replace(/\/\([^/]*\)/g, '') || '/'
      : null;
    // /customers/[id] nunca aparece escrito así en una prueba: aparece con un
    // identificador de verdad. Se busca también el tramo fijo del principio.
    const rutaBase = ruta && ruta.includes('[') ? ruta.slice(0, ruta.indexOf('[')).replace(/\/$/, '') : null;
    const exportados = esAccion ? nombresQueExporta(texto) : [];
    const nombresABuscar = ruta ? [ruta, rutaBase].filter(Boolean) : exportados;
    const pruebasQueLoNombran = new Set();
    for (const n of nombresABuscar) {
      for (const f of quienLoNombra(n, archivo, ['tests/', 'src/__tests__/'])) {
        pruebasQueLoNombran.add(f);
      }
    }
    // Una prueba vale como prueba sólo si mira el RESULTADO. Que la pantalla
    // abra no alcanza, y un recorrido de todas las pantallas no prueba ninguna.
    const conPrueba = [...pruebasQueLoNombran].some((f) => {
      const t = leer(f);
      if (t === null) return false;
      if (esUnRecorridoDeTodo(t)) return false;
      return MIRA_EL_RESULTADO.test(t);
    });
    if (nombresABuscar.length > 0 && !conPrueba) {
      avisar(
        'frena',
        archivo,
        esPantalla ? `la pantalla ${ruta} no tiene ninguna prueba` : 'ninguna prueba la nombra',
        'Nadie comprobó nunca que funcione. Si se rompe, se entera el cliente.'
      );
    }
  }
}

for (const archivo of dePrueba) {
  if (!existsSync(archivo)) continue;
  const texto = leer(archivo);
  if (texto === null) continue;
  if (!SOLO_MIRA.test(texto)) continue;
  if (MIRA_EL_RESULTADO.test(texto)) continue;
  avisar(
    'frena',
    archivo,
    'la prueba sólo mira que la pantalla se vea',
    'Una pantalla puede abrir vacía y esta prueba igual da verde. No prueba nada.'
  );
}

/* ------------------------------------------------------------------ */

const mirados = deCodigo.length + dePrueba.length;

if (mirados === 0) {
  console.log('Lo que se dijo es lo que es: no hay cambios de código para mirar.');
  process.exit(0);
}

/**
 * EL TRINQUETE
 *
 * La app arrastra deuda vieja que no se puede reparar toda de una. Frenar por
 * ella dejaria la app sin poder subir nada, y a la semana el control estaria
 * apagado. Pero se puede garantizar algo que sirve igual:
 *
 *   **que no crezca, y que solo baje.**
 *
 * Se guarda cuanta hay hoy. Si manana hay mas, frena. Si hay menos, se guarda
 * el numero nuevo y ya no se puede volver atras. Es una rueda que gira para un
 * solo lado.
 */
function contarPorClase(lista) {
  const cuenta = { 'nadie-lo-llama': 0, 'sin-prueba-de-resultado': 0, 'prueba-que-solo-mira': 0 };
  for (const h of lista) {
    if (h.que.startsWith('nadie lo llama')) cuenta['nadie-lo-llama']++;
    else if (h.que.includes('sólo mira')) cuenta['prueba-que-solo-mira']++;
    else cuenta['sin-prueba-de-resultado']++;
  }
  return cuenta;
}

if (MODO_TRINQUETE) {
  const ahora = contarPorClase(hallazgos);
  let antes = null;
  try {
    antes = JSON.parse(readFileSync(ARCHIVO_DEUDA, 'utf8')).deuda;
  } catch {
    antes = null;
  }

  if (!antes) {
    writeFileSync(
      ARCHIVO_DEUDA,
      `${JSON.stringify({ medida: new Date().toISOString().slice(0, 10), deuda: ahora }, null, 2)}\n`
    );
    console.log('Trinquete: primera medicion guardada.');
    for (const [clase, n] of Object.entries(ahora)) console.log(`  ${clase}: ${n}`);
    process.exit(0);
  }

  const crecio = Object.entries(ahora).filter(([clase, n]) => n > (antes[clase] ?? 0));
  if (crecio.length > 0) {
    console.log('');
    console.log('EL TRINQUETE FRENA: la deuda vieja CRECIO.');
    console.log('');
    for (const [clase, n] of crecio) {
      console.log(`  ${clase}: habia ${antes[clase] ?? 0}, ahora hay ${n}`);
    }
    console.log('');
    console.log('  No hace falta reparar todo lo viejo. Pero lo nuevo no puede sumar.');
    console.log('  Arregla lo que agregaste, o repara la misma cantidad de lo viejo.');
    console.log('');
    process.exit(1);
  }

  const bajo = Object.entries(ahora).filter(([clase, n]) => n < (antes[clase] ?? 0));
  if (bajo.length > 0) {
    writeFileSync(
      ARCHIVO_DEUDA,
      `${JSON.stringify({ medida: new Date().toISOString().slice(0, 10), deuda: ahora }, null, 2)}\n`
    );
    console.log('Trinquete: la deuda BAJO, y queda anotado el numero nuevo.');
    for (const [clase, n] of bajo) console.log(`  ${clase}: de ${antes[clase]} a ${n}`);
    console.log('  De aca no se vuelve atras.');
    process.exit(0);
  }

  console.log('Trinquete: la deuda vieja no crecio.');
  for (const [clase, n] of Object.entries(ahora)) console.log(`  ${clase}: ${n}`);
  process.exit(0);
}

if (hallazgos.length === 0) {
  console.log(
    `Lo que se dijo es lo que es: bien (${mirados} archivos mirados, todo lo nuevo se usa y está probado).`
  );
  process.exit(0);
}

console.log('');
console.log('LO QUE SE DIJO NO ES LO QUE ES.');
console.log(`${hallazgos.length} cosa(s) que dicen hacer algo y no se comprobó que lo hagan:`);
console.log('');
for (const h of hallazgos) {
  console.log(`  ${h.archivo}`);
  console.log(`    ${h.que}`);
  console.log(`    ${h.porque}`);
  console.log('');
}
console.log(`(${mirados} archivos mirados)`);
process.exit(1);

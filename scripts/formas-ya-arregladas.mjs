#!/usr/bin/env node
/**
 * ¿LO QUE YA SE ARREGLÓ EN UNA PANTALLA SIGUE VIVO EN OTRA? (pedido del dueño, 20/10/2026)
 *
 * Palabras suyas: "cada vez que hacemos una auditoría siguen habiendo problemas, cosas que ya habías
 * resuelto". Medido ese día: el álbum que mandaba al disco de todos los clientes se arregló en
 * `PostEventMemoryHub.tsx` y su control lee SÓLO ese archivo; la misma forma seguía en
 * `src/app/post-fiesta/[fiestaId]/page.tsx` y la encontró Gemini.
 *
 * Muchos controles dicen "este archivo NO tiene tal forma" (`expect(codigo).not.toMatch(/…/)`). Este
 * script toma cada una de esas formas prohibidas y la busca en TODA la app. Si aparece en otro archivo,
 * es el mismo defecto que ya se arregló una vez, vivo en otro lado.
 *
 * Uso: node scripts/formas-ya-arregladas.mjs           → informa
 *      node scripts/formas-ya-arregladas.mjs --json    → para el control
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const RAIZ = process.cwd();
const PRUEBAS = join(RAIZ, 'src', '__tests__');

function archivosDe(dir, salida = []) {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (nombre === 'node_modules' || nombre === '__tests__' || nombre.startsWith('.')) continue;
    const st = statSync(ruta);
    if (st.isDirectory()) archivosDe(ruta, salida);
    else if (/\.(ts|tsx)$/.test(nombre) && !/\.(test|spec)\.tsx?$/.test(nombre)) salida.push(ruta);
  }
  return salida;
}

/** Saca las expresiones de `.not.toMatch(/…/flags)` respetando barras escapadas y clases `[...]`. */
export function formasProhibidas(texto) {
  const formas = [];
  const marca = '.not.toMatch(/';
  let desde = 0;
  for (;;) {
    const i = texto.indexOf(marca, desde);
    if (i < 0) break;
    let j = i + marca.length;
    let enClase = false;
    let cuerpo = '';
    for (; j < texto.length; j++) {
      const c = texto[j];
      if (c === '\\') { cuerpo += c + texto[j + 1]; j++; continue; }
      if (c === '[') enClase = true;
      else if (c === ']') enClase = false;
      else if (c === '/' && !enClase) break;
      if (c === '\n') { cuerpo = null; break; }
      cuerpo += c;
    }
    desde = j + 1;
    if (!cuerpo) continue;
    const flags = (texto.slice(j + 1).match(/^[a-z]*/) || [''])[0];
    try {
      formas.push({ fuente: cuerpo, re: new RegExp(cuerpo, flags.replace(/g/g, '')) });
    } catch {
      // una expresión que JS no entiende fuera de su contexto se saltea
    }
  }
  return formas;
}

/** Los archivos de la app que nombra la prueba: ahí ya se miró. */
function archivosQueMira(texto) {
  return new Set([...texto.matchAll(/['"`](src\/[^'"`]+\.(?:ts|tsx))['"`]/g)].map((m) => m[1]));
}

export function buscar() {
  const app = archivosDe(join(RAIZ, 'src')).map((ruta) => ({
    ruta: relative(RAIZ, ruta).split(sep).join('/'),
    codigo: readFileSync(ruta, 'utf8'),
  }));
  const hallazgos = [];
  for (const nombre of readdirSync(PRUEBAS)) {
    if (!/\.tsx?$/.test(nombre)) continue;
    const texto = readFileSync(join(PRUEBAS, nombre), 'utf8');
    const mira = archivosQueMira(texto);
    // Sólo los controles atados a archivos concretos: los que ya recorren toda la app no hace falta.
    if (mira.size === 0) continue;
    for (const forma of formasProhibidas(texto)) {
      // Una forma muy corta o genérica da ruido, no hallazgos.
      if (forma.fuente.replace(/\\./g, 'x').length < 12) continue;
      for (const { ruta, codigo } of app) {
        if (mira.has(ruta)) continue;
        const m = codigo.match(forma.re);
        if (!m) continue;
        const linea = codigo.slice(0, m.index).split('\n').length;
        hallazgos.push({ prueba: nombre, forma: forma.fuente, archivo: ruta, linea, texto: m[0].slice(0, 80) });
      }
    }
  }
  return hallazgos;
}

if (process.argv[1] && process.argv[1].endsWith('formas-ya-arregladas.mjs')) {
  const hallazgos = buscar();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(hallazgos, null, 2));
  } else if (hallazgos.length === 0) {
    console.log('Ninguna forma ya arreglada aparece en otro archivo.');
  } else {
    console.log(`${hallazgos.length} lugares con una forma que ya se arregló en otro archivo:\n`);
    for (const h of hallazgos) console.log(`- ${h.archivo}:${h.linea}  (de ${h.prueba})  ${h.texto}`);
  }
}

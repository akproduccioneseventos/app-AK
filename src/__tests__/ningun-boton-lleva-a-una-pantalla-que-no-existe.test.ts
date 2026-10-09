/**
 * NINGÚN BOTÓN LLEVA A UNA PANTALLA QUE NO EXISTE (pedido del dueño, 9/10/2026).
 *
 * Se encontraron cuatro: tres tarjetas de Marketing ("Moderación y Comentarios", "Editor Web y
 * Portada", "Galería y Catálogo") y "Previsualizar" en Regalos. Todas daban "página no
 * encontrada". Este control recorre todos los enlaces escritos fijos de la app (`href="/..."`,
 * `href: '/...'`, `router.push('/...')`) y exige que la pantalla exista.
 *
 * Probado rompiéndolo: con `/empresa/landing-builder` de vuelta, se pone en rojo y lo nombra.
 * Lo que no ve: los enlaces armados en el momento con variables que no son el id; esos los
 * cubren las pruebas de cada pantalla.
 */
import fs from 'fs';
import path from 'path';

const RAIZ = process.cwd();
const APP = path.join(RAIZ, 'src', 'app');

function archivos(dir: string, salida: string[] = []): string[] {
  for (const nombre of fs.readdirSync(dir)) {
    const p = path.join(dir, nombre);
    if (fs.statSync(p).isDirectory()) {
      if (nombre === 'node_modules' || nombre === '__tests__') continue;
      archivos(p, salida);
    } else if (/\.(tsx|ts)$/.test(nombre)) salida.push(p);
  }
  return salida;
}

/** Las rutas que existen, tramo por tramo (`*` = `[param]`, `**` = `[...param]`). */
function rutasQueExisten(): string[][] {
  const rutas: string[][] = [];
  for (const f of archivos(APP)) {
    if (!/[\\/](page|route)\.(tsx|ts)$/.test(f)) continue;
    rutas.push(path.relative(APP, path.dirname(f)).split(path.sep)
      .filter((t) => t && !/^\(.*\)$/.test(t) && !t.startsWith('@'))
      .map((t) => (/^\[\[?\.\.\./.test(t) ? '**' : /^\[.*\]$/.test(t) ? '*' : t)));
  }
  return rutas;
}

/** Un tramo del enlace armado con una variable (`X`) puede ser cualquier carpeta. */
function existe(destino: string, rutas: string[][]): boolean {
  const tramos = destino === '/' ? [] : destino.replace(/^\//, '').split('/');
  return rutas.some((r) => {
    if (r.includes('**')) {
      const fijo = r.slice(0, r.indexOf('**'));
      return tramos.length >= fijo.length && fijo.every((t, k) => t === '*' || tramos[k] === 'X' || t === tramos[k]);
    }
    return r.length === tramos.length && r.every((t, k) => t === '*' || tramos[k] === 'X' || t === tramos[k]);
  });
}

/**
 * Los atajos de `redirects()` y `rewrites()` de next.config (`/landing` → `/`, etc.) también son
 * destinos válidos. Se excluyen los comodines que valen para todo (`/:ruta*` del dominio con www,
 * `/(.*)` de las cabeceras): con ellos el control daba verde con cualquier enlace roto, que es
 * como se lo encontró al romperlo a propósito.
 */
function redirecciones(): RegExp[] {
  const conf = ['next.config.ts', 'next.config.js', 'next.config.mjs'].map((n) => path.join(RAIZ, n)).find((n) => fs.existsSync(n));
  if (!conf) return [];
  const texto = fs.readFileSync(conf, 'utf8');
  const desde = texto.indexOf('redirects()');
  const parte = desde >= 0 ? texto.slice(desde) : texto;
  return [...parte.matchAll(/source:\s*['"]([^'"]+)['"]/g)]
    .map((m) => m[1])
    .filter((src) => !/^\/(:[^/]+\*|\(\.\*\))$/.test(src))
    .map((src) => new RegExp(`^${src
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\/:[^/]+\*/g, '(/.*)?')
      .replace(/:[^/]+/g, '[^/]+')}/?$`));
}

const DESTINO = /(?:href\s*[=:]\s*\{?\s*|router\.(?:push|replace)\(\s*)(['"`])(\/(?:\$\{[^}]*\}|[^'"`?#\s$])*)/g;

function destinosDeLaApp(): Array<{ archivo: string; destino: string }> {
  const encontrados: Array<{ archivo: string; destino: string }> = [];
  for (const f of archivos(path.join(RAIZ, 'src'))) {
    const texto = fs.readFileSync(f, 'utf8');
    for (const m of texto.matchAll(DESTINO)) {
      let destino = m[2];
      // `${fiestaId}` y similares cuentan como un tramo cualquiera; lo que viene después de un
      // `${` sin cerrar en el mismo tramo no se puede saber: se corta ahí.
      // Una variable pegada al final de un tramo (`catering${q}`) es la consulta (`?fiestaId=`): se saca.
      destino = destino.replace(/([^/])\$\{[^}]*\}$/g, '$1').replace(/\$\{[^}]*\}/g, 'X');
      if (destino.includes('${')) destino = destino.slice(0, destino.indexOf('${'));
      destino = destino.replace(/\/+$/, '') || '/';
      if (destino.startsWith('//') || destino.startsWith('/api/') || /\.[a-z0-9]{2,5}$/i.test(destino)) continue;
      encontrados.push({ archivo: path.relative(RAIZ, f), destino });
    }
  }
  return encontrados;
}

it('cada botón con destino fijo lleva a una pantalla que existe', () => {
  const rutas = rutasQueExisten();
  const atajos = redirecciones();
  const rotos = destinosDeLaApp().filter(({ destino }) =>
    !existe(destino, rutas)
    && !atajos.some((a) => a.test(destino)),
  );
  expect(rotos.map((r) => `${r.archivo} -> ${r.destino}`)).toEqual([]);
});

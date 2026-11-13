/**
 * NINGÚN ENLACE LLEVA A UNA PÁGINA QUE NO EXISTE (ronda de interfaz del auditor, 12/11/2026).
 *
 * Con la sesión abierta, "Entrar" (`/entrar`) mandaba a `/dashboard`, que no existe: el equipo veía "Esta página no
 * existe". Este control junta todos los destinos escritos en el código (`redirect('/…')`, `router.push('/…')`,
 * `router.replace('/…')`, `href="/…"`, `href={'/…'}` y `` href={`/…`} ``) y comprueba que cada uno sea una pantalla
 * (`page.tsx`), una ruta del servidor (`route.ts`), una redirección de `next.config.js` o un archivo de `public/`.
 */
import fs from 'fs';
import path from 'path';

const RAIZ = process.cwd();
const APP = path.join(RAIZ, 'src/app');

function archivos(dir: string, re: RegExp): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' || e.name === '__tests__' ? [] : archivos(f, re);
    return re.test(e.name) ? [f] : [];
  });
}

/** Cada pantalla o ruta como expresión: los grupos `(x)` no cuentan y `[algo]` es cualquier tramo. */
function rutasDeLaApp(): RegExp[] {
  return archivos(APP, /^(page|route|sitemap|robots|manifest)\.(tsx?|jsx?)$/).map((f) => {
    const tramos = path.relative(APP, path.dirname(f)).split(path.sep).filter((t) => t && !/^\(.*\)$/.test(t) && !t.startsWith('@'));
    const re = tramos.map((t) => {
      if (/^\[\[\.\.\..+\]\]$/.test(t)) return '(?:/.*)?';
      if (/^\[\.\.\..+\]$/.test(t)) return '/.+';
      if (/^\[.+\]$/.test(t)) return '/[^/]+';
      return `/${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`;
    }).join('');
    const base = path.basename(f).replace(/\.(tsx?|jsx?)$/, '');
    if (base === 'sitemap' || base === 'robots') return new RegExp(`^${re}/${base}\\.(xml|txt)$`);
    if (base === 'manifest') return new RegExp(`^${re}/manifest\\.(webmanifest|json)$`);
    return new RegExp(`^${re || '/'}/?$`);
  });
}

function redireccionesDeNext(): RegExp[] {
  const completo = fs.readFileSync(path.join(RAIZ, 'next.config.js'), 'utf8');
  // Sólo el bloque de redirecciones: los encabezados también usan `source: '/(.*)'` y tapaban todo (se probó).
  const desde = completo.indexOf('async redirects()');
  const texto = desde >= 0 ? completo.slice(desde, completo.indexOf('async ', desde + 10) > 0 ? completo.indexOf('async ', desde + 10) : undefined) : '';
  return [...texto.matchAll(/source:\s*'([^']+)'(?![^}]*has:)/g)].map(([, s]) =>
    new RegExp(`^${s.replace(/:\w+\*/g, '.*').replace(/:\w+/g, '[^/]+').replace(/\(\.\*\)/g, '.*')}/?$`),
  );
}

function enPublic(destino: string): boolean {
  return fs.existsSync(path.join(RAIZ, 'public', destino));
}

const DESTINOS = /(?:redirect|router\.(?:push|replace)|permanentRedirect)\(\s*(?:(['"])(\/[^'"]*)\1|`(\/[^`]*)`)|href=(?:\{\s*)?(?:(['"])(\/[^'"]*)\4|`(\/[^`]*)`)/g;

/** Un tramo armado (`/${id}`) puede ser cualquier cosa; un pedazo pegado a un texto (`catering${q}`) es la consulta. */
function normalizar(crudo: string): string {
  // Un `${...}` sin cerrar es un texto armado adentro de otro (`${id ? `?x=${id}` : ''}`): lo que sigue es la consulta.
  const sinCerrar = crudo.search(/\$\{[^}]*$/);
  if (sinCerrar >= 0) crudo = crudo.slice(0, sinCerrar);
  return crudo.replace(/\/\$\{[^}]*\}/g, '/__X__').replace(/\$\{[^}]*\}/g, '');
}

function coincide(rutas: RegExp[], destino: string): boolean {
  if (!destino.includes('__X__')) return rutas.some((r) => r.test(destino));
  // Con tramos armados, se prueba que exista alguna ruta con esa forma: cada __X__ vale por cualquier tramo.
  // El último tramo armado tiene que caer en un tramo variable de la ruta: `/portal/${id}` no vale por `/portal/mesas`
  // (así se escapaba el portal del cliente, 13/11/2026).
  const tramos = destino.split('/');
  const ultimo = tramos.lastIndexOf('__X__');
  const patron = new RegExp(`^${tramos.map((t, i) => (t !== '__X__' ? t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : i === ultimo ? 'ejemplo' : '[^/]+')).join('/')}/?$`);
  return RUTAS_COMO_TEXTO().some((r) => patron.test(r));
}

let cacheDeRutas: string[] | null = null;
/** Las rutas escritas con un ejemplo en cada tramo variable, para comparar contra destinos armados. */
function RUTAS_COMO_TEXTO(): string[] {
  if (cacheDeRutas) return cacheDeRutas;
  cacheDeRutas = archivos(APP, /^(page|route)\.(tsx?|jsx?)$/).map((f) =>
    '/' + path.relative(APP, path.dirname(f)).split(path.sep).filter((t) => t && !/^\(.*\)$/.test(t) && !t.startsWith('@')).map((t) => (/^\[.*\]$/.test(t) ? 'ejemplo' : t)).join('/'),
  );
  return cacheDeRutas;
}

export function destinosRotos(): string[] {
  const rutas = [...rutasDeLaApp(), ...redireccionesDeNext()];
  const rotos = new Set<string>();
  for (const f of archivos(path.join(RAIZ, 'src'), /\.(tsx?|jsx?)$/)) {
    if (/\.test\.|__tests__/.test(f)) continue;
    const texto = fs.readFileSync(f, 'utf8');
    for (const m of texto.matchAll(DESTINOS)) {
      const crudo = m[2] ?? m[3] ?? m[5] ?? m[6] ?? '';
      const destino = normalizar(crudo).split(/[?#]/)[0].replace(/\/$/, '') || '/';
      if (destino.startsWith('//') || destino === '/__X__') continue;
      if (coincide(rutas, destino) || enPublic(destino)) continue;
      rotos.add(`${path.relative(RAIZ, f)} → ${crudo}`);
    }
  }
  return [...rotos].sort();
}

describe('Ningún enlace de la app lleva a una página que no existe', () => {
  it('todos los destinos escritos en el código existen', () => {
    expect(destinosRotos()).toEqual([]);
  });
});

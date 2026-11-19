/** @jest-environment node */
/**
 * Una redirección de next.config.js con un comodín (`/presupuestos/:id`) atrapa también las pantallas fijas de al lado
 * (`/presupuestos/nuevo`), porque Next mira las redirecciones ANTES que las pantallas. Pasó en la entrega 1443 (19/11/2026):
 * la lista de presupuestos y "Nueva fiesta" quedaban inaccesibles. Este control recorre cada redirección contra cada pantalla.
 */
import fs from 'fs';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { pathToRegexp } = require('next/dist/compiled/path-to-regexp');

// Redirecciones que tapan una pantalla a propósito (la pantalla vieja quedó como respaldo y no se usa).
const A_PROPOSITO = new Set(['/portal-cliente']);

function pantallasFijas(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name);
      if (f.isDirectory()) walk(p);
      else if (f.name === 'page.tsx') {
        const partes = path.relative('src/app', path.dirname(p)).split(path.sep).filter((s) => s && !/^\(.*\)$/.test(s));
        if (partes.some((s) => s.includes('['))) continue;
        out.push('/' + partes.join('/'));
      }
    }
  };
  walk(path.join(process.cwd(), 'src/app'));
  return out;
}

describe('una redirección no tapa una pantalla que existe', () => {
  it('ninguna redirección sin condición atrapa una pantalla fija', async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const config = require(path.join(process.cwd(), 'next.config.js'));
    const cfg = typeof config === 'function' ? await config('phase-production-build', {}) : config;
    const redirecciones: Array<{ source: string; destination: string; has?: unknown; missing?: unknown }> = await cfg.redirects();
    const pantallas = pantallasFijas();
    const tapadas: string[] = [];
    for (const r of redirecciones) {
      if (r.has || r.missing) continue;
      const re = pathToRegexp(r.source, []);
      for (const p of pantallas) {
        if (re.test(p) && !A_PROPOSITO.has(p)) tapadas.push(`${p}  <-  ${r.source}  ->  ${r.destination}`);
      }
    }
    expect(tapadas).toEqual([]);
  });

  it('la lista de presupuestos y "Nueva fiesta" se pueden abrir', async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const config = require(path.join(process.cwd(), 'next.config.js'));
    const cfg = typeof config === 'function' ? await config('phase-production-build', {}) : config;
    const redirecciones: Array<{ source: string; has?: unknown; missing?: unknown }> = await cfg.redirects();
    for (const pantalla of ['/presupuestos/nuevo', '/fiestas/nueva']) {
      const atrapa = redirecciones.filter((r) => !r.has && !r.missing && pathToRegexp(r.source, []).test(pantalla));
      expect(atrapa.map((r) => r.source)).toEqual([]);
    }
  });
});

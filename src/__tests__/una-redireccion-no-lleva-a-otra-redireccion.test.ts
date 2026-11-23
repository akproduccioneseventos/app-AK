/** @jest-environment node */
/**
 * MATAFUEGO — Entrega 1462 (22/11/2026), pregunta 206: `/fiestas/nueva/logistica` iba a `carga-operativa?tab=logistica`,
 * y `carga-operativa` se redirigía a `operacion?tab=carga-operativa`. Encadenadas, la segunda pisaba la solapa y el que
 * entraba por logística caía en otra pantalla. Cada dirección vieja tiene que ir en UN salto a su destino final.
 */
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { pathToRegexp } = require('next/dist/compiled/path-to-regexp');

it('ninguna redirección lleva a otra dirección que también se redirige', async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const config = require(path.join(process.cwd(), 'next.config.js'));
  const cfg = typeof config === 'function' ? await config('phase-production-build', {}) : config;
  const redirecciones: Array<{ source: string; destination: string; has?: unknown; missing?: unknown }> = await cfg.redirects();
  const sinCondicion = redirecciones.filter((r) => !r.has && !r.missing);
  const encadenadas: string[] = [];
  for (const r of redirecciones) {
    const destino = r.destination.split('?')[0].split('#')[0];
    if (/^https?:/.test(destino) || destino.includes(':')) continue;
    for (const otra of sinCondicion) {
      if (otra === r) continue;
      if (pathToRegexp(otra.source).test(destino)) encadenadas.push(`${r.source} → ${r.destination} → ${otra.destination}`);
    }
  }
  expect(encadenadas).toEqual([]);
});

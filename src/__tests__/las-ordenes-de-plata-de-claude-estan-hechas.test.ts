/**
 * 21/10/2026: la orden 185 (el pago de un proveedor se le copiaba a otro del mismo nombre) figuraba
 * "FALTA" en `npm run ordenes?` desde el 18/10, y la lista de errores de plata abiertos decía "ninguno".
 * `ordenes?` informa y no frena, así que nadie lo vio. Las órdenes de Claude son plata, cobros y
 * permisos: una a medias frena la publicación.
 */
import { spawnSync } from 'child_process';

describe('las órdenes de plata y permisos de Claude están hechas', () => {
  it('ninguna orden "-claude-" figura a medias', () => {
    const r = spawnSync('node', ['scripts/ordenes-cumplidas.mjs'], { cwd: process.cwd(), encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
    const salida = r.stdout || '';
    expect(salida).toMatch(/-claude-/);
    const aMedias = [...salida.matchAll(/^ {2}(\d+-claude-[^:]+\.md): FALTA/gm)].map((m) => m[1]);
    expect(aMedias).toEqual([]);
  });
});

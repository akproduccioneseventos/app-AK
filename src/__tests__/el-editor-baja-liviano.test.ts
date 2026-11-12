/** @jest-environment node */

import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

describe('Orden 279 Bloque 4: El editor baja liviano', () => {
  const rutaZip = path.join(process.cwd(), 'public', 'descargas', 'ak-editor.zip');

  it('el zip existe y pesa menos de 5 MB', () => {
    expect(fs.existsSync(rutaZip)).toBe(true);
    const stats = fs.statSync(rutaZip);
    const maxBytes = 5 * 1024 * 1024; // 5 MB
    expect(stats.size).toBeLessThan(maxBytes);
  });

  it('no tiene ninguna entrada con .venv/', async () => {
    const contenido = fs.readFileSync(rutaZip);
    const zip = await JSZip.loadAsync(contenido);
    const entradas = Object.keys(zip.files);

    expect(entradas.length).toBeGreaterThan(0);
    const entradasVenv = entradas.filter((e) =>
      e.toLowerCase().includes('.venv/') ||
      e.toLowerCase().includes('/.venv/') ||
      e.toLowerCase().startsWith('.venv')
    );
    expect(entradasVenv).toEqual([]);
  });
});

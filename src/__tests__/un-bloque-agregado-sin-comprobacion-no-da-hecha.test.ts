/**
 * MATAFUEGO DEL MÉTODO — Un bloque agregado a una orden sin su comprobación no la da por hecha.
 *
 * El 19 de septiembre de 2026 se agregó a la orden 69 (ya cumplida) un "Bloque 3" con el defecto
 * de la descarga del Video de Vida, **sin sumar su línea al bloque `comprobar`**. La orden siguió
 * diciendo HECHA, nadie lo programó, y Codex lo volvió a encontrar el 25.
 *
 * Se corre el control de verdad sobre una carpeta de órdenes de mentira.
 * Se probó rompiéndolo: sacando `bloquesSinComprobacion`, la primera se pone en rojo.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';

const SCRIPT = path.join(process.cwd(), 'scripts', 'ordenes-cumplidas.mjs');

function correr(orden: string) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ordenes-'));
  fs.mkdirSync(path.join(dir, 'docs', 'ordenes'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src', 'hecho.ts'), 'export const YA = 1;\n');
  fs.writeFileSync(path.join(dir, 'docs', 'ordenes', '99-prueba.md'), orden);
  return execFileSync('node', [SCRIPT], { cwd: dir, encoding: 'utf8' });
}

const COMPROBAR = '```comprobar\nusa: YA en src/hecho.ts\n```\n';

describe('Un bloque agregado sin comprobación no da la orden por hecha', () => {
  it('un bloque que nombra un archivo que ninguna línea de comprobar mira: FALTA', () => {
    const salida = correr(`# Orden 99\n\n## Bloque 1 — Lo hecho\nEn \`src/hecho.ts\`.\n\n## Bloque 2 — Lo agregado después\nEn \`src/app/api/otra/route.ts\`, hacer algo.\n\n${COMPROBAR}`);
    expect(salida).toMatch(/99-prueba\.md: FALTA/);
    expect(salida).toContain('bloque sin comprobación -> Bloque 2');
  });

  it('con todos los bloques cubiertos: HECHA', () => {
    const salida = correr(`# Orden 99\n\n## Bloque 1 — Lo hecho\nEn \`src/hecho.ts\`.\n\n${COMPROBAR}`);
    expect(salida).toMatch(/99-prueba\.md: HECHA/);
  });
});

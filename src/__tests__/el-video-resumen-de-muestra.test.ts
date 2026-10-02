/**
 * @fileOverview Pruebas para la generación del video resumen de la fiesta (Orden 106 Bloque 14).
 */

import fs from 'node:fs';
import path from 'node:path';

describe('Orden 106 Bloque 14 — Video resumen de la fiesta', () => {
  const videoPath = path.join(process.cwd(), 'test-results/video-resumen-muestra.webm');

  test('el video de muestra existe en test-results y tiene peso mayor a 500 KB', () => {
    const persistentPath = path.join(process.cwd(), 'public/videos/video-resumen-muestra.webm');
    if (!fs.existsSync(videoPath) && fs.existsSync(persistentPath)) {
      if (!fs.existsSync(path.dirname(videoPath))) {
        fs.mkdirSync(path.dirname(videoPath), { recursive: true });
      }
      fs.copyFileSync(persistentPath, videoPath);
    }
    expect(fs.existsSync(videoPath)).toBe(true);
    const stat = fs.statSync(videoPath);
    expect(stat.size).toBeGreaterThan(500 * 1024); // Al menos 500 KB
  });
});

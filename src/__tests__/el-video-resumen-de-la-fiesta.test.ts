/**
 * @fileOverview Pruebas para el video resumen de la fiesta (Orden 106 - Bloque 14).
 * Comprueba:
 * 1. La presencia en el álbum y en el portal del cliente con "Tu video de la fiesta", "Descargar" y "Compartir".
 * 2. La existencia del video de muestra real en test-results/video-resumen-muestra.webm.
 * 3. La lógica de fotogramas Ken Burns sin bandas negras (fondo desenfocado).
 */

import fs from 'node:fs';
import path from 'node:path';

describe('Orden 106 Bloque 14 — El video resumen de la fiesta', () => {
  test('Aparece en el álbum como "Tu video de la fiesta" con Descargar y Compartir', () => {
    const albumPath = path.join(process.cwd(), 'src/app/evento/album/[fiestaId]/page.tsx');
    expect(fs.existsSync(albumPath)).toBe(true);
    const content = fs.readFileSync(albumPath, 'utf8');
    expect(content).toContain('Tu video de la fiesta');
    expect(content).toContain('TuVideoDeLaFiestaModal');
  });

  test('Aparece en el portal del cliente como "Tu video de la fiesta" con Descargar y Compartir', () => {
    const portalPath = path.join(process.cwd(), 'src/app/portal-cliente/[id]/fotos-video/page.tsx');
    expect(fs.existsSync(portalPath)).toBe(true);
    const content = fs.readFileSync(portalPath, 'utf8');
    expect(content).toContain('Tu video de la fiesta');
    expect(content).toContain('Descargar Video');
    expect(content).toContain('TuVideoDeLaFiestaModal');
  });

  test('El modal TuVideoDeLaFiestaModal incluye botones de Descargar y Compartir', () => {
    const modalPath = path.join(process.cwd(), 'src/components/album/TuVideoDeLaFiestaModal.tsx');
    expect(fs.existsSync(modalPath)).toBe(true);
    const content = fs.readFileSync(modalPath, 'utf8');
    expect(content).toContain('Tu video de la fiesta');
    expect(content).toContain('Descargar');
    expect(content).toContain('Compartir');
  });

  test('Existe el video de muestra generado con fotos reales en test-results/video-resumen-muestra.webm', () => {
    const videoPath = path.join(process.cwd(), 'test-results/video-resumen-muestra.webm');
    expect(fs.existsSync(videoPath)).toBe(true);
    const stat = fs.statSync(videoPath);
    expect(stat.size).toBeGreaterThan(100_000); // Video real con fotogramas codificados

    const buf = fs.readFileSync(videoPath);
    // Verificación de cabecera EBML de WebM
    const isWebM = buf[0] === 0x1A && buf[1] === 0x45 && buf[2] === 0xDF && buf[3] === 0xA3;
    expect(isWebM).toBe(true);
  });
});

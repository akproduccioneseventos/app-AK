/**
 * @fileOverview Pruebas para el video resumen de la fiesta (Órdenes 106, 107 y 111).
 * Comprueba:
 * 1. La presencia en el álbum y en el portal del cliente con "Tu video de la fiesta", "Descargar" y "Compartir".
 * 2. Que la duración calculada para 24 fotos quede entre 60 y 90 segundos.
 * 3. Que elegirFotosVideo descarte tiras de fotocabina.
 * 4. La existencia del video de muestra real en docs/evidencias/video-resumen-muestra.webm.
 */

import fs from 'node:fs';
import path from 'node:path';
import { calcularDuracionVideoResumen } from '@/lib/video-resumen/generar-video-resumen';
import { elegirFotosVideo } from '@/lib/video-resumen/elegir-fotos-video';

describe('Órdenes 106 y 111 — El video resumen de la fiesta', () => {
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

  test('La duración calculada para 24 fotos queda entre 60 y 90 segundos', () => {
    const duracion = calcularDuracionVideoResumen(24);
    expect(duracion).toBeGreaterThanOrEqual(60);
    expect(duracion).toBeLessThanOrEqual(90);
  });

  test('elegirFotosVideo deja afuera una tira de fotocabina', () => {
    const fotosConTira = [
      {
        id: 'foto-1',
        imageUrl: '/media/catalogo-servicios/boda-1.jpeg',
        timestamp: '2026-10-15T21:00:00Z',
        nitidez: 80,
        tipo: 'foto',
      },
      {
        id: 'tira-cabina-1',
        imageUrl: '/media/tiras/tira-roja-1.jpg',
        timestamp: '2026-10-15T21:05:00Z',
        nitidez: 90,
        tipo: 'fotocabina',
        title: 'Tira de fotos cabina',
      },
      {
        id: 'foto-2',
        imageUrl: '/media/catalogo-servicios/boda-2.jpeg',
        timestamp: '2026-10-15T21:10:00Z',
        nitidez: 85,
        tipo: 'foto',
      },
    ];

    const seleccionadas = elegirFotosVideo(fotosConTira);
    const ids = seleccionadas.map((f) => f.id);
    expect(ids).toContain('foto-1');
    expect(ids).toContain('foto-2');
    expect(ids).not.toContain('tira-cabina-1');
  });

  test('Existe el video de muestra generado con fotos reales en docs/evidencias/video-resumen-muestra.webm', () => {
    const videoPath = path.join(process.cwd(), 'docs/evidencias/video-resumen-muestra.webm');
    expect(fs.existsSync(videoPath)).toBe(true);
    const stat = fs.statSync(videoPath);
    expect(stat.size).toBeGreaterThan(100_000); // Video real con fotogramas codificados

    const buf = fs.readFileSync(videoPath);
    // Verificación de cabecera EBML de WebM
    const isWebM = buf[0] === 0x1A && buf[1] === 0x45 && buf[2] === 0xDF && buf[3] === 0xA3;
    expect(isWebM).toBe(true);
  });
});

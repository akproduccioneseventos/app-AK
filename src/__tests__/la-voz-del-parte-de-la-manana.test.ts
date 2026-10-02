/**
 * @fileOverview Pruebas para la generación de voz del parte de la mañana y la ruta /api/asistente/voz-parte.
 */

import fs from 'node:fs';
import path from 'node:path';
import { generarAudioWavSintetico } from '@/lib/asistente/voz-parte';

describe('Orden 105 Bloque 2 — Voz del parte de la mañana', () => {
  const routePath = path.join(process.cwd(), 'src/app/api/asistente/voz-parte/route.ts');

  test('la ruta de API /api/asistente/voz-parte existe y exporta GET', () => {
    expect(fs.existsSync(routePath)).toBe(true);
    const content = fs.readFileSync(routePath, 'utf8');
    expect(content).toContain('export async function GET');
    expect(content).toContain('audio/wav');
    expect(content).toContain('generarAudioWavSintetico');
  });

  test('generarAudioWavSintetico devuelve un buffer WAV válido con RIFF, WAVE y PCM de 16-bit', () => {
    const buffer = generarAudioWavSintetico(2);

    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(44);

    // Encabezado RIFF y formato WAVE
    expect(buffer.toString('utf8', 0, 4)).toBe('RIFF');
    expect(buffer.toString('utf8', 8, 12)).toBe('WAVE');
    expect(buffer.toString('utf8', 12, 16)).toBe('fmt ');

    // AudioFormat = 1 (PCM)
    expect(buffer.readUInt16LE(20)).toBe(1);

    // Canales = 1 (mono)
    expect(buffer.readUInt16LE(22)).toBe(1);

    // BitsPerSample = 16
    expect(buffer.readUInt16LE(34)).toBe(16);

    // Data marker
    expect(buffer.toString('utf8', 36, 40)).toBe('data');
  });
});

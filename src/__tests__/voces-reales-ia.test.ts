/**
 * @fileOverview Pruebas para las voces reales de la IA y el reproductor universal.
 */

import { VOCES_IA_DISPONIBLES, sintetizarVozReal, generarAudioWavSintetico } from '@/lib/asistente/voz-parte';
import { truncateForSpeech, selectBestSpanishVoice } from '@/lib/asistente/reproductor-voz';

describe('Voces reales de la IA', () => {
  test('dispone de catálogo de voces neuronales de alta fidelidad', () => {
    expect(VOCES_IA_DISPONIBLES.length).toBeGreaterThanOrEqual(5);

    // Debe incluir voces de Google Journey
    const journey = VOCES_IA_DISPONIBLES.filter((v) => v.id.includes('Journey'));
    expect(journey.length).toBeGreaterThanOrEqual(2);

    // Debe incluir voz de ElevenLabs
    const eleven = VOCES_IA_DISPONIBLES.find((v) => v.proveedor === 'elevenlabs');
    expect(eleven).toBeDefined();

    // Debe incluir voz recomendada
    const recomendada = VOCES_IA_DISPONIBLES.find((v) => v.recomendada);
    expect(recomendada).toBeDefined();
  });

  test('sintetizarVozReal devuelve un buffer WAV válido con encabezado RIFF', async () => {
    const buffer = await sintetizarVozReal('Hola Alexander, bienvenido a tu asistente.', {
      voz: 'es-ES-Journey-F',
    });

    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(44);
    expect(buffer.toString('utf8', 0, 4)).toBe('RIFF');
    expect(buffer.toString('utf8', 8, 12)).toBe('WAVE');
    expect(buffer.toString('utf8', 12, 16)).toBe('fmt ');
  });

  test('sintetizarVozReal devuelve caché para llamadas idénticas', async () => {
    const texto = 'Texto para prueba de cache de voz';
    const b1 = await sintetizarVozReal(texto, { voz: 'es-ES-Neural2-A' });
    const b2 = await sintetizarVozReal(texto, { voz: 'es-ES-Neural2-A' });

    expect(b1).toBe(b2); // Misma referencia en caché
  });

  test('truncateForSpeech limpia markdown y enlaces para locución natural', () => {
    const markdown = 'Hola **amigo**, mirá este [enlace](https://ejemplo.com) y esta #fiesta.';
    const res = truncateForSpeech(markdown);

    expect(res).not.toContain('**');
    expect(res).not.toContain('https://');
    expect(res).toContain('Hola');
  });

  test('generarAudioWavSintetico sigue funcionando como fallback garantizado', () => {
    const buffer = generarAudioWavSintetico(1);
    expect(buffer.toString('utf8', 0, 4)).toBe('RIFF');
    expect(buffer.length).toBeGreaterThan(44);
  });
});

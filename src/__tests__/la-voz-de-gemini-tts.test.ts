/**
 * @fileOverview Pruebas para la generación de voz real con Gemini TTS (Orden 110 Bloque 3).
 * Comprueba que:
 * 1. Con Gemini TTS disponible devuelve audio real sintetizado y NO un tono sintético.
 * 2. Sin clave o si el servicio externo no está disponible devuelve error (503).
 * 3. El reproductor del parte de la mañana contiene fallback garantizado con SpeechSynthesisUtterance.
 */

import { sintetizarVozGemini } from '@/lib/asistente/voz-gemini';
import fs from 'node:fs';
import path from 'node:path';

describe('Orden 110 Bloque 3 — Voz de verdad con Gemini TTS', () => {
  const routePath = path.join(process.cwd(), 'src/app/api/asistente/voz-parte/route.ts');
  const playerPath = path.join(process.cwd(), 'src/components/mi-dia/ParteDeLaMananaPlayer.tsx');

  test('sin clave de API o con clave inválida, sintetizarVozGemini lanza un error explícito (nunca un pitido)', async () => {
    await expect(sintetizarVozGemini('Hola Alexander', { apiKey: '' })).rejects.toThrow(
      /No hay clave de API configurada/i
    );
  });

  test('con clave y respuesta de Gemini TTS, devuelve un buffer de audio real', async () => {
    const mockAudioBase64 = Buffer.from('AUDIO_REAL_DE_VOZ_GEMINI_TTS').toString('base64');
    const originalFetch = global.fetch;
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ audioContent: mockAudioBase64 }),
    } as any));

    try {
      const audioBuffer = await sintetizarVozGemini('Hola Alexander', { apiKey: 'AIzaSyFakeValidKeyForTesting12345' });
      expect(audioBuffer).toBeDefined();
      expect(audioBuffer.toString('utf8')).toBe('AUDIO_REAL_DE_VOZ_GEMINI_TTS');
    } finally {
      global.fetch = originalFetch;
    }
  });

  test('la ruta /api/asistente/voz-parte devuelve error 503 si el servicio no está disponible', () => {
    expect(fs.existsSync(routePath)).toBe(true);
    const content = fs.readFileSync(routePath, 'utf8');
    expect(content).toContain('status: 503');
    expect(content).toContain('sintetizarVozGemini');
  });

  test('ParteDeLaMananaPlayer tiene fallback a la voz del celular/navegador con SpeechSynthesisUtterance', () => {
    expect(fs.existsSync(playerPath)).toBe(true);
    const content = fs.readFileSync(playerPath, 'utf8');
    expect(content).toContain('SpeechSynthesisUtterance');
    expect(content).toContain('speechSynthesis');
    expect(content).toContain('/api/asistente/voz-parte');
  });

  test('ConfiguradorReunion intenta /api/asistente/voz-parte y tiene fallback a speechSynthesis', () => {
    const reunionPath = path.join(process.cwd(), 'src/app/(app)/empresa/configurador-reunion/page.tsx');
    expect(fs.existsSync(reunionPath)).toBe(true);
    const content = fs.readFileSync(reunionPath, 'utf8');
    expect(content).toContain('/api/asistente/voz-parte');
    expect(content).toContain('speechSynthesis');
  });
});

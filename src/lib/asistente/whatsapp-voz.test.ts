/** @jest-environment node */
jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('@/lib/ai/consumo-servidor', () => ({ reservarConsumoIA: jest.fn() }));
jest.mock('@/lib/asistente/cuota-voz-gemini', () => ({ reservarCupoDiarioVozGemini: jest.fn() }));
jest.mock('@/lib/asistente/voz-gemini', () => ({
  ...jest.requireActual('@/lib/asistente/voz-gemini'),
  sintetizarVozGemini: jest.fn(),
}));

import { decode } from 'audiobox';
import { reservarConsumoIA } from '@/lib/ai/consumo-servidor';
import { reservarCupoDiarioVozGemini } from '@/lib/asistente/cuota-voz-gemini';
import { pcmAWav, sintetizarVozGemini } from '@/lib/asistente/voz-gemini';
import { enviarRespuestaConVozWhatsApp, convertirWavGeminiAMp3 } from './whatsapp-voz';

const mockConsumo = reservarConsumoIA as jest.Mock;
const mockCupo = reservarCupoDiarioVozGemini as jest.Mock;
const mockSintetizar = sintetizarVozGemini as jest.Mock;

function wavDePrueba(): Buffer {
  const pcm = Buffer.alloc(24_000 * 2);
  for (let i = 0; i < 24_000; i++) pcm.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 440 * i / 24_000) * 8000), i * 2);
  return pcmAWav(pcm);
}

describe('voz saliente de WhatsApp', () => {
  let liberar: jest.Mock;
  const originalFetch = global.fetch;
  const originalGeminiKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    liberar = jest.fn().mockResolvedValue(undefined);
    mockConsumo.mockResolvedValue({ liberar });
    mockCupo.mockResolvedValue(true);
    mockSintetizar.mockResolvedValue(wavDePrueba());
    process.env.GEMINI_API_KEY = 'test-gemini-key-123';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalGeminiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalGeminiKey;
  });

  it('convierte WAV Gemini en MP3 Layer III y verifica decodificación, frecuencia, canal y muestras', async () => {
    const mp3 = await convertirWavGeminiAMp3(wavDePrueba());
    expect(mp3.length).toBeGreaterThan(1000);
    const decodificado = await decode(mp3);
    expect(decodificado.sampleRate).toBe(32000);
    expect(decodificado.channels).toBe(1);
    expect(decodificado.frames).toBeGreaterThan(0);
    expect(decodificado.channelData(0).some((muestra) => Math.abs(muestra) > 0)).toBe(true);
  });

  it('sube bytes MP3 reales y envía el mensaje Meta solo después de recibir media id y message id', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: 'media-1' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ messages: [{ id: 'wamid-1' }] }) }) as jest.Mock;

    const result = await enviarRespuestaConVozWhatsApp({
      to: '+598 99 123 456', text: 'Hola, equipo', authorized: true,
      settings: { responderConVoz: true, vozGeminiActiva: true, vozSeleccionada: 'Puck' },
      apiToken: 'token', phoneNumberId: '123456',
    });

    expect(result).toEqual({ audioEnviado: true, messageId: 'wamid-1', puedeEnviarTextoFallback: false });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    const [uploadUrl, upload] = (global.fetch as jest.Mock).mock.calls[0];
    expect(uploadUrl).toMatch(/\/123456\/media$/);
    expect(upload.body.get('file').type).toBe('audio/mpeg');
    expect(upload.body.get('file').size).toBeGreaterThan(1000);
    expect(mockSintetizar).toHaveBeenCalledWith('Hola, equipo', { voz: 'Puck' });
    const [sendUrl, send] = (global.fetch as jest.Mock).mock.calls[1];
    expect(sendUrl).toMatch(/\/123456\/messages$/);
    expect(JSON.parse(send.body)).toMatchObject({ type: 'audio', audio: { id: 'media-1' }, to: '59899123456' });
    expect(mockConsumo).toHaveBeenCalledWith('voz-cliente');
    expect(mockCupo).toHaveBeenCalledTimes(1);
  });

  it('no gasta cuota con destinatario no autorizado y no sintetiza voz', async () => {
    const result = await enviarRespuestaConVozWhatsApp({
      to: '59899123456', text: 'Hola', authorized: false,
      settings: { responderConVoz: true, vozGeminiActiva: true },
    });
    expect(result.puedeEnviarTextoFallback).toBe(true);
    expect(result.audioEnviado).toBe(false);
    expect(mockConsumo).not.toHaveBeenCalled();
    expect(mockCupo).not.toHaveBeenCalled();
    expect(mockSintetizar).not.toHaveBeenCalled();
  });

  it('libera el presupuesto mensual si la cuota diaria compartida está agotada', async () => {
    mockCupo.mockResolvedValue(false);
    const result = await enviarRespuestaConVozWhatsApp({
      to: '59899123456', text: 'Hola', authorized: true,
      settings: { responderConVoz: true, vozGeminiActiva: true }, apiToken: 'token', phoneNumberId: '123456',
    });
    expect(result.fallbackReason).toMatch(/100 voces/);
    expect(liberar).toHaveBeenCalledTimes(1);
    expect(mockSintetizar).not.toHaveBeenCalled();
  });

  it('convierte un error de reserva mensual en fallback explícito antes de reservar cupo diario', async () => {
    mockConsumo.mockRejectedValue(new Error('Firestore no disponible'));
    const result = await enviarRespuestaConVozWhatsApp({
      to: '59899123456', text: 'Hola', authorized: true,
      settings: { responderConVoz: true, vozGeminiActiva: true }, apiToken: 'token', phoneNumberId: '123456',
    });
    expect(result.fallbackReason).toMatch(/presupuesto mensual/);
    expect(result.puedeEnviarTextoFallback).toBe(true);
    expect(mockCupo).not.toHaveBeenCalled();
    expect(mockSintetizar).not.toHaveBeenCalled();
  });

  it('ante pérdida de confirmación no reintenta ni habilita envío de texto que podría duplicar', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: 'media-1' }) })
      .mockRejectedValueOnce(new Error('socket closed')) as jest.Mock;
    const result = await enviarRespuestaConVozWhatsApp({
      to: '59899123456', text: 'Hola', authorized: true,
      settings: { responderConVoz: true, vozGeminiActiva: true }, apiToken: 'token', phoneNumberId: '123456',
    });
    expect(result.audioEnviado).toBe(false);
    expect(result.puedeEnviarTextoFallback).toBe(false);
    expect(result.fallbackReason).toMatch(/no reintentes/i);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('rechaza WAV inválido sin llamar al encoder', async () => {
    await expect(convertirWavGeminiAMp3(Buffer.from('RIFFbadWAVE'))).rejects.toThrow(/WAV completo/);
  });
});

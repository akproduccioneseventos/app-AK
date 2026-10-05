/**
 * @jest-environment node
 */
/**
 * La voz del asistente (decisión del dueño, 3/10/2026): la de Gemini, con su parte gratis, y la
 * del teléfono, cada una con su interruptor en Ajustes.
 *
 * - Gemini devuelve audio crudo: se le pone el encabezado WAV, si no el teléfono no lo reproduce.
 * - Sin clave, apagada o pasado el tope del día: 503, nunca un pitido (orden 110), y la ruta dice
 *   si la voz del teléfono está prendida para que el reproductor se calle si está apagada.
 * - Los ajustes del asistente los cambia administración, no cualquiera con sesión.
 */
import fs from 'node:fs';
import path from 'node:path';

let ajustes: any = {};
let usoGuardado: any = {};
let sesion = true;
let perfil = 'admin';

jest.mock('@/lib/auth/require-session', () => ({
  hasAppSession: jest.fn(async () => sesion),
  requirePermiso: jest.fn(async () => (perfil === 'admin' ? { ok: true, user: {} } : { ok: false, error: 'Tu perfil no tiene acceso a esta parte.' })),
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) =>
    archivo === 'asistente-settings.json' ? ajustes : archivo === 'asistente/voz-uso.json' ? usoGuardado : porDefecto),
  writeData: jest.fn(async (archivo: string, datos: any) => {
    if (archivo === 'asistente/voz-uso.json') usoGuardado = datos;
    if (archivo === 'asistente-settings.json') ajustes = datos;
  }),
}));
jest.mock('@/lib/firebase/server-messaging', () => ({ sendPushNotificationToAll: jest.fn() }));
jest.mock('@/lib/whatsapp/meta-sender', () => ({ sendMetaWhatsAppMessage: jest.fn() }));

import { sintetizarVozGemini, pcmAWav } from '@/lib/asistente/voz-gemini';

const respuestaConAudio = (pcm: Buffer) => ({
  ok: true,
  status: 200,
  json: async () => ({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/L16;rate=24000', data: pcm.toString('base64') } }] } }] }),
});

describe('La voz de Gemini', () => {
  it('sin clave tira un error explícito, nunca un pitido', async () => {
    await expect(sintetizarVozGemini('Hola Alexander', { apiKey: '' })).rejects.toThrow(/No hay clave/);
  });

  it('pide AUDIO a Gemini y devuelve un WAV con el audio que mandó', async () => {
    const pcm = Buffer.from([1, 2, 3, 4, 5, 6]);
    const fetchFn = jest.fn(async () => respuestaConAudio(pcm) as any);
    const wav = await sintetizarVozGemini('Hola Alexander', { apiKey: 'clave-de-prueba-12345', voz: 'Puck', fetchFn });
    const [url, pedido] = (fetchFn.mock.calls[0] as any[]);
    expect(url).toMatch(/generativelanguage\.googleapis\.com\/v1beta\/models\/.+:generateContent$/);
    const cuerpo = JSON.parse(pedido.body);
    expect(cuerpo.generationConfig.responseModalities).toEqual(['AUDIO']);
    expect(cuerpo.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe('Puck');
    expect(pedido.headers['x-goog-api-key']).toBe('clave-de-prueba-12345');
    expect(url).not.toContain('key=');
    expect(wav.subarray(0, 4).toString()).toBe('RIFF');
    expect(wav.subarray(8, 12).toString()).toBe('WAVE');
    expect(wav.subarray(44)).toEqual(pcm);
  });

  it('si Google renombró el modelo (404), prueba el siguiente', async () => {
    const fetchFn = jest.fn()
      .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) })
      .mockResolvedValueOnce(respuestaConAudio(Buffer.from([9, 9])));
    const wav = await sintetizarVozGemini('Hola', { apiKey: 'clave-de-prueba-12345', fetchFn: fetchFn as any });
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(wav.length).toBe(46);
  });

  it('el encabezado WAV dice 24 kHz, 16 bits, un canal', () => {
    const wav = pcmAWav(Buffer.alloc(10));
    expect(wav.readUInt32LE(24)).toBe(24000);
    expect(wav.readUInt16LE(34)).toBe(16);
    expect(wav.readUInt16LE(22)).toBe(1);
  });
});

describe('Los dos interruptores', () => {
  const pedir = async () => {
    const { POST } = require('@/app/api/asistente/voz-parte/route');
    return POST({ json: async () => ({ texto: 'Hola' }) } as any);
  };
  // Con clave puesta: si el interruptor o el tope no frenaran, se llamaría a Gemini de verdad.
  beforeEach(() => { sesion = true; usoGuardado = {}; process.env.GEMINI_API_KEY = 'clave-de-prueba-12345'; });
  afterAll(() => { delete process.env.GEMINI_API_KEY; });

  it('con la voz de Gemini apagada no se llama a Gemini y dice si la del teléfono está prendida', async () => {
    ajustes = { vozGeminiActiva: false, vozTelefonoActiva: false };
    const espia = jest.fn(); (globalThis as any).fetch = espia;
    const r = await pedir();
    expect(r.status).toBe(503);
    expect((await r.json()).vozTelefonoActiva).toBe(false);
    expect(espia).not.toHaveBeenCalled();
  });

  it('pasado el tope del día no se llama a Gemini', async () => {
    ajustes = { vozGeminiActiva: true };
    const { hoyEnUruguay } = require('@/lib/utils');
    usoGuardado = { fecha: hoyEnUruguay(), cantidad: 100 };
    const espia = jest.fn(); (globalThis as any).fetch = espia;
    const r = await pedir();
    expect(r.status).toBe(503);
    expect((await r.json()).vozTelefonoActiva).toBe(true);
    expect(espia).not.toHaveBeenCalled();
  });

  it('sin sesión no hay voz', async () => {
    sesion = false;
    expect((await pedir()).status).toBe(401);
  });

  it('el reproductor se calla si la ruta dice que la voz del teléfono está apagada', () => {
    const fuente = fs.readFileSync(path.join(process.cwd(), 'src/lib/asistente/reproductor-voz.ts'), 'utf8');
    expect(fuente).toMatch(/vozTelefonoActiva === false\)\s*\{\s*reproduciendo = false;\s*opciones\?\.onEnd\?\.\(\);\s*return;/);
  });

  it('el parte de la mañana y la reunión hablan por el reproductor, no por su cuenta', () => {
    for (const archivo of ['src/components/mi-dia/ParteDeLaMananaPlayer.tsx', 'src/app/(app)/empresa/configurador-reunion/page.tsx']) {
      const fuente = fs.readFileSync(path.join(process.cwd(), archivo), 'utf8');
      expect(fuente).toContain('reproducirVozReal(');
      expect(fuente).not.toContain('new SpeechSynthesisUtterance');
    }
  });
});

describe('Quién cambia los ajustes del asistente', () => {
  it('alguien sin administración no los puede cambiar', async () => {
    perfil = 'mozo';
    ajustes = { numeroDuenio: '59898355530' };
    const { saveSettingsAsistenteAction } = require('@/app/actions/asistente-proactivo.actions');
    const r = await saveSettingsAsistenteAction({ numeroDuenio: '59899999999' });
    expect(r.success).toBe(false);
    expect(ajustes.numeroDuenio).toBe('59898355530');
  });
});

describe('El tope y el texto (auditoría 66)', () => {
  it('diez pedidos a la vez con un lugar libre: pasa uno solo', async () => {
    jest.resetModules();
    ajustes = { vozGeminiActiva: true };
    const { hoyEnUruguay } = require('@/lib/utils');
    usoGuardado = { fecha: hoyEnUruguay(), cantidad: 99 };
    process.env.GEMINI_API_KEY = 'clave-de-prueba-12345';
    (globalThis as any).fetch = jest.fn(async () => respuestaConAudio(Buffer.from([1, 2])));
    sesion = true;
    const { POST } = require('@/app/api/asistente/voz-parte/route');
    const respuestas = await Promise.all(Array.from({ length: 10 }, () => POST({ json: async () => ({ texto: 'Hola' }) } as any)));
    expect(respuestas.filter((r: any) => r.status === 200)).toHaveLength(1);
    expect(usoGuardado.cantidad).toBe(100);
    delete process.env.GEMINI_API_KEY;
  });

  it('el texto viaja en el cuerpo, no en la dirección', () => {
    const reproductor = fs.readFileSync(path.join(process.cwd(), 'src/lib/asistente/reproductor-voz.ts'), 'utf8');
    expect(reproductor).not.toMatch(/voz-parte\?/);
    expect(reproductor).toMatch(/method: 'POST'/);
    const ruta = fs.readFileSync(path.join(process.cwd(), 'src/app/api/asistente/voz-parte/route.ts'), 'utf8');
    expect(ruta).not.toMatch(/export async function GET/);
  });
});

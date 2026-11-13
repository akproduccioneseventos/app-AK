/**
 * Orden 292 — Bloque 6: El buzón valida el contenido del archivo (magic bytes).
 *
 * uploadBuzonMessage inspecciona los primeros bytes del buffer recibido y
 * rechaza con "El archivo no es una foto" (o video) si no coinciden, aunque
 * el mimetype declarado diga lo contrario (ej. un texto declarado image/jpeg).
 */

jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: jest.fn().mockResolvedValue('https://storage.googleapis.com/test.jpg'),
  deleteFromStorage: jest.fn(async () => {}),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn().mockResolvedValue({
    id: 'f1',
    buzonConfig: { enabled: true },
    guestPortalSettings: { showBuzon: true },
  }),
  saveFiesta: jest.fn(async () => {}),
}));

jest.mock('@/app/actions/social-gallery', () => ({
  addChatMessage: jest.fn(async () => {}),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => {}),
}));

jest.mock('@/lib/auth/entertainment-token', () => ({
  hasEntertainmentGuestAccess: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(async () => {}),
}));

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: {
    collection: () => ({
      where: () => ({
        where: () => ({
          limit: () => ({
            get: async () => ({ empty: true, docs: [] }),
          }),
        }),
      }),
      doc: () => ({
        set: jest.fn(async () => {}),
      }),
    }),
  },
}));

import { uploadBuzonMessage } from '@/app/actions/buzon';

function crearArchivo(buffer: Uint8Array, name: string, type: string) {
  const buf = Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  return {
    name,
    type,
    size: buf.length,
    arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
  } as unknown as File;
}

function crearFormData(file: any, mediaType: string, fiestaId = 'f1') {
  const map = new Map<string, any>([
    ['fiestaId', fiestaId],
    ['file', file],
    ['mediaType', mediaType],
    ['authorName', 'Invitado Test'],
    ['accessToken', 'tok_valido'],
  ]);
  return {
    get: (k: string) => map.get(k),
  } as unknown as FormData;
}

describe('Bloque 6 — Validación de fotos y videos en buzón por magic bytes', () => {
  it('un texto declarado como image/jpeg se rechaza con "El archivo no es una foto"', async () => {
    const textoInvalido = Buffer.from('Hola mundo, este archivo no es una imagen real');
    const file = crearArchivo(textoInvalido, 'foto_trucha.jpg', 'image/jpeg');
    const formData = crearFormData(file, 'photo');

    const res = await uploadBuzonMessage(formData);
    expect(res.success).toBe(false);
    expect(res.error).toBe('El archivo no es una foto');
  });

  it('un texto declarado como video/mp4 se rechaza con "El archivo no es un video"', async () => {
    const textoInvalido = Buffer.from('Texto plano disfrazado de video');
    const file = crearArchivo(textoInvalido, 'video_falso.mp4', 'video/mp4');
    const formData = crearFormData(file, 'video');

    const res = await uploadBuzonMessage(formData);
    expect(res.success).toBe(false);
    expect(res.error).toBe('El archivo no es un video');
  });

  it('un archivo con magic bytes reales de JPEG (FF D8 FF) es aceptado', async () => {
    // Magic bytes de JPEG: FF D8 FF E0
    const bytesJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    const file = crearArchivo(bytesJpeg, 'foto_real.jpg', 'image/jpeg');
    const formData = crearFormData(file, 'photo');

    const res = await uploadBuzonMessage(formData);
    expect(res.success).toBe(true);
    expect(res.message?.mediaType).toBe('photo');
  });

  it('un archivo con magic bytes reales de PNG (89 50 4E 47) es aceptado', async () => {
    const bytesPng = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const file = crearArchivo(bytesPng, 'foto_real.png', 'image/png');
    const formData = crearFormData(file, 'photo');

    const res = await uploadBuzonMessage(formData);
    expect(res.success).toBe(true);
    expect(res.message?.mediaType).toBe('photo');
  });
});

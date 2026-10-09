/** @jest-environment node */
/**
 * Un posteo no sale dos veces: ni por dos corridas a la vez, ni por quedar "en proceso" en TikTok.
 */
let store: any[] = [];
let cola: Promise<unknown> = Promise.resolve();
const publishToTikTok = jest.fn();

jest.mock('@/lib/data-service', () => ({
  // cada lectura devuelve una COPIA
  readData: jest.fn(async (file: string, def: any) => {
    if (file === 'social-posts.json') return JSON.parse(JSON.stringify(store));
    if (file === 'social-connections.json') {
      return [{ platform: 'TikTok', accessToken: 'tk', isConnected: true }];
    }
    return def;
  }),
  writeData: jest.fn(async (file: string, data: any[]) => {
    if (file === 'social-posts.json') store = JSON.parse(JSON.stringify(data));
  }),
  createDataItem: jest.fn(),
  // con base: transacción atómica sobre el posteo (un cambio por vez, sobre lo último guardado)
  mutateDataItem: jest.fn((_f: string, _c: string, id: string, cambiar: (p: any) => any) => {
    const turno = cola.then(async () => {
      const i = store.findIndex((p) => p.id === id);
      if (i === -1) return null;
      const nuevo = cambiar(JSON.parse(JSON.stringify(store[i])));
      if (!nuevo) return null;
      store[i] = JSON.parse(JSON.stringify(nuevo));
      return nuevo;
    });
    cola = turno.catch(() => null);
    return turno;
  }),
}));
jest.mock('@/lib/social-media/tiktok-publisher', () => ({
  publishToTikTok: (...a: any[]) => publishToTikTok(...a),
}));
for (const m of ['meta-publisher', 'youtube-publisher', 'google-business-publisher', 'pinterest-publisher', 'threads-publisher', 'x-publisher', 'unified-gateway-publisher']) {
  jest.mock(`@/lib/social-media/${m}`, () => new Proxy({}, { get: () => jest.fn() }));
}
jest.mock('@/lib/presencia-digital/mejor-horario', () => ({ mejorHorario: jest.fn() }));

import { procesarPosteosProgramados } from '@/lib/presencia-digital/publicador';

const posteo = (extra: any = {}) => ({
  id: 'p1',
  platform: 'TikTok',
  status: 'Programado',
  text: 'hola',
  mediaUrl: 'https://x/v.mp4',
  mediaType: 'video',
  publishDate: '2026-10-01T10:00:00.000Z',
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
  ...extra,
});

describe('publicador de redes', () => {
  beforeEach(() => {
    publishToTikTok.mockReset();
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
  });

  it('un posteo de TikTok ya en proceso (con publishId) no se vuelve a mandar', async () => {
    store = [posteo({ publishId: 'abc' })];
    publishToTikTok.mockResolvedValue({ success: true, status: 'PROCESSING', publishId: 'abc' });
    const r = await procesarPosteosProgramados(3, new Date('2026-10-09T12:00:00Z'));
    expect(publishToTikTok).not.toHaveBeenCalled();
    expect(r.totalPendientes).toBe(0);
  });

  it('dos corridas a la vez publican el posteo UNA vez', async () => {
    store = [posteo()];
    publishToTikTok.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 20));
      return { success: true, status: 'PUBLISH_COMPLETE', publishId: 'abc' };
    });
    const ahora = new Date('2026-10-09T12:00:00Z');
    await Promise.all([procesarPosteosProgramados(3, ahora), procesarPosteosProgramados(3, ahora)]);
    expect(publishToTikTok).toHaveBeenCalledTimes(1);
    expect(store[0].publicandoDesde).toBeUndefined();
    expect(store[0].status).toBe('Publicado');
  });

  it('con base: dos corridas a la vez publican UNA vez, por el reclamo en la transacción', async () => {
    process.env.AK_USE_LOCAL_JSON_ONLY = 'false';
    store = [posteo()];
    publishToTikTok.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 20));
      return { success: true, status: 'PUBLISH_COMPLETE', publishId: 'abc' };
    });
    const ahora = new Date('2026-10-09T12:00:00Z');
    await Promise.all([procesarPosteosProgramados(3, ahora), procesarPosteosProgramados(3, ahora)]);
    expect(publishToTikTok).toHaveBeenCalledTimes(1);
  });

  it('con base: si no se puede reclamar, no publica ni reescribe la lista', async () => {
    process.env.AK_USE_LOCAL_JSON_ONLY = 'false';
    store = [posteo()];
    const ds = jest.requireMock('@/lib/data-service');
    ds.mutateDataItem.mockImplementationOnce(async () => { throw new Error('base caída'); });
    ds.writeData.mockClear();
    await procesarPosteosProgramados(3, new Date('2026-10-09T12:00:00Z'));
    expect(publishToTikTok).not.toHaveBeenCalled();
    expect(ds.writeData).not.toHaveBeenCalled();
  });
});

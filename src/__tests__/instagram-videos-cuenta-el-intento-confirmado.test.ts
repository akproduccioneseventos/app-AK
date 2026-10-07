/**
 * Codex, 7 de octubre de 2026 (PR 1263): con dos servidores, la base REPITE la transaccion
 * cuando otro guardo en el medio. El contador de videos nuevos sumaba en cada intento, asi
 * que una sincronizacion que agrego un solo reel informaba dos.
 *
 * Esta prueba usa el `mutarDocumento` de verdad y una base de mentira que corre el cambio
 * dos veces (el primer intento se descarta, como hace Firestore). Lo que se informa tiene
 * que ser lo del intento que quedo guardado.
 */

import os from 'os';
import path from 'path';
import { mkdtempSync } from 'fs';

const copia = <T>(x: T): T => JSON.parse(JSON.stringify(x));

let guardado: Record<string, any> | undefined;
let intentos = 0;
// Lo que hace "el otro servidor" entre el intento descartado y el que se guarda.
let entreIntentos: (() => void) | undefined;

const baseDeMentira = {
  collection: () => ({ doc: () => ({ id: 'galeria-publica' }) }),
  runTransaction: async (fn: (t: any) => Promise<unknown>) => {
    // Primer intento: otro servidor guardo en el medio, la base lo descarta y repite.
    for (let vuelta = 0; vuelta < 2; vuelta++) {
      if (vuelta === 1) entreIntentos?.();
      intentos++;
      let escrito: Record<string, any> | undefined;
      const transaccion = {
        get: async () => ({ exists: guardado !== undefined, data: () => (guardado ? copia(guardado) : undefined) }),
        set: (_ref: unknown, valor: Record<string, any>) => { escrito = copia(valor); },
      };
      await fn(transaccion);
      if (vuelta === 1 && escrito) guardado = escrito;
    }
  },
};

jest.mock('@/lib/firebase/server', () => ({ dbAdmin: baseDeMentira }));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => undefined),
  requirePermiso: jest.fn(async () => ({ ok: true, user: {} })),
}));

jest.mock('@/lib/auth/perfiles', () => ({ PERMISOS: { CRM: 'crm' } }));

jest.mock('@/lib/instagram/public-feed', () => ({
  getPublicInstagramFeed: jest.fn(async () => [{
    sourceId: 'reel_unico',
    mediaType: 'video',
    mediaUrl: 'https://cdn.example.com/reel_unico.jpg',
    permalink: 'https://instagram.com/reel/reel_unico',
    caption: 'Reel de una boda #boda',
    likes: 5,
    publishedAt: '2026-10-07T12:00:00Z',
  }]),
  idOriginalDeInstagram: jest.fn((post: any) => post.sourceId || post.id),
}));

jest.mock('@/components/landing/gallery-media-utils', () => ({
  classifyGalleryCategories: jest.fn(() => ['Fiestas']),
}));

const memoria: Record<string, any> = {};
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => (memoria[file] !== undefined ? copia(memoria[file]) : copia(fallback))),
  writeData: jest.fn(async (file: string, value: any) => { memoria[file] = copia(value); }),
}));

const borrarDelDeposito = jest.fn(async () => undefined);
const borrarDelCatalogo = jest.fn(async () => undefined);
jest.mock('@/lib/firebase/storage', () => ({ deleteFromStorage: (...a: unknown[]) => borrarDelDeposito(...(a as [])) }));
jest.mock('@/app/actions/catalogo-fotos', () => ({
  deleteCatalogoFoto: (...a: unknown[]) => borrarDelCatalogo(...(a as [])),
  getCatalogoFotos: jest.fn(async () => []),
}));

import { syncInstagramPosts } from '@/app/actions/social-media';
import { deleteGaleriaItem, updateGaleriaFoto } from '@/app/actions/galeria';

describe('Instagram cuenta los videos del intento que quedo guardado', () => {
  const entornoOriginal = process.env.FIRESTORE_EMULATOR_HOST;

  beforeAll(() => {
    // Con esto `mutarDocumento` toma el camino de la base, no el del archivo local.
    process.env.FIRESTORE_EMULATOR_HOST = 'base-de-mentira';
    // La copia local que deja `mutarDocumento` va a una carpeta temporal, no al repositorio.
    const carpeta = mkdtempSync(path.join(os.tmpdir(), 'ig-replay-'));
    jest.spyOn(process, 'cwd').mockReturnValue(carpeta);
  });

  afterAll(() => {
    if (entornoOriginal === undefined) delete process.env.FIRESTORE_EMULATOR_HOST;
    else process.env.FIRESTORE_EMULATOR_HOST = entornoOriginal;
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    guardado = undefined;
    intentos = 0;
    entreIntentos = undefined;
    borrarDelDeposito.mockClear();
    borrarDelCatalogo.mockClear();
  });

  it('un reel nuevo con la transaccion repetida informa uno, no dos', async () => {
    const res = await syncInstagramPosts();

    expect(intentos).toBe(2);
    expect(res.success).toBe(true);
    const videosGuardados = (guardado?.videos || []) as any[];
    expect(videosGuardados).toHaveLength(1);
    expect(res.videosCount).toBe(videosGuardados.length);
  });

  it('si otro ya borro la foto entre intentos, borrar no toca archivos por el intento descartado', async () => {
    guardado = { fotos: [{ id: 'f1', url: 'https://deposito/f1.jpg' }], videos: [] };
    entreIntentos = () => { guardado = { fotos: [], videos: [] }; };

    await deleteGaleriaItem('f1');

    expect(intentos).toBe(2);
    expect(borrarDelCatalogo).not.toHaveBeenCalled();
    expect(borrarDelDeposito).not.toHaveBeenCalled();
  });

  it('si otro ya borro la foto entre intentos, editarla no dice que salio bien', async () => {
    guardado = { fotos: [{ id: 'f1', url: 'https://deposito/f1.jpg', titulo: 'viejo' }], videos: [] };
    entreIntentos = () => { guardado = { fotos: [], videos: [] }; };

    const res = await updateGaleriaFoto('f1', { titulo: 'nuevo' } as any);

    expect(intentos).toBe(2);
    expect(res.success).toBe(false);
  });
});

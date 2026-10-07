/**
 * Sincronización concurrente de videos de Instagram y galería pública (RED03, Orden 122).
 *
 * `galeria-publica.json` es un documento entero. Si dos llamadas a `syncInstagramPosts` o una
 * sincronización y una acción de galería leen al mismo tiempo y guardan reescribiendo el archivo,
 * se pierden videos o fotos de la otra llamada. Ahora `mutarDocumento` opera de forma atómica y
 * transaccional sobre copias actualizadas en el momento exacto del guardado.
 */

import type { GaleriaData } from '@/types/galeria';

const copia = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const esperar = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));

let memoriaStore: Record<string, any> = {};
let feedCallCount = 0;
let feedsData: any[][] = [];
let barreraActivada = false;
let resolverBarrera: (() => void) | null = null;
let promesaBarrera: Promise<void> | null = null;

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => undefined),
  requirePermiso: jest.fn(async () => ({ ok: true, user: {} })),
}));

jest.mock('@/lib/auth/perfiles', () => ({
  PERMISOS: { CRM: 'crm' },
}));

jest.mock('@/lib/instagram/public-feed', () => ({
  getPublicInstagramFeed: jest.fn(async () => {
    const idx = feedCallCount++;
    const feed = feedsData[idx] || [];
    if (barreraActivada && promesaBarrera) {
      await promesaBarrera;
    }
    return copia(feed);
  }),
  idOriginalDeInstagram: jest.fn((post: any) => post.sourceId || post.id),
}));

jest.mock('@/components/landing/gallery-media-utils', () => ({
  classifyGalleryCategories: jest.fn(() => ['Fiestas']),
}));

let turnoTransaccion: Promise<unknown> = Promise.resolve();

jest.mock('@/lib/generic-json-store', () => {
  const actual = jest.requireActual('@/lib/generic-json-store');
  return {
    ...actual,
    mutarDocumento: jest.fn(async <T>(filePath: string, vacio: T, cambiar: (val: T) => any) => {
      const run = turnoTransaccion.then(async () => {
        await esperar(5);
        const actualData = memoriaStore[filePath] !== undefined ? copia(memoriaStore[filePath]) : copia(vacio);
        const nuevo = await cambiar(actualData);
        await esperar(5);
        if (nuevo !== null && nuevo !== undefined) {
          memoriaStore[filePath] = copia(nuevo);
        }
        return nuevo;
      });
      turnoTransaccion = run.catch(() => undefined);
      return run;
    }),
  };
});

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    return memoriaStore[file] !== undefined ? copia(memoriaStore[file]) : copia(fallback);
  }),
  writeData: jest.fn(async (file: string, value: any) => {
    await esperar(5);
    memoriaStore[file] = copia(value);
  }),
}));

import { syncInstagramPosts } from '@/app/actions/social-media';
import { addGaleriaFoto } from '@/app/actions/galeria';

beforeEach(() => {
  feedCallCount = 0;
  barreraActivada = false;
  promesaBarrera = null;
  resolverBarrera = null;
  turnoTransaccion = Promise.resolve();
  memoriaStore = {
    'galeria-publica.json': { fotos: [], videos: [] } as GaleriaData,
    'catalogo-fotos.json': [],
    'social-posts.json': [],
  };
});

describe('Sincronización concurrente de videos de Instagram (RED03)', () => {
  it('dos sincronizaciones simultáneas con feeds distintos conservan ambos videos', async () => {
    const postA = {
      sourceId: 'vid_A',
      mediaType: 'video',
      mediaUrl: 'https://cdn.example.com/thumb_a.jpg',
      permalink: 'https://instagram.com/reel/vid_A',
      caption: 'Video fiesta A #fiesta',
      likes: 12,
      publishedAt: '2026-10-06T12:00:00Z',
    };

    const postB = {
      sourceId: 'vid_B',
      mediaType: 'video',
      mediaUrl: 'https://cdn.example.com/thumb_b.jpg',
      permalink: 'https://instagram.com/reel/vid_B',
      caption: 'Video fiesta B #fiesta',
      likes: 34,
      publishedAt: '2026-10-06T12:05:00Z',
    };

    feedsData = [[postA], [postB]];

    // Barrera para que ambas llamadas lean su feed antes de continuar
    barreraActivada = true;
    promesaBarrera = new Promise<void>((resolve) => {
      resolverBarrera = resolve;
    });

    const promesaSync1 = syncInstagramPosts();
    const promesaSync2 = syncInstagramPosts();

    // Liberar la barrera para que ambos procedan a guardar
    if (resolverBarrera) (resolverBarrera as () => void)();

    const [res1, res2] = await Promise.all([promesaSync1, promesaSync2]);

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);

    const galeria = memoriaStore['galeria-publica.json'] as GaleriaData;
    expect(galeria.videos).toHaveLength(2);

    const videoIds = galeria.videos.map((v) => v.id);
    expect(videoIds).toContain('ig_vid_A');
    expect(videoIds).toContain('ig_vid_B');
  });

  it('reintentos consecutivos de la misma sincronización no duplican videos', async () => {
    const postRepetido = {
      sourceId: 'vid_unico',
      mediaType: 'video',
      mediaUrl: 'https://cdn.example.com/thumb_unico.jpg',
      permalink: 'https://instagram.com/reel/vid_unico',
      caption: 'Reel único #boda',
      likes: 50,
      publishedAt: '2026-10-06T14:00:00Z',
    };

    feedsData = [[postRepetido], [postRepetido]];

    const res1 = await syncInstagramPosts();
    const res2 = await syncInstagramPosts();

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);

    const galeria = memoriaStore['galeria-publica.json'] as GaleriaData;
    expect(galeria.videos).toHaveLength(1);
    expect(galeria.videos[0].id).toBe('ig_vid_unico');
  });

  it('una mutación de galería y una sincronización de Instagram a la vez conservan ambas fotos y videos', async () => {
    const postVideo = {
      sourceId: 'vid_concurrente',
      mediaType: 'video',
      mediaUrl: 'https://cdn.example.com/thumb_conc.jpg',
      permalink: 'https://instagram.com/reel/vid_conc',
      caption: 'Reel evento #quince',
      likes: 20,
      publishedAt: '2026-10-06T15:00:00Z',
    };

    feedsData = [[postVideo]];

    const fotoManual = {
      id: 'foto_manual_1',
      url: '/media/galeria/foto1.jpg',
      titulo: 'Decoración civil',
      categoria: 'Decoración',
      destacada: false,
      orden: 1,
    };

    const [resSync] = await Promise.all([
      syncInstagramPosts(),
      addGaleriaFoto(fotoManual),
    ]);

    expect(resSync.success).toBe(true);

    const galeria = memoriaStore['galeria-publica.json'] as GaleriaData;
    expect(galeria.videos).toHaveLength(1);
    expect(galeria.videos[0].id).toBe('ig_vid_concurrente');
    expect(galeria.fotos).toHaveLength(1);
    expect(galeria.fotos[0].id).toBe('foto_manual_1');
  });
});

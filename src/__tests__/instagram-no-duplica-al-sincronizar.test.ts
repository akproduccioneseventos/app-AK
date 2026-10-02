/**
 * Sincronizar Instagram varias veces no duplica fotos (Codex, 2/10/2026).
 * La sincronización leía sus propias copias del planificador como publicaciones nuevas, les ponía
 * otro prefijo (`ig_ig_sync_…`) y en cada vuelta la misma foto entraba de nuevo a la galería.
 */
const base: Record<string, any> = {};

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (f: string, vacio: any) => JSON.parse(JSON.stringify(base[f] ?? vacio))),
  writeData: jest.fn(async (f: string, d: any) => { base[f] = JSON.parse(JSON.stringify(d)); }),
}));
jest.mock('@/lib/auth/require-session', () => ({ requirePermiso: jest.fn().mockResolvedValue({ ok: true }) }));
jest.mock('fs/promises', () => ({
  __esModule: true,
  default: { access: jest.fn(), mkdir: jest.fn(), writeFile: jest.fn() },
}));

import { syncInstagramPosts } from '@/app/actions/social-media';
import { getPublicInstagramFeed, idOriginalDeInstagram } from '@/lib/instagram/public-feed';
import { MARKETING_AUTOMATION_INTERNAL_TOKEN } from '@/lib/marketing/internal-token';

beforeEach(() => {
  for (const k of Object.keys(base)) delete base[k];
  // Lo que deja la sincronización con Meta (historial), con el número real de Instagram.
  base['social-posts.json'] = [
    { id: 'ig_history_111', sourceId: '111', platform: 'Instagram', status: 'Importado historial', text: 'Boda en el salón', mediaUrl: 'https://cdn/111.jpg', publishDate: '2026-09-01T20:00:00Z' },
    { id: 'ig_history_222', sourceId: '222', platform: 'Instagram', status: 'Importado historial', text: 'XV con luces', mediaUrl: 'https://cdn/222.jpg', publishDate: '2026-09-10T20:00:00Z' },
  ];
});

describe('Sincronizar Instagram no duplica', () => {
  it('el número original se recupera sin prefijos', () => {
    expect(idOriginalDeInstagram({ id: 'ig_sync_ig_ig_sync_ig_111' })).toBe('111');
    expect(idOriginalDeInstagram({ id: 'x', sourceId: '222' })).toBe('222');
  });

  it('tres vueltas seguidas dejan dos fotos y dos publicaciones en la web', async () => {
    for (let i = 0; i < 3; i++) {
      const r = await syncInstagramPosts(MARKETING_AUTOMATION_INTERNAL_TOKEN);
      expect(r.success).toBe(true);
    }
    const fotos = base['catalogo-fotos.json'] || [];
    expect(fotos.map((f: any) => f.sourceId).sort()).toEqual(['111', '222']);
    const web = await getPublicInstagramFeed();
    expect(web.map((p) => p.sourceId).sort()).toEqual(['111', '222']);
  });

  it('las copias que dejaron vueltas anteriores se limpian', async () => {
    base['catalogo-fotos.json'] = [
      { id: 'ig_111', source: 'instagram', sourceId: 'ig_111', url: 'https://cdn/111.jpg' },
      { id: 'ig_ig_sync_ig_111', source: 'instagram', sourceId: 'ig_ig_sync_ig_111', url: 'https://cdn/111.jpg' },
    ];
    await syncInstagramPosts(MARKETING_AUTOMATION_INTERNAL_TOKEN);
    const fotos = base['catalogo-fotos.json'];
    expect(fotos.map((f: any) => f.sourceId).sort()).toEqual(['111', '222']);
  });
});

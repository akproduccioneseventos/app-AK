import { getPublicInstagramFeed } from '@/lib/instagram/public-feed';
import { readData, writeData } from '@/lib/data-service';
import { DEFAULT_EARLIEST_DATE } from '@/lib/social-media/meta-history-backfill';
import { getSocialHistorySummary, sincronizarHistorialRedesAction } from '@/app/actions/social-history';
import { getEstadoConexiones } from '@/app/actions/conexiones-estado.actions';
import type { SocialPost } from '@/types/social-media';

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn(),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ user: { id: 'test-user', email: 'test@akproducciones.uy' } }),
  requirePermiso: jest.fn().mockResolvedValue({ ok: true, usuario: { id: 'test-user', rol: 'admin' } }),
}));

jest.mock('@/lib/social-media/meta-history-backfill', () => {
  const actual = jest.requireActual('@/lib/social-media/meta-history-backfill');
  return {
    ...actual,
    syncMetaPublicHistory: jest.fn().mockResolvedValue({
      success: true,
      earliestDate: '2019-09-01T00:00:00.000Z',
      fetched: 45,
      imported: 45,
      updated: 0,
      platforms: [
        {
          platform: 'Instagram',
          mode: 'full',
          fetched: 45,
          imported: 45,
          updated: 0,
          oldestDate: '2020-03-15T14:00:00.000Z',
          newestDate: '2026-08-20T18:00:00.000Z',
          complete: true,
        },
      ],
    }),
  };
});

jest.mock('@/lib/social-media/youtube-history-backfill', () => ({
  syncYouTubePublicHistory: jest.fn().mockResolvedValue({
    success: true,
    mode: 'rss',
    channelId: 'UClq6YnypA9PFuBgunzk306A',
    fetched: 20,
    imported: 20,
    updated: 0,
    complete: true,
    oldestDate: '2021-01-10T12:00:00.000Z',
    newestDate: '2026-08-15T10:00:00.000Z',
  }),
}));

describe('Galería con historial completo de Instagram y resumen de redes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('BLOQUE 1: getPublicInstagramFeed lee el historial guardado', () => {
    it('obtiene las publicaciones desde social-posts.json ordenadas de la más nueva a la más vieja', async () => {
      const mockPosts: Partial<SocialPost>[] = [
        {
          id: 'post-old',
          sourceId: '1001',
          platform: 'Instagram',
          mediaUrl: 'https://instagram.com/photo1.jpg',
          mediaType: 'image',
          text: 'Fiesta de 15 vieja',
          publishDate: '2021-05-10T15:00:00.000Z',
          performance: { likes: 15, comments: 2, shares: 0, views: 0 },
        },
        {
          id: 'post-new',
          sourceId: '1002',
          platform: 'Instagram',
          mediaUrl: 'https://instagram.com/reel1.mp4',
          mediaType: 'video',
          text: 'Boda reciente en Club Uruguay',
          publishDate: '2026-08-10T15:00:00.000Z',
          performance: { likes: 45, comments: 8, shares: 0, views: 0 },
        },
        {
          id: 'post-fb',
          sourceId: '2001',
          platform: 'Facebook',
          mediaUrl: 'https://facebook.com/photo.jpg',
          text: 'Post de Facebook no debe ir al feed de IG',
          publishDate: '2026-08-11T15:00:00.000Z',
        },
      ];

      (readData as jest.Mock).mockResolvedValueOnce(mockPosts);

      const feed = await getPublicInstagramFeed();

      expect(feed).toHaveLength(2);
      // Ordenado de más nueva a más vieja
      expect(feed[0].sourceId).toBe('1002');
      expect(feed[0].mediaType).toBe('video');
      expect(feed[0].caption).toContain('Boda reciente');
      expect(feed[1].sourceId).toBe('1001');
      expect(feed[1].mediaType).toBe('image');
    });

    it('deduplica publicaciones repetidas por sourceId o mediaUrl', async () => {
      const mockPosts: Partial<SocialPost>[] = [
        {
          id: 'dup-1',
          sourceId: '999',
          platform: 'Instagram',
          mediaUrl: 'https://instagram.com/same.jpg',
          publishDate: '2026-07-01T10:00:00.000Z',
        },
        {
          id: 'dup-2',
          sourceId: '999',
          platform: 'Instagram',
          mediaUrl: 'https://instagram.com/same.jpg',
          publishDate: '2026-07-01T10:00:00.000Z',
        },
      ];

      (readData as jest.Mock).mockResolvedValueOnce(mockPosts);

      const feed = await getPublicInstagramFeed();
      expect(feed).toHaveLength(1);
    });

    it('define DEFAULT_EARLIEST_DATE en septiembre de 2019', () => {
      expect(DEFAULT_EARLIEST_DATE).toBe('2019-09-01T00:00:00.000Z');
    });
  });

  describe('BLOQUE 3 & 4: Resumen de historial y acción de sincronización', () => {
    it('getSocialHistorySummary devuelve conteos y fechas por plataforma', async () => {
      const mockPosts: Partial<SocialPost>[] = [
        { id: '1', platform: 'Instagram', publishDate: '2022-01-01T00:00:00.000Z' },
        { id: '2', platform: 'Instagram', publishDate: '2026-08-01T00:00:00.000Z' },
        { id: '3', platform: 'YouTube', publishDate: '2023-05-01T00:00:00.000Z' },
      ];

      const mockMetaState = {
        platforms: {
          Instagram: {
            lastAttemptAt: '2026-08-22T10:00:00.000Z',
            lastFullSyncAt: '2026-08-22T10:00:00.000Z',
          },
        },
      };

      const mockYouTubeState = {
        complete: true,
        lastAttemptAt: '2026-08-22T10:00:00.000Z',
      };

      (readData as jest.Mock)
        .mockResolvedValueOnce(mockPosts)
        .mockResolvedValueOnce(mockMetaState)
        .mockResolvedValueOnce(mockYouTubeState);

      const summary = await getSocialHistorySummary();

      expect(summary.totalHistorical).toBe(3);
      expect(summary.byPlatform.Instagram).toBe(2);
      expect(summary.byPlatform.YouTube).toBe(1);

      const igDetail = summary.platforms.find((p) => p.platform === 'Instagram');
      expect(igDetail?.total).toBe(2);
      expect(igDetail?.isComplete).toBe(true);
      expect(igDetail?.oldestDate).toBe('2022-01-01T00:00:00.000Z');
      expect(igDetail?.newestDate).toBe('2026-08-01T00:00:00.000Z');
    });

    it('sincronizarHistorialRedesAction dispara Meta y YouTube y devuelve mensaje en criollo', async () => {
      const res = await sincronizarHistorialRedesAction({ forceFull: true });

      expect(res.success).toBe(true);
      expect(res.totalLeidas).toBe(65);
      expect(res.totalImportadas).toBe(65);
      expect(res.mensaje).toContain('Sincronización finalizada: se leyeron 65 publicaciones');
      expect(res.detallesPorRed).toHaveLength(2);
    });

    it('getEstadoConexiones incluye datos de historial en la tarjeta de Instagram', async () => {
      const mockConnections = [
        { platform: 'Instagram', isConnected: true, username: 'akproduccionesfiestasyeventos' },
      ];
      const mockPosts = [
        { id: '1', platform: 'Instagram', publishDate: '2020-04-10T12:00:00.000Z' },
        { id: '2', platform: 'Instagram', publishDate: '2026-08-20T12:00:00.000Z' },
      ];
      const mockMetaState = {
        platforms: {
          Instagram: {
            lastAttemptAt: '2026-08-22T12:00:00.000Z',
            lastFullSyncAt: '2026-08-22T12:00:00.000Z',
          },
        },
      };

      (readData as jest.Mock)
        .mockResolvedValueOnce(mockConnections)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce(mockPosts)
        .mockResolvedValueOnce(mockMetaState);

      const conexiones = await getEstadoConexiones();
      const ig = conexiones.find((c) => c.id === 'instagram');

      expect(ig).toBeDefined();
      expect(ig?.estado).toBe('conectada');
      expect(ig?.historial?.totalPublicaciones).toBe(2);
      expect(ig?.historial?.completo).toBe(true);
      expect(ig?.historial?.fechaMasVieja).toBe('2020-04-10T12:00:00.000Z');
    });
  });
});

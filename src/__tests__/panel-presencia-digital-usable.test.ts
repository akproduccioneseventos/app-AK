import {
  procesarPosteosProgramados,
  MAX_POSTEOS_POR_CORRIDA,
} from '@/lib/presencia-digital/programador-posteos';
import {
  calcularAtribucionComercialPorRed,
  normalizarOrigenRed,
} from '@/lib/presencia-digital/atribucion-redes';
import type { SocialPost } from '@/types/social-media';
import type { SocialConnection } from '@/types/settings';
import type { CrmLead } from '@/types/crm';
import type { Presupuesto } from '@/types/presupuesto';

// Mock de data-service para controlar social-posts.json y social-connections.json
jest.mock('@/lib/data-service', () => {
  let mockPosts: any[] = [];
  let mockConnections: any[] = [];

  return {
    readData: jest.fn(async (file: string, fallback: any) => {
      if (file === 'social-posts.json') return mockPosts;
      if (file === 'social-connections.json') return mockConnections;
      return fallback;
    }),
    writeData: jest.fn(async (file: string, data: any) => {
      if (file === 'social-posts.json') mockPosts = data;
      if (file === 'social-connections.json') mockConnections = data;
      return data;
    }),
    __setMockData: (posts: any[], conns: any[]) => {
      mockPosts = posts;
      mockConnections = conns;
    },
    __getMockPosts: () => mockPosts,
  };
});

// Mock de publicadores Meta para verificar éxito
jest.mock('@/lib/social-media/meta-publisher', () => ({
  publishToFacebookPage: jest.fn().mockResolvedValue({ success: true }),
  publishToInstagramBusiness: jest.fn().mockResolvedValue({ success: true }),
}));

describe('El panel de presencia digital que el dueño pueda usar solo (Orden de Agosto 2026)', () => {
  const { __setMockData, __getMockPosts } = require('@/lib/data-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Bloque 1 — Procesamiento de publicaciones programadas', () => {
    const mockConnections: SocialConnection[] = [
      {
        platform: 'Facebook',
        isConnected: true,
        pageId: 'page_123',
        pageAccessToken: 'token_fb_123',
      },
      {
        platform: 'Instagram',
        isConnected: true,
        instagramAccountId: 'ig_123',
        pageAccessToken: 'token_ig_123',
      },
    ];

    it('1. Publica posteos programados con fecha pasada y NO publica los que tienen fecha futura', async () => {
      const ahora = new Date('2026-08-18T12:00:00.000Z');

      const posts: SocialPost[] = [
        {
          id: 'post_vencido_1',
          platform: 'Facebook',
          isGeneralCampaign: false,
          publishDate: '2026-08-18T10:00:00.000Z', // Pasado
          text: 'Posteo pasado',
          status: 'Programado',
          createdAt: '2026-08-18T09:00:00.000Z',
          updatedAt: '2026-08-18T09:00:00.000Z',
        },
        {
          id: 'post_futuro_1',
          platform: 'Facebook',
          isGeneralCampaign: false,
          publishDate: '2026-08-18T15:00:00.000Z', // Futuro
          text: 'Posteo futuro',
          status: 'Programado',
          createdAt: '2026-08-18T09:00:00.000Z',
          updatedAt: '2026-08-18T09:00:00.000Z',
        },
      ];

      __setMockData(posts, mockConnections);

      const resumen = await procesarPosteosProgramados(ahora);

      expect(resumen.procesados).toBe(1);
      expect(resumen.publicados).toBe(1);

      const updatedPosts: SocialPost[] = __getMockPosts();
      const pVencido = updatedPosts.find((p) => p.id === 'post_vencido_1');
      const pFuturo = updatedPosts.find((p) => p.id === 'post_futuro_1');

      expect(pVencido?.status).toBe('Publicado');
      expect(pFuturo?.status).toBe('Programado');
    });

    it('2. Respeta el tope por corrida: con diez programados vencidos salen máximo 3, no diez', async () => {
      const ahora = new Date('2026-08-18T12:00:00.000Z');

      // Crear 10 posteos vencidos
      const diezPosts: SocialPost[] = Array.from({ length: 10 }).map((_, i) => ({
        id: `post_vencido_${i + 1}`,
        platform: 'Facebook',
        isGeneralCampaign: false,
        publishDate: new Date(ahora.getTime() - (10 - i) * 3600000).toISOString(),
        text: `Posteo ${i + 1}`,
        status: 'Programado',
        createdAt: '2026-08-17T09:00:00.000Z',
        updatedAt: '2026-08-17T09:00:00.000Z',
      }));

      __setMockData(diezPosts, mockConnections);

      const resumen = await procesarPosteosProgramados(ahora);

      expect(resumen.procesados).toBe(MAX_POSTEOS_POR_CORRIDA); // 3
      expect(resumen.publicados).toBe(3);
      expect(resumen.omitidosPorTope).toBe(7);

      const updatedPosts: SocialPost[] = __getMockPosts();
      const publicados = updatedPosts.filter((p) => p.status === 'Publicado');
      const siguenProgramados = updatedPosts.filter((p) => p.status === 'Programado');

      expect(publicados.length).toBe(3);
      expect(siguenProgramados.length).toBe(7);
    });

    it('3. Pasa redes no automatizables (TikTok, WhatsApp, Threads, X) a "Listo para copiar"', async () => {
      const ahora = new Date('2026-08-18T12:00:00.000Z');

      const posts: SocialPost[] = [
        {
          id: 'post_tiktok_1',
          platform: 'TikTok',
          isGeneralCampaign: false,
          publishDate: '2026-08-18T10:00:00.000Z',
          text: 'Video de TikTok',
          status: 'Programado',
          createdAt: '2026-08-18T09:00:00.000Z',
          updatedAt: '2026-08-18T09:00:00.000Z',
        },
      ];

      __setMockData(posts, mockConnections);

      const resumen = await procesarPosteosProgramados(ahora);

      expect(resumen.pasadosAListoParaCopiar).toBe(1);
      const updatedPosts: SocialPost[] = __getMockPosts();
      expect(updatedPosts[0].status).toBe('Listo para copiar');
      expect(updatedPosts[0].lastError).toContain('requiere publicación manual');
    });
  });

  describe('Bloque 3 — Qué red le trae clientes de verdad (Atribución comercial y cero números inventados)', () => {
    it('4. Si de una red no vino nadie, muestra cero y el cartel explícito, sin inventar números', () => {
      const leads: CrmLead[] = [
        {
          id: 'lead_1',
          name: 'Camila Rodriguez',
          createdAt: '2026-08-10T14:00:00.000Z',
          acquisition: { source: 'instagram', campaign: 'fiesta_15_promo' },
          presupuestoId: 'budget_1',
          presupuestoEstado: 'Aceptado',
        },
        {
          id: 'lead_2',
          name: 'Martín Silva',
          createdAt: '2026-08-12T16:00:00.000Z',
          acquisition: { source: 'facebook', campaign: 'bodas_salto' },
          presupuestoId: 'budget_2',
          presupuestoEstado: 'Facturado',
        },
      ];

      const budgets: Presupuesto[] = [
        {
          id: 'budget_1',
          costoFinal: 85000,
          estado: 'Aceptado',
        } as any,
        {
          id: 'budget_2',
          costoFinal: 120000,
          estado: 'Facturado',
        } as any,
      ];

      const reporte = calcularAtribucionComercialPorRed({
        leads,
        budgets,
        periodoDias: 90,
        ahora: new Date('2026-08-18T12:00:00.000Z'),
      });

      expect(reporte.totalConsultas).toBe(2);
      expect(reporte.totalContratos).toBe(2);
      expect(reporte.totalMontoUYU).toBe(205000);

      // Instagram y Facebook deben tener sus datos reales
      const ig = reporte.redes.find((r) => r.red === 'Instagram');
      expect(ig?.consultasCount).toBe(1);
      expect(ig?.contratosCount).toBe(1);
      expect(ig?.montoTotalUYU).toBe(85000);
      expect(ig?.hasData).toBe(true);

      // TikTok NO tuvo consultas: debe tener 0 y el mensaje claro sin números inventados
      const tiktok = reporte.redes.find((r) => r.red === 'TikTok');
      expect(tiktok?.consultasCount).toBe(0);
      expect(tiktok?.contratosCount).toBe(0);
      expect(tiktok?.montoTotalUYU).toBe(0);
      expect(tiktok?.hasData).toBe(false);
      expect(tiktok?.mensajeSinConsultas).toBe('De TikTok no vino ninguna consulta en estos 90 días.');
    });
  });

  describe('Normalización de redes', () => {
    it('normaliza correctamente fuentes variadas a redes oficiales', () => {
      expect(normalizarOrigenRed('instagram_reel')).toBe('Instagram');
      expect(normalizarOrigenRed('fb_ad')).toBe('Facebook');
      expect(normalizarOrigenRed('tiktok_viral')).toBe('TikTok');
      expect(normalizarOrigenRed('youtube_short')).toBe('YouTube');
      expect(normalizarOrigenRed('wa_direct')).toBe('WhatsApp');
      expect(normalizarOrigenRed('google_search')).toBe('Google / Web');
      expect(normalizarOrigenRed('')).toBe('Otros / Orgánico');
    });
  });
});

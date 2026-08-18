/**
 * Pruebas para los 4 bloques de Presencia Digital (Orden del 18 de agosto de 2026):
 * 1. Publicación de posteos programados con cron, tope de 3 por corrida y límite de 3 reintentos.
 * 2. Generación de textos con agente de IA y fallback automático a plantillas si no hay presupuesto.
 * 3. Reporte de atribución de clientes por red sin números inventados (cartel explícito si hay 0 consultas).
 * 4. Alerta de inactividad cuando hace días que no se publica.
 */

import {
  procesarPosteosProgramados,
  publishPostInternal,
} from '@/lib/presencia-digital/publicador';
import { getNetworkAttributionReport } from '@/app/actions/presencia-digital';
import * as dataService from '@/lib/data-service';
import * as aiConsumo from '@/lib/ai/consumo-servidor';
import * as marketingAgent from '@/ai/flows/marketing-agent-flow';
import { generateDraftPostsFromPartyPhotos } from '@/app/actions/social-media';
import type { SocialPost } from '@/types/social-media';
import type { CrmLead } from '@/types/crm';
import type { Presupuesto } from '@/types/presupuesto';

jest.mock('@/lib/data-service');
// Sin esto los modulos quedan de solo lectura y `jest.spyOn` no los puede cambiar.
jest.mock('@/lib/ai/consumo-servidor');
jest.mock('@/ai/flows/marketing-agent-flow');
jest.mock('@/lib/auth/require-session', () => ({
  requirePermiso: jest.fn().mockResolvedValue({ ok: true }),
  requireSession: jest.fn().mockResolvedValue({ ok: true, user: { id: 'u1', email: 'test@ak.uy' } }),
}));
jest.mock('@/lib/social-media/meta-publisher', () => ({
  publishToFacebookPage: jest.fn().mockResolvedValue({ success: true, postId: 'fb_123' }),
  publishToInstagramBusiness: jest.fn().mockResolvedValue({ success: true, mediaId: 'ig_123' }),
}));

describe('BLOQUE 1: Publicación programada con cron y límites', () => {
  const readDataMock = dataService.readData as jest.Mock;
  const writeDataMock = dataService.writeData as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('un posteo programado con fecha pasada se publica, uno con fecha futura NO', async () => {
    const ahora = new Date('2026-08-18T12:00:00Z');
    const posts: SocialPost[] = [
      {
        id: 'post_pasado',
        platform: 'Facebook',
        isGeneralCampaign: true,
        publishDate: '2026-08-18T10:00:00Z', // Pasado
        text: 'Posteo que ya venció',
        status: 'Programado',
        createdAt: '2026-08-17T10:00:00Z',
        updatedAt: '2026-08-17T10:00:00Z',
      },
      {
        id: 'post_futuro',
        platform: 'Facebook',
        isGeneralCampaign: true,
        publishDate: '2026-08-18T15:00:00Z', // Futuro
        text: 'Posteo para más tarde',
        status: 'Programado',
        createdAt: '2026-08-17T10:00:00Z',
        updatedAt: '2026-08-17T10:00:00Z',
      },
    ];

    readDataMock.mockImplementation((file: string, fallback: any) => {
      if (file === 'social-posts.json') return Promise.resolve(posts);
      if (file === 'social-connections.json') {
        return Promise.resolve([
          { platform: 'Facebook', isConnected: true, pageId: '123', pageAccessToken: 'tok' },
        ]);
      }
      return Promise.resolve(fallback);
    });

    const res = await procesarPosteosProgramados(3, ahora);

    expect(res.ok).toBe(true);
    expect(res.publicados).toContain('post_pasado');
    expect(res.publicados).not.toContain('post_futuro');
    expect(res.totalPendientes).toBe(1);
    expect(res.procesados).toBe(1);
  });

  it('tope por corrida: con 10 programados vencidos, salen máximo 3', async () => {
    const ahora = new Date('2026-08-18T12:00:00Z');
    const diezPosts: SocialPost[] = Array.from({ length: 10 }, (_, i) => ({
      id: `post_${i}`,
      platform: 'Facebook',
      isGeneralCampaign: true,
      publishDate: `2026-08-18T0${Math.min(9, i)}:00:00Z`,
      text: `Post ${i}`,
      status: 'Programado',
      createdAt: '2026-08-17T00:00:00Z',
      updatedAt: '2026-08-17T00:00:00Z',
    }));

    readDataMock.mockImplementation((file: string, fallback: any) => {
      if (file === 'social-posts.json') return Promise.resolve(diezPosts);
      if (file === 'social-connections.json') {
        return Promise.resolve([
          { platform: 'Facebook', isConnected: true, pageId: '123', pageAccessToken: 'tok' },
        ]);
      }
      return Promise.resolve(fallback);
    });

    const res = await procesarPosteosProgramados(3, ahora);

    expect(res.procesados).toBe(3);
    expect(res.totalPendientes).toBe(10);
    expect(res.omitidosPorTope).toBe(7);
  });

  it('redes manuales como TikTok se marcan Listo para copiar', async () => {
    const postTikTok: SocialPost = {
      id: 'post_tiktok_1',
      platform: 'TikTok',
      isGeneralCampaign: true,
      publishDate: '2026-08-18T10:00:00Z',
      text: 'Video de TikTok',
      status: 'Programado',
      createdAt: '2026-08-17T00:00:00Z',
      updatedAt: '2026-08-17T00:00:00Z',
    };

    readDataMock.mockImplementation((file: string, fallback: any) => {
      if (file === 'social-posts.json') return Promise.resolve([postTikTok]);
      if (file === 'social-connections.json') return Promise.resolve([]);
      return Promise.resolve(fallback);
    });

    const res = await publishPostInternal('post_tiktok_1');

    expect(res.success).toBe(true);
    expect(res.readyForManualCopy).toBe(true);
    expect(res.post?.status).toBe('Listo para copiar');
  });

  it('si un posteo falla 3 veces consecutivas, queda marcado como Falló', async () => {
    const postFallando: SocialPost = {
      id: 'post_error_1',
      platform: 'Facebook',
      isGeneralCampaign: true,
      publishDate: '2026-08-18T10:00:00Z',
      text: 'Post con credencial rota',
      status: 'Programado',
      retryCount: 2, // Ya falló 2 veces
      createdAt: '2026-08-17T00:00:00Z',
      updatedAt: '2026-08-17T00:00:00Z',
    };

    readDataMock.mockImplementation((file: string, fallback: any) => {
      if (file === 'social-posts.json') return Promise.resolve([postFallando]);
      // Sin conexiones para forzar fallo
      if (file === 'social-connections.json') return Promise.resolve([]);
      return Promise.resolve(fallback);
    });

    const res = await publishPostInternal('post_error_1');

    expect(res.success).toBe(false);
    expect(res.post?.retryCount).toBe(3);
    expect(res.post?.status).toBe('Falló');
    expect(res.post?.lastError).toBeDefined();
  });
});

describe('BLOQUE 2: Generación con IA y fallback a plantillas', () => {
  const readDataMock = dataService.readData as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('si no hay presupuesto de IA, cae limpiamente a las plantillas sin error', async () => {
    jest.spyOn(aiConsumo, 'hayPresupuestoParaIA').mockResolvedValue(false);

    const mockFiesta = {
      id: 'f1',
      configuracion: {
        nombreEvento: 'XV de Sofía',
        tipoCelebracion: '15 años',
        lugarEvento: 'Salón Trianon',
      },
      invitados: [{ id: 'i1' }, { id: 'i2' }],
    };

    const mockPostsSocialGallery = [
      { id: 'p1', imageUrl: 'https://images.ak.uy/foto1.jpg', likes: 10, estadoAprobacion: 'Aprobado' },
      { id: 'p2', imageUrl: 'https://images.ak.uy/foto2.jpg', likes: 5, estadoAprobacion: 'Aprobado' },
    ];

    readDataMock.mockImplementation((file: string, fallback: any) => {
      if (file === 'fiestas.json') return Promise.resolve([mockFiesta]);
      if (file === 'social-gallery-posts.json') return Promise.resolve(mockPostsSocialGallery);
      if (file === 'social-posts.json') return Promise.resolve([]);
      return Promise.resolve(fallback);
    });

    const res = await generateDraftPostsFromPartyPhotos('f1');

    expect(res.success).toBe(true);
    expect(res.posts).toBeDefined();
    expect(res.posts?.length).toBe(2);
    // Verifica que contiene texto estructurado de las plantillas de respaldo
    expect(res.posts?.[0].text).toContain('XV de Sofía');
    expect(res.posts?.[0].status).toBe('Borrador');
  });

  it('si la IA responde correctamente, usa el contenido generado y registra consumo', async () => {
    jest.spyOn(aiConsumo, 'hayPresupuestoParaIA').mockResolvedValue(true);
    const registrarSpy = jest.spyOn(aiConsumo, 'registrarConsumoIA').mockResolvedValue();
    jest.spyOn(marketingAgent, 'chatWithMarketingAgent').mockResolvedValue({
      content: '¡Qué noche inolvidable en los 15 de Sofía en Salto! Pura magia y diversión con AK Producciones.',
    });

    const mockFiesta = {
      id: 'f1',
      configuracion: {
        nombreEvento: 'XV de Sofía',
        tipoCelebracion: '15 años',
      },
      invitados: [],
    };

    const mockPostsSocialGallery = [
      { id: 'p1', imageUrl: 'https://images.ak.uy/foto1.jpg', likes: 10, estadoAprobacion: 'Aprobado' },
    ];

    readDataMock.mockImplementation((file: string, fallback: any) => {
      if (file === 'fiestas.json') return Promise.resolve([mockFiesta]);
      if (file === 'social-gallery-posts.json') return Promise.resolve(mockPostsSocialGallery);
      if (file === 'social-posts.json') return Promise.resolve([]);
      return Promise.resolve(fallback);
    });

    const res = await generateDraftPostsFromPartyPhotos('f1');

    expect(res.success).toBe(true);
    expect(res.posts?.[0].text).toContain('Pura magia y diversión');
    expect(registrarSpy).toHaveBeenCalled();
  });
});

describe('BLOQUE 3: Reporte de atribución por red social', () => {
  const readDataMock = dataService.readData as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra consultas reales y si de una red no vino nadie, muestra 0 y el cartel explícito', async () => {
    const leads: CrmLead[] = [
      {
        id: 'l1',
        name: 'Camila Rodriguez',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        acquisition: { source: 'instagram' },
        presupuestoId: 'b1',
        presupuestoEstado: 'Aceptado',
      },
      {
        id: 'l2',
        name: 'Martín Pérez',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        acquisition: { source: 'facebook' },
      },
    ];

    const budgets: Presupuesto[] = [
      {
        id: 'b1',
        clienteNombre: 'Camila Rodriguez',
        estado: 'Aceptado',
        totalPresupuesto: 65000,
        createdAt: new Date().toISOString(),
      } as any,
    ];

    readDataMock.mockImplementation((file: string, fallback: any) => {
      if (file === 'crm-leads.json') return Promise.resolve(leads);
      if (file === 'presupuestos.json') return Promise.resolve(budgets);
      return Promise.resolve(fallback);
    });

    const res = await getNetworkAttributionReport('90d');

    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();

    const igRow = res.data?.rows.find((r) => r.network === 'Instagram');
    const fbRow = res.data?.rows.find((r) => r.network === 'Facebook');
    const tiktokRow = res.data?.rows.find((r) => r.network === 'TikTok');

    // Instagram: 1 consulta, 1 presupuesto, 1 contratado, $65.000
    expect(igRow?.consultasCount).toBe(1);
    expect(igRow?.presupuestosCount).toBe(1);
    expect(igRow?.contratadosCount).toBe(1);
    expect(igRow?.totalRevenueUYU).toBe(65000);
    expect(igRow?.inactivityNote).toBeUndefined();

    // Facebook: 1 consulta, 0 presupuestos, 0 contratados
    expect(fbRow?.consultasCount).toBe(1);
    expect(fbRow?.contratadosCount).toBe(0);

    // TikTok: 0 consultas -> NO inventa números, tiene cartel explícito
    expect(tiktokRow?.consultasCount).toBe(0);
    expect(tiktokRow?.contratadosCount).toBe(0);
    expect(tiktokRow?.totalRevenueUYU).toBe(0);
    expect(tiktokRow?.inactivityNote).toBe('De TikTok no vino ninguna consulta en estos 90 días.');
  });
});

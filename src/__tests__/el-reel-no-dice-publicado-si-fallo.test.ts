/** @jest-environment node */

import { publishPostInternal } from '@/lib/presencia-digital/publicador';
import * as metaPublisher from '@/lib/social-media/meta-publisher';

let mockPosts: any[] = [];
let mockConnections: any[] = [];

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    if (file === 'social-posts.json') return mockPosts;
    if (file === 'social-connections.json') return mockConnections;
    return fallback;
  }),
  writeData: jest.fn(async (file: string, data: any) => {
    if (file === 'social-posts.json') mockPosts = data;
    if (file === 'social-connections.json') mockConnections = data;
  }),
  createDataItem: jest.fn(async () => {}),
}));

jest.mock('@/lib/social-media/meta-publisher', () => ({
  publishToInstagramBusiness: jest.fn(),
  publishToFacebookPage: jest.fn(),
}));

describe('El reel no dice publicado si falló', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';

    mockConnections = [
      {
        platform: 'Instagram',
        accountName: 'akproduccionesuy',
        pageAccessToken: 'token_valido_123',
        instagramAccountId: 'ig_acc_123',
        status: 'Conectado',
      },
    ];

    mockPosts = [
      {
        id: 'reel_post_1',
        platform: 'Instagram',
        text: '¡Tremendo resumen de la fiesta en video!',
        mediaUrl: 'https://storage.googleapis.com/test/video.mp4',
        mediaType: 'video',
        status: 'Programado',
        publishDate: new Date().toISOString(),
        attempts: 1,
      },
    ];
  });

  it('si Meta devuelve error en el Reel, el posteo queda "Con error" y nunca "Publicado"', async () => {
    // Simulamos que Meta devuelve error en el Reel
    (metaPublisher.publishToInstagramBusiness as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: 'Instagram falló al procesar el video de Reel: status ERROR',
    });

    const res = await publishPostInternal('reel_post_1', ['Instagram']);

    expect(res.success).toBe(false);

    const postActualizado = mockPosts.find((p) => p.id === 'reel_post_1');
    expect(postActualizado).toBeDefined();

    // Verificamos que NO diga Publicado
    expect(postActualizado.status).not.toBe('Publicado');
    // Verificamos que quede "Con error"
    expect(postActualizado.status).toBe('Con error');
    expect(postActualizado.lastError).toContain('Instagram falló al procesar el video de Reel');
  });
});

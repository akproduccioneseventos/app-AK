import {
  adaptTextForPlatform,
  getOneTouchActionUrl,
  ONE_TOUCH_CONFIGS,
} from '@/lib/social-media/social-one-touch-helper';
import { publishToUnifiedGateway } from '@/lib/social-media/unified-gateway-publisher';
import type { SocialPost } from '@/types/social-media';

describe('Publicador Multi-Redes Automático y Modo 1 Toque ($0 Costo)', () => {
  const samplePost: SocialPost = {
    id: 'test_post_1',
    platform: 'Instagram',
    isGeneralCampaign: true,
    publishDate: new Date().toISOString(),
    text: '¡Increíble fiesta de 15 de Camila! La fotocabina y la plataforma 360 estuvieron a pleno toda la noche.',
    link: 'https://akproducciones.uy/promociones',
    mediaUrl: 'https://ejemplo.com/foto1.jpg',
    mediaType: 'image',
    status: 'Programado',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  test('Adapta texto respetando límite de 280 caracteres para X (Twitter)', () => {
    const longText = 'A'.repeat(300);
    const adapted = adaptTextForPlatform('X', longText, 'https://akproducciones.uy');
    expect(adapted.length).toBeLessThanOrEqual(280);
    expect(adapted).toContain('https://akproducciones.uy');
  });

  test('Adapta texto con encabezado y formato para Estados de WhatsApp', () => {
    const adapted = adaptTextForPlatform('WhatsApp', samplePost.text, samplePost.link);
    expect(adapted).toContain('*AK Producciones Eventos*');
    expect(adapted).toContain('👉 Más info:');
    expect(adapted).toContain(samplePost.link!);
  });

  test('Añade hashtags estratégicos para TikTok si no estaban presentes', () => {
    const adapted = adaptTextForPlatform('TikTok', 'Noche mágica con nuestros servicios');
    expect(adapted).toContain('#eventos');
    expect(adapted).toContain('#fotocabina');
  });

  test('Genera URLs de acción directa (One-Touch Action URL)', () => {
    const xUrl = getOneTouchActionUrl('X', 'Hola mundo');
    expect(xUrl).toContain('https://x.com/compose/post?text=');

    const waUrl = getOneTouchActionUrl('WhatsApp', 'Texto prueba');
    expect(waUrl).toContain('https://api.whatsapp.com/send?text=');

    const igUrl = getOneTouchActionUrl('Instagram', 'Texto IG');
    expect(igUrl).toBe(ONE_TOUCH_CONFIGS.Instagram.webUrl);
  });

  test('Envía payload estructurado a pasarela unificada (n8n / Make / Webhook)', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, publishedTo: ['Instagram', 'TikTok'] }),
    });
    global.fetch = mockFetch;

    const res = await publishToUnifiedGateway({
      webhookUrl: 'https://n8n.ejemplo.com/webhook/test',
      apiKey: 'test_key',
      post: samplePost,
      targetPlatforms: ['Instagram', 'TikTok'],
    });

    expect(res.success).toBe(true);
    expect(res.publishedTo).toEqual(['Instagram', 'TikTok']);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[0]).toBe('https://n8n.ejemplo.com/webhook/test');
    const parsedBody = JSON.parse(callArgs[1].body);
    expect(parsedBody.event).toBe('social_post_publish');
    expect(parsedBody.post.id).toBe('test_post_1');
    expect(parsedBody.targetPlatforms).toEqual(['Instagram', 'TikTok']);
  });
});

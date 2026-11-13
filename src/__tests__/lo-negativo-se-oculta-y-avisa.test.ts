/**
 * Pruebas de la Orden 282: Lo negativo se oculta y avisa al dueño.
 * Verifica:
 * - Una queja se oculta (se llama a hideCommentOnMeta en Meta Graph API).
 * - A una queja o comentario negativo NO se le contesta de forma automática sola.
 * - Genera un aviso al dueño por WhatsApp con el texto y enlace al comentario.
 * - Un insulto o spam se oculta.
 * - NADA llama a borrar solo (no DELETE, reversible).
 */

import { syncCommentsFromNetworks } from '@/lib/social-media/comments-backfill';
import { clasificarComentario } from '@/lib/social-media/clasificador-comentarios';
import { readData, writeData } from '@/lib/data-service';

process.env.AK_USE_LOCAL_JSON_ONLY = 'true';

const llamadasMeta: Array<{ endpoint: string; method: string; body?: unknown }> = [];
const llamadasWhatsApp: Array<{ to: string; text: string }> = [];
let archivos: Record<string, unknown> = {};

jest.mock('server-only', () => ({}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: unknown) =>
    archivo in archivos ? archivos[archivo] : porDefecto,
  ),
  writeData: jest.fn(async (archivo: string, datos: unknown) => {
    archivos[archivo] = datos;
  }),
}));

jest.mock('@/lib/whatsapp/meta-sender', () => ({
  sendMetaWhatsAppMessage: jest.fn(async (params: { to: string; text: string }) => {
    llamadasWhatsApp.push({ to: params.to, text: params.text });
    return { success: true, messageId: 'wa_msg_123' };
  }),
}));

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => true),
  registrarConsumoIA: jest.fn(async () => true),
}));

jest.mock('@/lib/social-media/clasificador-comentarios', () => {
  const actual = jest.requireActual('@/lib/social-media/clasificador-comentarios');
  return {
    ...actual,
    clasificarComentario: jest.fn(),
  };
});

const mockedClasificar = clasificarComentario as jest.MockedFunction<typeof clasificarComentario>;

const originalFetch = global.fetch;

beforeAll(() => {
  global.fetch = jest.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const urlStr = url.toString();
    const method = init?.method || 'GET';
    const body = init?.body ? JSON.parse(init.body as string) : undefined;
    llamadasMeta.push({ endpoint: urlStr, method, body });

    // Petición a Facebook feed / comments
    if (urlStr.includes('/feed')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              id: 'post_fb_1',
              message: 'Nuestra última fiesta en Salto',
              permalink_url: 'https://facebook.com/post_fb_1',
              comments: {
                data: [
                  {
                    id: 'c_queja_1',
                    message: 'El sonido estuvo bajísimo toda la noche y la comida fría.',
                    created_time: '2026-11-12T10:00:00.000Z',
                    from: { id: 'user_1', name: 'Laura Cliente' },
                    permalink_url: 'https://facebook.com/post_fb_1/comment/c_queja_1',
                  },
                ],
              },
            },
          ],
        }),
      } as Response;
    }

    // Ocultar comentario en Meta Graph API
    if (urlStr.includes('is_hidden=true')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      } as Response;
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response;
  });
});

afterAll(() => {
  global.fetch = originalFetch;
});

const CONEXION_FACEBOOK = {
  platform: 'Facebook',
  isConnected: true,
  pageId: 'pagina_ak_test',
  pageAccessToken: 'token_fb_secreto_test',
};

describe('Lo negativo se oculta y avisa (Orden 282 - Bloque 3)', () => {
  beforeEach(() => {
    llamadasMeta.length = 0;
    llamadasWhatsApp.length = 0;
    archivos = {
      'social-connections.json': [CONEXION_FACEBOOK],
      'social-comments.json': [],
      'asistente-settings.json': {
        whatsappDuenioHabilitado: true,
        numeroDuenio: '59898355530',
      },
    };
    process.env.META_WHATSAPP_TOKEN = 'mock_wa_token';
    process.env.META_WHATSAPP_PHONE_ID = 'mock_wa_phone_id';
  });

  it('una queja se oculta llamando a hideCommentOnMeta, no se contesta sola, y avisa al dueño', async () => {
    mockedClasificar.mockResolvedValueOnce({
      classified: true,
      sentiment: 'negativo',
      sentimentReason: 'Disconformidad con sonido y comida',
      isInsultOrSpam: false,
      isLegitimateComplaint: true,
      autoHideRecommended: true,
      debeResponder: false,
    });

    const resumen = await syncCommentsFromNetworks({ full: false });

    expect(resumen.totalAutoHidden).toBe(1);

    // 1. Se llamó a ocultar en Meta (is_hidden=true)
    const llamadaOcultar = llamadasMeta.find((l) => l.endpoint.includes('is_hidden=true'));
    expect(llamadaOcultar).toBeDefined();
    expect(llamadaOcultar?.endpoint).toContain('c_queja_1');

    // 2. No se envió ninguna respuesta automática
    const llamadaResponder = llamadasMeta.find((l) => l.endpoint.includes('/comments') && l.method === 'POST');
    expect(llamadaResponder).toBeUndefined();

    // 3. Generó aviso inmediato por WhatsApp al dueño con el texto y enlace
    expect(llamadasWhatsApp.length).toBeGreaterThanOrEqual(1);
    const mensajeDuenio = llamadasWhatsApp[0].text;
    expect(mensajeDuenio).toContain('Laura Cliente');
    expect(mensajeDuenio).toContain('El sonido estuvo bajísimo');
    expect(mensajeDuenio).toContain('https://facebook.com/post_fb_1/comment/c_queja_1');

    // 4. Se guardó como auto-ocultada en la base sin responder
    const guardados = (archivos['social-comments.json'] as any[]) || [];
    expect(guardados).toHaveLength(1);
    expect(guardados[0].isAutoHidden).toBe(true);
    expect(guardados[0].respuestaAutomatica).toBeUndefined();
    expect(guardados[0].isDeleted).toBeUndefined();
  });

  it('un insulto o agresión se oculta', async () => {
    mockedClasificar.mockResolvedValueOnce({
      classified: true,
      sentiment: 'negativo',
      sentimentReason: 'Insulto agresivo',
      isInsultOrSpam: true,
      isLegitimateComplaint: false,
      autoHideRecommended: true,
      debeResponder: false,
    });

    const resumen = await syncCommentsFromNetworks({ full: false });

    expect(resumen.totalAutoHidden).toBe(1);
    const llamadaOcultar = llamadasMeta.find((l) => l.endpoint.includes('is_hidden=true'));
    expect(llamadaOcultar).toBeDefined();
  });

  it('nada llama a borrar solo (nunca ejecuta DELETE)', async () => {
    mockedClasificar.mockResolvedValueOnce({
      classified: true,
      sentiment: 'negativo',
      sentimentReason: 'Queja legítima',
      isInsultOrSpam: false,
      isLegitimateComplaint: true,
      autoHideRecommended: true,
      debeResponder: false,
    });

    await syncCommentsFromNetworks({ full: false });

    // Comprobar que NINGUNA llamada fue de método DELETE
    const llamadasDelete = llamadasMeta.filter((l) => l.method === 'DELETE');
    expect(llamadasDelete).toHaveLength(0);

    const guardados = (archivos['social-comments.json'] as any[]) || [];
    expect(guardados[0].isDeleted).toBeUndefined();
  });
});

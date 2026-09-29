/**
 * La respuesta automática a preguntas en comentarios.
 * Comprueba:
 * - una pregunta genera una respuesta que no tiene números de precio
 * - un comentario ya respondido no se responde de nuevo
 * - apagado, no se llama a Meta
 * - un insulto no se contesta
 */

import {
  responderPreguntaComentarioSiAplica,
  armarRespuestaAPregunta,
} from '@/lib/social-media/comments-backfill';
import type { SocialComment } from '@/types/comentarios-redes';
import type { SocialConnection } from '@/types/settings';

const llamadasMeta: Array<{ endpoint: string; body: unknown }> = [];
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

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => true),
  registrarConsumoIA: jest.fn(async () => true),
}));

// Mock global fetch para llamadas a Meta y Gemini
const originalFetch = global.fetch;

beforeAll(() => {
  global.fetch = jest.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const urlStr = url.toString();

    // Llamada a Meta Graph API
    if (urlStr.includes('graph.facebook.com')) {
      const body = init?.body ? JSON.parse(init.body as string) : {};
      llamadasMeta.push({ endpoint: urlStr, body });
      return {
        ok: true,
        status: 200,
        json: async () => ({ id: 'reply_123' }),
      } as Response;
    }

    // Llamada a Gemini
    if (urlStr.includes('generativelanguage.googleapis.com')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: '¡Hola! Para consultar fechas disponibles y armar una propuesta a tu medida, escribinos por WhatsApp.',
                  },
                ],
              },
            },
          ],
        }),
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

const conexionesValidas: SocialConnection[] = [
  {
    platform: 'Instagram',
    isConnected: true,
    pageAccessToken: 'token_ig_test',
    instagramAccountId: 'ig_123',
  },
  {
    platform: 'Facebook',
    isConnected: true,
    pageAccessToken: 'token_fb_test',
    pageId: 'fb_123',
  },
];

describe('la respuesta a comentarios no inventa', () => {
  beforeEach(() => {
    llamadasMeta.length = 0;
    archivos = {};
  });

  it('una pregunta genera una respuesta que no tiene números de precio', async () => {
    const respuesta = await armarRespuestaAPregunta(
      '¿Cuánto sale el servicio de 15 años para noviembre?',
      'Martina',
    );

    expect(respuesta).toBeTruthy();
    // No debe contener números ni signos de precio
    expect(respuesta).not.toMatch(/\$\s*\d+/);
    expect(respuesta).not.toMatch(/\d+\s*(pesos|dólares|usd|uyu)/i);
    expect(respuesta?.toLowerCase()).toContain('whatsapp');
  });

  it('un comentario ya respondido no se responde de nuevo', async () => {
    archivos['marketing-respuestas-comentarios.json'] = { activo: true };

    const comentario: SocialComment = {
      id: 'ig_com_1',
      network: 'Instagram',
      networkCommentId: 'net_1',
      postId: 'p1',
      authorName: 'Sofi',
      text: '¿Tienen libre el 20 de diciembre?',
      createdAt: '2026-08-10T12:00:00Z',
      esPregunta: true,
      respuestaAutomatica: {
        texto: 'Ya te respondimos antes',
        at: '2026-08-10T12:05:00Z',
      },
    };

    const respondio = await responderPreguntaComentarioSiAplica(
      comentario,
      conexionesValidas,
    );

    expect(respondio).toBe(false);
    expect(llamadasMeta).toHaveLength(0);
  });

  it('apagado, no se llama a Meta ni se envía respuesta', async () => {
    archivos['marketing-respuestas-comentarios.json'] = { activo: false };

    const comentario: SocialComment = {
      id: 'ig_com_2',
      network: 'Instagram',
      networkCommentId: 'net_2',
      postId: 'p1',
      authorName: 'Juan',
      text: '¿Cómo hago para contratar?',
      createdAt: '2026-08-10T12:00:00Z',
      esPregunta: true,
    };

    const respondio = await responderPreguntaComentarioSiAplica(
      comentario,
      conexionesValidas,
    );

    expect(respondio).toBe(false);
    expect(llamadasMeta).toHaveLength(0);
  });

  it('un insulto no se contesta', async () => {
    archivos['marketing-respuestas-comentarios.json'] = { activo: true };

    const comentario: SocialComment = {
      id: 'ig_com_3',
      network: 'Instagram',
      networkCommentId: 'net_3',
      postId: 'p1',
      authorName: 'Hater',
      text: '¿Cuánto sale la porquería que hacen, chantas?',
      createdAt: '2026-08-10T12:00:00Z',
      esPregunta: true,
      isInsultOrSpam: true,
    };

    const respondio = await responderPreguntaComentarioSiAplica(
      comentario,
      conexionesValidas,
    );

    expect(respondio).toBe(false);
    expect(llamadasMeta).toHaveLength(0);
  });
});

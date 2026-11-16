/**
 * Pruebas de la Orden 282: La presencia digital trabaja sola - Contestar todo.
 * Verifica:
 * - Un comentario positivo recibe agradecimiento cordial con la voz de AK.
 * - Una pregunta recibe respuesta.
 * - Uno de hace 3 días sin respuesta se contesta en la pasada diaria.
 * - Uno ya contestado no se contesta dos veces.
 * - Ninguna respuesta tiene precios, "garantía" ni "24/7".
 */

import {
  responderComentarioSiAplica,
  responderPreguntaComentarioSiAplica,
  armarRespuestaAPregunta,
  armarAgradecimientoComentario,
  ejecutarPasadaDiariaComentarios,
  sanitizarTextoRespuesta,
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

const originalFetch = global.fetch;

beforeAll(() => {
  global.fetch = jest.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const urlStr = url.toString();

    // Meta Graph API
    if (urlStr.includes('graph.facebook.com')) {
      const body = init?.body ? JSON.parse(init.body as string) : {};
      llamadasMeta.push({ endpoint: urlStr, body });
      return {
        ok: true,
        status: 200,
        json: async () => ({ id: 'reply_meta_123' }),
      } as Response;
    }

    // Gemini API
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
                    text: '¡Muchas gracias por acompañarnos siempre! Nos encanta ser parte de momentos inolvidables.',
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

describe('La presencia contesta todo (Orden 282 - Bloque 2)', () => {
  beforeEach(() => {
    llamadasMeta.length = 0;
    archivos = {
      'social-connections.json': conexionesValidas,
      'marketing-respuestas-comentarios.json': { activo: true },
    };
  });

  it('un comentario positivo recibe agradecimiento cordial con la voz de AK', async () => {
    const comentario: SocialComment = {
      id: 'fb_pos_1',
      network: 'Facebook',
      networkCommentId: 'net_fb_1',
      postId: 'post_100',
      authorName: 'Camila',
      text: '¡Hermoso todo lo que hacen! La fiesta estuvo divina.',
      createdAt: '2026-11-12T10:00:00Z',
      sentiment: 'positivo',
    };

    const respondio = await responderComentarioSiAplica(comentario, conexionesValidas);

    expect(respondio).toBe(true);
    expect(comentario.respuestaAutomatica).toBeTruthy();
    expect(llamadasMeta).toHaveLength(1);
    expect((llamadasMeta[0].body as any).message).toMatch(/gracias/i);
  });

  it('una pregunta recibe respuesta invitando a WhatsApp', async () => {
    const comentario: SocialComment = {
      id: 'ig_preg_1',
      network: 'Instagram',
      networkCommentId: 'net_ig_1',
      postId: 'post_200',
      authorName: 'Lucía',
      text: '¿Tienen fechas disponibles para noviembre de 2027?',
      createdAt: '2026-11-12T09:00:00Z',
      esPregunta: true,
    };

    const respondio = await responderPreguntaComentarioSiAplica(comentario, conexionesValidas);

    expect(respondio).toBe(true);
    expect(comentario.respuestaAutomatica).toBeTruthy();
    expect(llamadasMeta).toHaveLength(1);
    const mensajeEnviado = (llamadasMeta[0].body as any).message;
    expect(mensajeEnviado.toLowerCase()).toContain('whatsapp');
  });

  it('uno de hace 3 días sin respuesta se contesta en la pasada diaria', async () => {
    const ahora = new Date('2026-11-12T12:00:00Z');
    const haceTresDias = new Date('2026-11-09T12:00:00Z').toISOString();
    const haceDosHoras = new Date('2026-11-12T10:00:00Z').toISOString();

    const comentarioViejo: SocialComment = {
      id: 'fb_viejo_1',
      network: 'Facebook',
      networkCommentId: 'net_viejo_1',
      postId: 'post_300',
      authorName: 'Martín',
      text: '¡Qué lindo video! Impecable',
      createdAt: haceTresDias,
      sentiment: 'positivo',
    };

    const comentarioReciente: SocialComment = {
      id: 'fb_reciente_1',
      network: 'Facebook',
      networkCommentId: 'net_reciente_1',
      postId: 'post_301',
      authorName: 'Valeria',
      text: 'Hola, felicitaciones',
      createdAt: haceDosHoras,
      sentiment: 'positivo',
    };

    archivos['social-comments.json'] = [comentarioViejo, comentarioReciente];

    const resultado = await ejecutarPasadaDiariaComentarios(ahora, conexionesValidas);

    expect(resultado.respondidos).toBe(1);
    expect(comentarioViejo.respuestaAutomatica).toBeTruthy();
    expect(comentarioReciente.respuestaAutomatica).toBeUndefined();
  });

  it('uno ya contestado no se contesta dos veces', async () => {
    const comentario: SocialComment = {
      id: 'fb_duplicado_1',
      network: 'Facebook',
      networkCommentId: 'net_dup_1',
      postId: 'post_400',
      authorName: 'Ana',
      text: '¡Divino todo!',
      createdAt: '2026-11-10T10:00:00Z',
      sentiment: 'positivo',
      respuestaAutomatica: {
        texto: '¡Muchas gracias por tus palabras!',
        at: '2026-11-10T10:05:00Z',
      },
    };

    const respondio = await responderComentarioSiAplica(comentario, conexionesValidas);

    expect(respondio).toBe(false);
    expect(llamadasMeta).toHaveLength(0);
  });

  it('ninguna respuesta tiene precios, "garantía" ni "24/7"', async () => {
    // Sanitizador directo
    const textoConProhibidos = 'Nuestros paquetes salen $15000 dólares con garantía de sonido 24/7 para tu fiesta.';
    const sanitizado = sanitizarTextoRespuesta(textoConProhibidos);

    expect(sanitizado).not.toMatch(/\$?\s*\d+/);
    expect(sanitizado).not.toMatch(/garant[íi]a/i);
    expect(sanitizado).not.toMatch(/24\/7/i);

    // Respuesta armada para pregunta
    const respuestaPregunta = await armarRespuestaAPregunta('¿Cuánto sale la fiesta?', 'Pedro');
    expect(respuestaPregunta).toBeTruthy();
    expect(respuestaPregunta).not.toMatch(/\$\s*\d+/);
    expect(respuestaPregunta).not.toMatch(/garant[íi]a/i);
    expect(respuestaPregunta).not.toMatch(/24\/7/i);

    // Respuesta armada para positivo
    const respuestaPositivo = await armarAgradecimientoComentario('¡Hermoso todo!', 'Florencia');
    expect(respuestaPositivo).toBeTruthy();
    expect(respuestaPositivo).not.toMatch(/\$\s*\d+/);
    expect(respuestaPositivo).not.toMatch(/garant[íi]a/i);
    expect(respuestaPositivo).not.toMatch(/24\/7/i);
  });
});

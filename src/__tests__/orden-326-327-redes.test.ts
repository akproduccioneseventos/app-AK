/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { SocialComment } from '@/types/comentarios-redes';
import type { SocialConnection } from '@/types/settings';
import type { DigitalPresenceDashboardData } from '@/types/presencia-digital';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
if (typeof (globalThis as any).ResizeObserver === 'undefined') {
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

const llamadasFetch: Array<{ url: string; method: string; body?: any }> = [];
const llamadasWhatsApp: Array<{ to: string; text: string }> = [];
let archivos: Record<string, any> = {};

jest.mock('server-only', () => ({}));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null, authAdmin: null }));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => React.createElement('img', { alt: props.alt ?? '', ...props }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => React.createElement('a', { href, ...props }, children),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: unknown) =>
    archivo in archivos ? JSON.parse(JSON.stringify(archivos[archivo])) : porDefecto,
  ),
  writeData: jest.fn(async (archivo: string, datos: unknown) => {
    archivos[archivo] = JSON.parse(JSON.stringify(datos));
  }),
}));

jest.mock('@/lib/generic-json-store', () => ({
  mutateGenericJsonArray: jest.fn(async (archivo: string, fn: (lista: any[]) => any[] | null) => {
    const actual = Array.isArray(archivos[archivo]) ? archivos[archivo] : [];
    const siguiente = fn(JSON.parse(JSON.stringify(actual)));
    if (siguiente !== null) {
      archivos[archivo] = siguiente;
    }
    return siguiente;
  }),
  mutarDocumento: jest.fn(async (archivo: string, def: any, fn: (curr: any) => any) => {
    const actual = archivos[archivo] ?? def;
    const siguiente = fn(JSON.parse(JSON.stringify(actual)));
    archivos[archivo] = siguiente;
    return siguiente;
  }),
  readGenericJsonFile: jest.fn(async (archivo: string) => archivos[archivo] ?? null),
}));

jest.mock('@/lib/whatsapp/meta-sender', () => ({
  sendMetaWhatsAppMessage: jest.fn(async (params: { to: string; text: string }) => {
    llamadasWhatsApp.push({ to: params.to, text: params.text });
    return { success: true, messageId: 'wa_test_1' };
  }),
}));

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => true),
  registrarConsumoIA: jest.fn(async () => true),
  reservarConsumoIA: jest.fn(async () => ({ liberar: jest.fn(async () => {}) })),
}));

jest.mock('@/ai/genkit', () => ({
  geminiCommercialModel: 'googleai/gemini-flash-latest',
  generateWithGeminiFallback: jest.fn(async () => ({
    text: '¡Muchas gracias por tu mensaje! Nos alegra que disfrutes nuestro trabajo.',
  })),
}));

jest.mock('@/lib/social-media/clasificador-comentarios', () => {
  const actual = jest.requireActual('@/lib/social-media/clasificador-comentarios');
  return {
    ...actual,
    clasificarComentario: jest.fn(),
  };
});

jest.mock('@/app/actions/fiesta-actual', () => ({
  getFiestaActual: jest.fn(async () => null),
  getHistorialFiestas: jest.fn(async () => []),
}));

const mockSaveSocialPost = jest.fn(async (fd: FormData) => ({
  success: true,
  post: {
    id: `post_${fd.get('platform')}`,
    platform: fd.get('platform'),
    text: fd.get('text'),
    status: fd.get('status'),
    publishDate: fd.get('publishDate'),
    isGeneralCampaign: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
}));

const mockPublicarAhora = jest.fn(async () => ({ success: true }));

jest.mock('@/app/actions/social-media', () => ({
  saveSocialPost: (...args: any[]) => mockSaveSocialPost(args[0]),
  publicarPosteoAhoraAction: (...args: any[]) => mockPublicarAhora(),
  adaptarTextoPorRedAction: jest.fn(async ({ textoBase, plataformas, link }: any) => {
    const { adaptarTextoFallbackPorRed } = jest.requireActual('@/lib/social-media/adaptar-post-por-red');
    const versions: Record<string, any> = {};
    for (const p of plataformas) {
      versions[p] = adaptarTextoFallbackPorRed(textoBase, p, link);
    }
    return { success: true, versions, aiUsed: true };
  }),
}));

jest.mock('@/app/actions/social-connections', () => ({
  getSocialConnectionsPublicas: jest.fn(async () => []),
}));

const mockLeerBandejaUnica = jest.fn(async () => [
  {
    id: 'msg_1',
    canal: 'instagram_dm',
    autor: 'Camila',
    contacto: 'ig_123',
    texto: 'Hola, quiero info',
    fecha: '2026-11-19T12:00:00.000Z',
    esCliente: false,
    esProspecto: true,
    estado: 'pendiente',
    tipoContestacion: 'ninguno',
    detalles: { atiende: 'asistente' },
  },
]);

jest.mock('@/app/actions/presencia-digital', () => ({
  publishApprovedSocialPost: jest.fn(async () => ({ success: true })),
  createPostFromDailySuggestion: jest.fn(async () => ({ success: true })),
  getNetworkAttributionReport: jest.fn(async () => ({
    success: true,
    data: {
      period: '90d',
      periodLabel: 'Últimos 90 días',
      rows: [],
      totalConsultas: 0,
      totalPresupuestos: 0,
      totalContratados: 0,
      totalRevenueUYU: 0,
      bioInstagramClics: { total: 14, porBoton: { presupuesto: 10, whatsapp: 4 } },
    },
  })),
  getWebsiteAnalyticsData: jest.fn(async () => ({ success: false })),
  leerBandejaUnicaAction: () => mockLeerBandejaUnica(),
  getAjustesRespuestasAction: jest.fn(async () => ({
    comentarios: true,
    mensajesDirectos: true,
    meGusta: true,
    ocultar: true,
    palabrasClaveActivo: true,
    compartirSoloHistorias: false,
  })),
  setAjustesRespuestasAction: jest.fn(async (aj: any) => aj),
  getCompetenciaDashboardAction: jest.fn(async () => ({
    success: true,
    data: {
      cuentas: [{ username: 'rival_uy', activo: true, seguidores: 3200, publicacionesCount: 40 }],
      resumenIA: 'La competencia publicó reels de 15 años.\nBuena interacción en videos cortos.\nProbar carrusel de ambientación.',
    },
  })),
  guardarCompetenciaCuentasAction: jest.fn(async () => ({ success: true, data: { cuentas: [] } })),
  sincronizarCompetenciaAhoraAction: jest.fn(async () => ({ success: true, data: { cuentas: [] } })),
  getStoryMentionsAction: jest.fn(async () => ({
    success: true,
    mentions: [
      { id: 'm1', url: 'https://cdn.test/story.jpg', senderId: 'u1', senderName: '@invitada_ok', fecha: '2026-11-19T12:00:00.000Z', compartidoEnMiHistoria: false },
    ],
  })),
  compartirMencionEnHistoriaAction: jest.fn(async () => ({ success: true, mediaUrl: 'https://cdn.test/story.jpg' })),
}));

jest.mock('@/app/actions/comentarios-redes', () => ({
  getSocialCommentsDashboardAction: jest.fn(async () => ({
    success: true,
    data: {
      positiveComments: [],
      autoHiddenComments: [],
      legitimateComplaints: [],
      allComments: [
        {
          id: 'fb_1',
          network: 'Facebook',
          networkCommentId: 'c1',
          postId: 'p1',
          postTitle: 'Fiesta de 15',
          authorName: 'Lucía',
          text: '¡Divino todo!',
          createdAt: '2026-11-19T10:00:00.000Z',
          meGustaAt: '2026-11-19T10:01:00.000Z',
          respuestaAutomatica: { texto: '¡Muchas gracias!', at: '2026-11-19T10:01:00.000Z' },
        },
      ],
      backfillState: {},
      summaryCounts: { total: 1, positive: 1, autoHidden: 0, complaints: 0 },
    },
  })),
  triggerCommentsSyncAction: jest.fn(async () => ({ success: true })),
  restoreHiddenCommentAction: jest.fn(async () => ({ success: true })),
  hideCommentAction: jest.fn(async () => ({ success: true })),
  publishCommentAsTestimonialAction: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/app/actions/google-business-resenas', () => ({
  publicarRespuestaResenaAction: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/app/actions/seo-posicionamiento', () => ({
  getSeoPosicionamientoData: jest.fn(async () => null),
  guardarPosicionamientoKeywords: jest.fn(async () => ({ success: true })),
}));

import {
  procesarComentarioRedes,
  detectarPalabraClave,
  syncCommentsFromNetworks,
  getAjustesRespuestasComentarios,
} from '@/lib/social-media/comments-backfill';
import { clasificarComentario } from '@/lib/social-media/clasificador-comentarios';
import {
  NewPostDialog,
  getFaltaMediaPorRed,
  armarFeedbackPublicacionMultiRed,
  adaptarTextoFallbackPorRed,
} from '@/components/social-media/NewPostDialog';
import { PresenciaDigitalClient } from '@/app/(app)/empresa/presencia-digital/presencia-digital-client';

const mockedClasificar = clasificarComentario as jest.MockedFunction<typeof clasificarComentario>;

const CONEXIONES: SocialConnection[] = [
  { platform: 'Facebook', isConnected: true, pageId: 'fb_page_1', pageAccessToken: 'tok_fb' },
  { platform: 'Instagram', isConnected: true, instagramAccountId: 'ig_acc_1', pageId: 'fb_page_1', pageAccessToken: 'tok_ig' },
  { platform: 'Google', isConnected: true, accessToken: 'tok_google', locationId: 'accounts/1/locations/2' },
  { platform: 'Threads', isConnected: true, accessToken: 'tok_th', pageId: 'th_user_1' },
  { platform: 'X', isConnected: true, accessToken: 'tok_x' },
];

const originalFetch = global.fetch;

beforeAll(() => {
  process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
  process.env.META_WHATSAPP_TOKEN = 'mock_wa_tok';
  process.env.META_WHATSAPP_PHONE_ID = 'mock_wa_phone';

  global.fetch = jest.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const urlStr = url.toString();
    const method = init?.method || 'GET';
    let body: any;
    if (init?.body && typeof init.body === 'string') {
      try { body = JSON.parse(init.body); } catch { body = init.body; }
    }
    llamadasFetch.push({ url: urlStr, method, body });

    if (urlStr.includes('mybusiness.googleapis.com') && urlStr.includes('/reviews') && method === 'GET') {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          reviews: [
            {
              reviewId: 'rev_5',
              reviewer: { displayName: 'Sofía Martínez' },
              starRating: 'FIVE',
              comment: '¡Excelente fiesta, todo impecable!',
              createTime: new Date().toISOString(),
            },
            {
              reviewId: 'rev_2',
              reviewer: { displayName: 'Jorge Pérez' },
              starRating: 'TWO',
              comment: 'El salón estuvo algo frío.',
              createTime: new Date().toISOString(),
            },
          ],
        }),
      } as Response;
    }

    if (urlStr.includes('graph.facebook.com') && urlStr.includes('/feed')) {
      return { ok: true, status: 200, json: async () => ({ data: [] }) } as Response;
    }
    if (urlStr.includes('graph.facebook.com') && urlStr.includes('/media')) {
      return { ok: true, status: 200, json: async () => ({ data: [] }) } as Response;
    }
    if (urlStr.includes('graph.threads.net')) {
      return { ok: true, status: 200, json: async () => ({ data: [] }) } as Response;
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true, id: 'ok_1' }),
    } as Response;
  });
});

afterAll(() => {
  global.fetch = originalFetch;
});

beforeEach(() => {
  llamadasFetch.length = 0;
  llamadasWhatsApp.length = 0;
  mockSaveSocialPost.mockClear();
  mockPublicarAhora.mockClear();
  archivos = {
    'social-connections.json': CONEXIONES,
    'social-comments.json': [],
    'asistente-settings.json': { numeroDuenio: '59898355530', whatsappDuenioHabilitado: true },
  };
});

describe('Órdenes 326 y 327 — Centro de Redes, Comentarios y Publicador Multi-Red', () => {
  it('detectarPalabraClave compara sin mayúsculas ni acentos y por palabra entera ("info" sí, "información" sí, "informal" no)', () => {
    expect(detectarPalabraClave('Info!!')).toBe('INFO');
    expect(detectarPalabraClave('Quisiera más información por favor')).toBe('INFO');
    expect(detectarPalabraClave('El evento es bastante informal')).toBeNull();
    expect(detectarPalabraClave('¿Qué FECHA tienen libre?')).toBe('FECHA');
    expect(detectarPalabraClave('Quiero saber el précio y presupuesto')).toBe('PRECIO');
  });

  it('getAjustesRespuestasComentarios trae meGusta y palabrasClaveActivo prendidos por defecto', async () => {
    const ajustes = await getAjustesRespuestasComentarios();
    expect(ajustes.meGusta).toBe(true);
    expect(ajustes.palabrasClaveActivo).toBe(true);
    expect(ajustes.palabrasClave).toEqual(['FECHA', 'PRECIO', 'INFO', 'PRESUPUESTO']);
  });

  it('Facebook positivo da me gusta (/likes) + guarda meGustaAt + responde, y correr dos veces NO repite me gusta', async () => {
    mockedClasificar.mockResolvedValueOnce({
      classified: true,
      sentiment: 'positivo',
      sentimentReason: 'Elogio',
      isInsultOrSpam: false,
      isLegitimateComplaint: false,
      esPregunta: false,
      autoHideRecommended: false,
      debeResponder: true,
    });

    const comentario: SocialComment = {
      id: 'fb_pos_1',
      network: 'Facebook',
      networkCommentId: 'comment_fb_1',
      postId: 'post_1',
      authorName: 'María',
      text: '¡Hermoso salón y excelente atención!',
      createdAt: new Date().toISOString(),
    };

    await procesarComentarioRedes(comentario, { connections: CONEXIONES });

    expect(comentario.meGustaAt).toBeTruthy();
    expect(comentario.respuestaAutomatica).toBeTruthy();

    const likesCalls = llamadasFetch.filter((l) => l.url.includes('/comment_fb_1/likes') && l.method === 'POST');
    expect(likesCalls).toHaveLength(1);

    // Segunda pasada: no debe repetir el me gusta ni la respuesta
    await procesarComentarioRedes(comentario, { connections: CONEXIONES });
    const likesCallsAfter = llamadasFetch.filter((l) => l.url.includes('/comment_fb_1/likes') && l.method === 'POST');
    expect(likesCallsAfter).toHaveLength(1);
  });

  it('con interruptor de me gusta apagado, no llama a /likes', async () => {
    archivos['marketing-respuestas-comentarios.json'] = { activo: true, meGusta: false };
    mockedClasificar.mockResolvedValueOnce({
      classified: true,
      sentiment: 'positivo',
      isInsultOrSpam: false,
      isLegitimateComplaint: false,
      esPregunta: false,
    });

    const comentario: SocialComment = {
      id: 'fb_pos_2',
      network: 'Facebook',
      networkCommentId: 'comment_fb_2',
      postId: 'post_1',
      authorName: 'Ana',
      text: '¡Hermoso todo!',
      createdAt: new Date().toISOString(),
    };

    await procesarComentarioRedes(comentario, { connections: CONEXIONES });

    expect(comentario.meGustaAt).toBeUndefined();
    expect(llamadasFetch.some((l) => l.url.includes('/likes'))).toBe(false);
  });

  it('palabra clave "Info!!" manda 1 privado con comment_id + ref AK- + utm_source, responde en público sin precios y no repite', async () => {
    mockedClasificar.mockResolvedValueOnce({
      classified: true,
      sentiment: 'neutro',
      isInsultOrSpam: false,
      isLegitimateComplaint: false,
      esPregunta: true,
    });

    const comentario: SocialComment = {
      id: 'ig_kw_1',
      network: 'Instagram',
      networkCommentId: 'comment_ig_kw_1',
      postId: 'media_1',
      authorName: 'Carlos',
      text: 'Info!!',
      createdAt: new Date().toISOString(),
    };

    await procesarComentarioRedes(comentario, { connections: CONEXIONES });

    expect(comentario.privadoEnviadoAt).toBeTruthy();
    expect(comentario.palabraClave).toBe('INFO');
    expect((comentario.respuestaAutomatica as any)?.texto).toBe('¡Te escribimos por privado! 💬');

    const dmCalls = llamadasFetch.filter((l) => l.url.includes('/messages') && l.method === 'POST');
    expect(dmCalls).toHaveLength(1);
    expect(dmCalls[0].body.recipient).toEqual({ comment_id: 'comment_ig_kw_1' });
    expect(dmCalls[0].body.message.text).toContain('ref AK-');
    expect(dmCalls[0].body.message.text).toContain('utm_source=instagram');
    expect(dmCalls[0].body.message.text).toContain('simulador-de-presupuesto');

    const replyCalls = llamadasFetch.filter((l) => l.url.includes('/comment_ig_kw_1/replies'));
    expect(replyCalls).toHaveLength(1);
    expect(replyCalls[0].body.message).toBe('¡Te escribimos por privado! 💬');
    expect(replyCalls[0].body.message).not.toMatch(/\$\s*\d+/);

    // Segunda pasada: no manda segundo privado
    await procesarComentarioRedes(comentario, { connections: CONEXIONES });
    expect(llamadasFetch.filter((l) => l.url.includes('/messages'))).toHaveLength(1);
  });

  it('comentario de 8 días con palabra clave NO intenta mensaje privado', async () => {
    mockedClasificar.mockResolvedValueOnce({
      classified: true,
      sentiment: 'neutro',
      isInsultOrSpam: false,
      isLegitimateComplaint: false,
      esPregunta: true,
    });

    const haceOchoDias = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const comentario: SocialComment = {
      id: 'ig_old_1',
      network: 'Instagram',
      networkCommentId: 'comment_ig_old_1',
      postId: 'media_1',
      authorName: 'Pedro',
      text: 'Info por favor',
      createdAt: haceOchoDias,
    };

    await procesarComentarioRedes(comentario, { connections: CONEXIONES });

    expect(comentario.privadoEnviadoAt).toBeUndefined();
    expect(llamadasFetch.some((l) => l.url.includes('/messages'))).toBe(false);
  });

  it('"sos un chanta, info" se oculta (ocultoAt + is_hidden), NO recibe me gusta ni privado ni respuesta, y avisa al dueño', async () => {
    mockedClasificar.mockResolvedValueOnce({
      classified: true,
      sentiment: 'negativo',
      sentimentReason: 'Insulto y queja',
      isInsultOrSpam: true,
      isLegitimateComplaint: true,
      esPregunta: false,
      autoHideRecommended: true,
    });

    const comentario: SocialComment = {
      id: 'fb_insult_1',
      network: 'Facebook',
      networkCommentId: 'comment_fb_insult_1',
      postId: 'post_1',
      authorName: 'Troll',
      text: 'sos un chanta, info',
      createdAt: new Date().toISOString(),
    };

    await procesarComentarioRedes(comentario, { connections: CONEXIONES });

    expect(comentario.isAutoHidden).toBe(true);
    expect(comentario.ocultoAt).toBeTruthy();
    expect(comentario.meGustaAt).toBeUndefined();
    expect(comentario.privadoEnviadoAt).toBeUndefined();
    expect(comentario.respuestaAutomatica).toBeUndefined();
    expect(llamadasFetch.some((l) => l.url.includes('is_hidden=true'))).toBe(true);
    expect(llamadasFetch.some((l) => l.url.includes('/likes'))).toBe(false);
    expect(llamadasFetch.some((l) => l.url.includes('/messages'))).toBe(false);
    expect(llamadasWhatsApp.length).toBeGreaterThanOrEqual(1);
  });

  it('Google reseñas: 5 estrellas contesta sola con el nombre; 2 estrellas NO contesta sola y deja borrador + aviso al dueño', async () => {
    const summary = await syncCommentsFromNetworks({ full: false });
    expect(summary.success).toBe(true);

    const guardados = archivos['social-comments.json'] as SocialComment[];
    const rev5 = guardados.find((c) => c.id === 'google_rev_5');
    const rev2 = guardados.find((c) => c.id === 'google_rev_2');

    expect(rev5).toBeDefined();
    expect(rev5?.respuestaAutomatica).toBeTruthy();
    expect((rev5?.respuestaAutomatica as any).texto).toContain('Sofía Martínez');
    expect(llamadasFetch.some((l) => l.url.includes('/reviews/rev_5/reply') && l.method === 'PUT')).toBe(true);

    expect(rev2).toBeDefined();
    expect(rev2?.respuestaAutomatica).toBeUndefined();
    expect(rev2?.borradorRespuesta).toBeTruthy();
    expect(llamadasFetch.some((l) => l.url.includes('/reviews/rev_2/reply'))).toBe(false);
    expect(llamadasWhatsApp.some((w) => w.text.includes('Jorge Pérez'))).toBe(true);
  });

  it('NewPostDialog: adapta por red sin precios/garantía, marca redes conectadas, deja en gris las sin imagen y muestra "Publicado en 3 de 4. Instagram: falta la foto"', async () => {
    expect(getFaltaMediaPorRed('Instagram', false, false)).toBe('falta la foto');
    expect(getFaltaMediaPorRed('Facebook', false, false)).toBeNull();

    const xAdapted = adaptarTextoFallbackPorRed('Gran fiesta por $50000 con garantía total #fiesta #salto', 'X');
    expect(xAdapted.text.length).toBeLessThanOrEqual(260);
    expect(xAdapted.text).not.toMatch(/garant/i);
    expect(xAdapted.text).not.toMatch(/\$\s*50000/);

    const googleAdapted = adaptarTextoFallbackPorRed('Gran noche de boda #boda #salto', 'Google');
    expect(googleAdapted.text).not.toContain('#');
    expect(googleAdapted.ctaLabel).toBe('Consultar');

    const pinAdapted = adaptarTextoFallbackPorRed('Ambientación única', 'Pinterest', 'https://akproducciones.uy');
    expect(pinAdapted.title).toBeTruthy();
    expect(pinAdapted.link).toBe('https://akproducciones.uy');

    expect(
      armarFeedbackPublicacionMultiRed({
        publicadas: 3,
        total: 4,
        motivosFallo: [{ platform: 'Instagram', reason: 'falta la foto' }],
      }),
    ).toBe('Publicado en 3 de 4. Instagram: falta la foto');

    const container = document.createElement('div');
    document.body.appendChild(container);
    let root: Root | null = null;

    const initialConnections: SocialConnection[] = [
      { platform: 'Instagram', isConnected: true },
      { platform: 'Facebook', isConnected: true },
      { platform: 'Threads', isConnected: true },
      { platform: 'X', isConnected: true },
      { platform: 'Pinterest', isConnected: false },
    ];

    await act(async () => {
      root = createRoot(container);
      root.render(
        React.createElement(NewPostDialog, {
          isOpen: true,
          onPostCreated: jest.fn(),
          initialConnections,
        }),
      );
    });

    expect(document.body.textContent).toContain('Instagram: falta la foto');
    expect(document.body.textContent).toContain('Conectar');

    const textArea = document.body.querySelector('textarea#text') as HTMLTextAreaElement;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')!.set!;
      setter.call(textArea, 'Noche mágica de 15 años en Salto');
      textArea.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const form = document.body.querySelector('form')!;
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(mockSaveSocialPost).toHaveBeenCalledTimes(3);
    const statusBanner = document.body.querySelector('[role="status"]')?.textContent || '';
    expect(statusBanner).toContain('Publicado en 3 de 4. Instagram: falta la foto');
    expect(statusBanner.toLowerCase()).not.toContain('listo');

    await act(async () => {
      root?.unmount();
    });
    container.remove();
  });

  it('PresenciaDigitalClient muestra las 6 solapas (incluyendo Comentarios), avisos de TikTok/Pinterest, Para compartir, Competencia, Biografía de Instagram y enlace /enlaces', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    let root: Root | null = null;

    const mockDashboard: DigitalPresenceDashboardData = {
      kpis: {
        totalFollowers: 1500,
        followersWeeklyChange: 25,
        weeklyReach: 8000,
        reachWeeklyChangePct: 10,
        activeAdSpendMonth: 0,
        signedPartiesFromAds: 2,
        averageCostPerSignedParty: null,
        pendingApprovalPostsCount: 0,
        googleRating: 4.8,
        googleReviewsCount: 12,
      },
      commercialAdsRoi: [],
      review: {
        date: '2026-11-19',
        generatedAt: '2026-11-19T12:00:00.000Z',
        summary: 'Todo bien',
        topPost: null,
        inactivePlatforms: [],
        disconnectedPlatforms: [],
        dailyPostSuggestion: {
          concept: 'Boda',
          text: 'Texto sugerido',
          recommendedPlatform: 'Instagram',
          hashtags: ['#AK'],
        },
        aiUsed: false,
      },
      recentHistory: [],
      platformsStatus: [
        { platform: 'Instagram', isConnected: true, followers: null, daysWithoutPost: 1, canAutoPublish: true },
        { platform: 'Facebook', isConnected: true, followers: null, daysWithoutPost: 1, canAutoPublish: true },
      ],
    };

    await act(async () => {
      root = createRoot(container);
      root.render(
        React.createElement(PresenciaDigitalClient, {
          initialData: mockDashboard,
          initialPosts: [],
        }),
      );
    });

    expect(container.querySelector('[data-testid="tab-comentarios"]')).not.toBeNull();

    // Ir a solapa Comentarios
    await act(async () => {
      (container.querySelector('[data-testid="tab-comentarios"]') as HTMLButtonElement).click();
    });
    expect(container.textContent).toContain('Esta red no deja contestar desde otra aplicación');
    expect(container.textContent).toContain('contestado solo');
    expect(container.textContent).toContain('con me gusta');

    // Ir a solapa Mensajes
    await act(async () => {
      (container.querySelector('[data-testid="tab-mensajes"]') as HTMLButtonElement).click();
    });
    expect(container.textContent).toContain('TikTok todavía no deja leer los mensajes desde otra aplicación');
    expect(container.textContent).toContain('Atiende: asistente');

    // Ir a solapa Publicaciones
    await act(async () => {
      (container.querySelector('[data-testid="tab-publicaciones"]') as HTMLButtonElement).click();
    });
    expect(container.textContent).toContain('Para compartir');
    expect(container.textContent).toContain('Compartir en mi historia');
    expect(container.textContent).toContain('Compartir solo: Apagado');

    // Ir a solapa Resultados -> Competencia y Atribución
    await act(async () => {
      (container.querySelector('[data-testid="tab-resultados"]') as HTMLButtonElement).click();
    });
    const btnCompetencia = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Competencia');
    expect(btnCompetencia).toBeDefined();
    await act(async () => {
      btnCompetencia!.click();
    });
    expect(container.textContent).toContain('@rival_uy');
    expect(container.textContent).toContain('3.200');

    const btnAtribucion = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Atribución Comercial');
    await act(async () => {
      btnAtribucion!.click();
    });
    expect(container.textContent).toContain('Biografía de Instagram');

    // Ir a solapa Conexiones
    await act(async () => {
      (container.querySelector('[data-testid="tab-conexiones"]') as HTMLButtonElement).click();
    });
    expect(container.textContent).toContain('Poné este enlace en tu biografía');
    expect(container.textContent).toContain('/enlaces');

    await act(async () => {
      root?.unmount();
    });
    container.remove();
  });
});

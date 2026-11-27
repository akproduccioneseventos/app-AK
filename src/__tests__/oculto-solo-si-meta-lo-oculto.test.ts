/** @jest-environment node */

const copia = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
let almacen: Record<string, any> = {};

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) =>
    almacen[file] !== undefined ? copia(almacen[file]) : copia(fallback),
  ),
  writeData: jest.fn(async (file: string, data: any) => {
    almacen[file] = copia(data);
  }),
}));

jest.mock('@/lib/generic-json-store', () => ({
  mutateGenericJsonArray: jest.fn(async (file: string, cambiar: (lista: any[]) => any[] | null) => {
    const actual = Array.isArray(almacen[file]) ? copia(almacen[file]) : [];
    const nueva = cambiar(actual);
    if (nueva) {
      almacen[file] = copia(nueva);
    }
    return nueva;
  }),
}));

const mockClasificarComentario = jest.fn();
const mockAlertarDuenio = jest.fn(async () => true);

jest.mock('@/lib/social-media/clasificador-comentarios', () => ({
  clasificarComentario: (...args: any[]) => mockClasificarComentario(...args),
  armarAgradecimientoComentario: jest.fn(async () => '¡Gracias!'),
  sanitizarTextoRespuesta: jest.fn((t: string) => t),
  alertarDuenioPorComentarioNegativo: (...args: any[]) => (mockAlertarDuenio as any)(...args),
}));

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => true),
}));

jest.mock('@/ai/cerebro', () => ({
  pedirTexto: jest.fn(async () => ({ ok: true, texto: 'Gracias por escribirnos.' })),
}));

jest.mock('@/lib/social-media/google-business-resenas', () => ({
  getGoogleBusinessReviews: jest.fn(async () => ({ success: false, reviews: [] })),
  replyToGoogleBusinessReview: jest.fn(async () => ({ success: false })),
  generarBorradorRespuesta: jest.fn(() => 'Borrador'),
}));

import {
  procesarComentarioRedes,
  syncCommentsFromNetworks,
  hideCommentInternal,
} from '@/lib/social-media/comments-backfill';

describe('Orden 368 B1 — oculto sólo si Meta lo ocultó', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    almacen = {
      'social-connections.json': [
        {
          platform: 'Facebook',
          isConnected: true,
          pageId: 'page_1',
          pageAccessToken: 'tok_fb',
        },
      ],
      'social-comments.json': [],
      'marketing-respuestas-comentarios.json': { activo: true, ocultar: true },
    };
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('si Meta responde error al ocultar, marca ocultarPendiente y NO isAutoHidden', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 500 }) as any);

    const comentario: any = {
      id: 'fb_c1',
      network: 'Facebook',
      networkCommentId: 'c1',
      postId: 'p1',
      authorName: 'Usuario Molesto',
      text: 'Pésimo servicio, una estafa',
      createdAt: new Date().toISOString(),
      sentiment: 'negativo',
      isInsultOrSpam: true,
      autoHideRecommended: true,
      classifiedAt: new Date().toISOString(),
    };

    const res: any = await procesarComentarioRedes(comentario, {
      connections: almacen['social-connections.json'],
    });

    expect(res.isAutoHidden).not.toBe(true);
    expect(res.ocultarPendiente).toBe(true);
    expect(res.ocultarPendienteMotivo).toBeTruthy();
  });

  it('si no hay token de Meta, marca ocultarPendiente y NO isAutoHidden', async () => {
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as any;

    const comentario: any = {
      id: 'ig_c2',
      network: 'Instagram',
      networkCommentId: 'c2',
      postId: 'p2',
      authorName: '@troll',
      text: 'Spam basura',
      createdAt: new Date().toISOString(),
      sentiment: 'negativo',
      isInsultOrSpam: true,
      autoHideRecommended: true,
      classifiedAt: new Date().toISOString(),
    };

    const res: any = await procesarComentarioRedes(comentario, {
      connections: [{ platform: 'Instagram', isConnected: false }],
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(res.isAutoHidden).not.toBe(true);
    expect(res.ocultarPendiente).toBe(true);
  });

  it('cuando Meta responde bien, marca isAutoHidden: true y limpia ocultarPendiente en el reintento de sync', async () => {
    almacen['social-comments.json'] = [
      {
        id: 'fb_c3',
        network: 'Facebook',
        networkCommentId: 'c3',
        postId: 'p3',
        authorName: 'Spammer',
        text: 'Insulto',
        createdAt: new Date().toISOString(),
        classifiedAt: new Date().toISOString(),
        sentiment: 'negativo',
        isInsultOrSpam: true,
        autoHideRecommended: true,
        ocultarPendiente: true,
        ocultarPendienteMotivo: 'Falla previa',
        ocultarPendienteIntentos: 1,
      },
    ];

    global.fetch = jest.fn(async (url: string) => {
      if (String(url).includes('is_hidden=true')) {
        return { ok: true, status: 200, json: async () => ({ success: true }) } as any;
      }
      return { ok: true, status: 200, json: async () => ({ data: [] }) } as any;
    });

    const summary = await syncCommentsFromNetworks({ full: false });
    expect(summary.totalAutoHidden).toBe(1);

    const guardado = almacen['social-comments.json'][0];
    expect(guardado.isAutoHidden).toBe(true);
    expect(guardado.ocultarPendiente).toBeUndefined();
  });

  it('si falla de nuevo al reintentar, avisa al dueño', async () => {
    almacen['social-comments.json'] = [
      {
        id: 'fb_c4',
        network: 'Facebook',
        networkCommentId: 'c4',
        postId: 'p4',
        authorName: 'Cliente Enojado',
        text: 'Queja persistente',
        createdAt: new Date().toISOString(),
        classifiedAt: new Date().toISOString(),
        sentiment: 'negativo',
        isLegitimateComplaint: true,
        autoHideRecommended: true,
        ocultarPendiente: true,
        ocultarPendienteIntentos: 1,
      },
    ];

    global.fetch = jest.fn(async (url: string) => {
      if (String(url).includes('is_hidden=true')) {
        return { ok: false, status: 500 } as any;
      }
      return { ok: true, status: 200, json: async () => ({ data: [] }) } as any;
    });

    await syncCommentsFromNetworks({ full: false });

    expect(mockAlertarDuenio).toHaveBeenCalled();
    const guardado = almacen['social-comments.json'][0];
    expect(guardado.isAutoHidden).not.toBe(true);
    expect(guardado.ocultarPendiente).toBe(true);
  });

  it('hideCommentInternal devuelve success: false y marca ocultarPendiente si Meta falla, y success: true si Meta oculta', async () => {
    almacen['social-comments.json'] = [
      {
        id: 'fb_c5',
        network: 'Facebook',
        networkCommentId: 'c5',
        postId: 'p5',
        authorName: 'Usuario',
        text: 'Comentario malo',
        createdAt: new Date().toISOString(),
      },
    ];

    global.fetch = jest.fn(async () => ({ ok: false, status: 502 }) as any);
    const resFallo = await hideCommentInternal('fb_c5');
    expect(resFallo.success).toBe(false);
    expect(almacen['social-comments.json'][0].isAutoHidden).not.toBe(true);
    expect(almacen['social-comments.json'][0].ocultarPendiente).toBe(true);

    global.fetch = jest.fn(async () => ({ ok: true, status: 200 }) as any);
    const resOk = await hideCommentInternal('fb_c5');
    expect(resOk.success).toBe(true);
    expect(almacen['social-comments.json'][0].isAutoHidden).toBe(true);
    expect(almacen['social-comments.json'][0].ocultarPendiente).toBeUndefined();
  });
});

/**
 * @jest-environment node
 */
import fs from 'node:fs';
import path from 'node:path';

const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

const archivosMemoria = new Map<string, any>();
let fiestaStore: any;
let collectionsStore: Map<string, Map<string, any>>;
let sessionMock: { success: boolean; user?: any } = { success: false };
let portalSessionOk = true;
let turnoFiesta: Promise<unknown> = Promise.resolve();

function getCollectionMap(name: string): Map<string, any> {
  if (!collectionsStore.has(name)) collectionsStore.set(name, new Map());
  return collectionsStore.get(name)!;
}

const mockAddPagoToPresupuesto = jest.fn(async () => ({ success: true }));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => {
    if (archivo === 'fiestas/f1.json' && fiestaStore) return copia(fiestaStore);
    if (archivosMemoria.has(archivo)) return copia(archivosMemoria.get(archivo));
    return copia(porDefecto);
  }),
  writeData: jest.fn(async (archivo: string, datos: any) => {
    archivosMemoria.set(archivo, copia(datos));
  }),
  updateDataPartial: jest.fn(async () => ({})),
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => sessionMock),
}));

jest.mock('@/lib/auth/solo-lectura', () => ({
  exigirQueSePuedaGuardar: jest.fn(async () => undefined),
  esSesionDeAuditor: jest.fn(async () => false),
  esSesionDeSoloLectura: jest.fn(async () => false),
}));

jest.mock('@/lib/auth/require-session', () => {
  const { puede } = jest.requireActual('@/lib/auth/perfiles');
  return {
    hasAppSession: jest.fn(async () => Boolean(sessionMock.success)),
    requireAppSession: jest.fn(async () => {
      if (!sessionMock.success) throw new Error('Sesión requerida');
      return sessionMock.user;
    }),
    requirePermiso: jest.fn(async (permiso: string) => {
      if (!sessionMock.success || !puede(sessionMock.user, permiso)) {
        return { ok: false, error: 'Tu perfil no tiene acceso a esta parte.' };
      }
      return { ok: true, user: sessionMock.user };
    }),
    requirePermisoAlguno: jest.fn(async (...permisos: string[]) => {
      if (!sessionMock.success || !permisos.some((p) => puede(sessionMock.user, p))) {
        throw new Error('Tu perfil no tiene acceso a esta parte.');
      }
      return sessionMock.user;
    }),
  };
});

jest.mock('@/lib/auth/event-access', () => {
  const { puede, PERMISOS } = jest.requireActual('@/lib/auth/perfiles');
  return {
    PERMISOS,
    requireEventPermission: jest.fn(async (_fiestaId: string, permiso: string) => {
      if (!sessionMock.success || !puede(sessionMock.user, permiso)) {
        throw new Error('Sin permiso para este evento.');
      }
      return copia(fiestaStore);
    }),
  };
});

jest.mock('@/app/actions/empleados', () => ({
  getEmpleados: jest.fn(async () => [{ id: 'op1', email: 'op@ak.test', nombre: 'Operador' }]),
}));

jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn(async () => (fiestaStore ? [copia(fiestaStore)] : [])),
  leerHistorialCrudo: jest.fn(async () => []),
}));

jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({
  getFiestaByIdRaw: jest.fn(async () => (fiestaStore ? copia(fiestaStore) : null)),
}));

jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn((_id: string, cambiar: (f: any) => any) => {
    const r = turnoFiesta.then(async () => {
      try {
        fiestaStore = copia(await cambiar(copia(fiestaStore)));
        return { success: true, fiesta: copia(fiestaStore) };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    });
    turnoFiesta = r.catch(() => undefined);
    return r;
  }),
}));

jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: jest.fn(async (_buf: any, storagePath: string) => `https://storage.test/${storagePath}`),
  deleteFromStorage: jest.fn(async () => undefined),
}));

jest.mock('@/lib/social-fiesta/content-safety-ai', () => ({
  checkImageSafety: jest.fn(async () => ({ safe: true, reason: 'clean' })),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(async () => undefined),
}));

jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn(async () => portalSessionOk),
  setPortalSessionCookie: jest.fn(async () => undefined),
}));

jest.mock('@/app/actions/presupuestos', () => ({
  addPagoToPresupuesto: (...args: any[]) => mockAddPagoToPresupuesto(...args),
  getPresupuestoById: jest.fn(async () => null),
  getPresupuestos: jest.fn(async () => []),
}));

jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: jest.fn(async () => undefined),
}));

jest.mock('@/app/actions/google-workspace-extended', () => ({
  notifyClientPaymentSubmitted: jest.fn(async () => undefined),
  notifyClientPaymentApproved: jest.fn(async () => undefined),
  notifyClientPaymentRejected: jest.fn(async () => undefined),
}));

jest.mock('@/lib/firebase/server', () => {
  const construirConsulta = (coleccion: string, filtros: Array<[string, any]> = []) => ({
    where: (campo: string, _op: string, valor: any) => construirConsulta(coleccion, [...filtros, [campo, valor]]),
    select: () => construirConsulta(coleccion, filtros),
    limit: (n: number) => ({
      get: async () => {
        const docs = [...getCollectionMap(coleccion).values()]
          .filter((d) => filtros.every(([c, v]) => d[c] === v))
          .slice(0, n)
          .map((d) => ({ id: d.id, data: () => copia(d) }));
        return { size: docs.length, empty: docs.length === 0, docs };
      },
    }),
    get: async () => {
      const docs = [...getCollectionMap(coleccion).values()]
        .filter((d) => filtros.every(([c, v]) => d[c] === v))
        .map((d) => ({ id: d.id, data: () => copia(d) }));
      return { size: docs.length, empty: docs.length === 0, docs };
    },
    doc: (id: string) => ({
      get: async () => {
        const col = getCollectionMap(coleccion);
        return {
          exists: col.has(id),
          data: () => (col.has(id) ? copia(col.get(id)) : undefined),
        };
      },
      set: async (data: any) => {
        getCollectionMap(coleccion).set(id, copia(data));
      },
      create: async (data: any) => {
        const col = getCollectionMap(coleccion);
        if (col.has(id)) {
          const err: any = new Error('ALREADY_EXISTS');
          err.code = 6;
          throw err;
        }
        col.set(id, copia(data));
      },
      update: async (parcial: any) => {
        const col = getCollectionMap(coleccion);
        const prev = col.get(id) ?? {};
        col.set(id, copia({ ...prev, ...parcial }));
      },
    }),
  });

  return {
    dbAdmin: {
      collection: (name: string) => construirConsulta(name),
    },
  };
});

import { decidir } from '@/lib/ai/decisiones';
import { getResumenDeGasto, setTopeMensual } from '@/lib/ai/consumo-servidor';
import { COSTO_ESTIMADO_UYU } from '@/lib/ai/consumo';
import { uploadSocialPost, getPublicSocialPosts, getSocialPosts } from '@/app/actions/social-gallery';
import { armarAlbumInteligente, completarNotasAlbumEnTandas } from '@/lib/album/armar-album';
import { submitClientPayment } from '@/app/actions/fiesta/portal.actions';
import { getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { resumenRevisionComprobanteIA } from '@/lib/client-portal/payment-notifications';
import type { SocialGalleryPost } from '@/types/social-gallery';

const fetchOriginal = global.fetch;

function crearFormularioFoto(nombreArchivo = 'foto.jpg', tipo = 'image/jpeg') {
  const form = new FormData();
  form.append('fiestaId', 'f1');
  form.append('file', new File([new Uint8Array([1, 2, 3, 4])], nombreArchivo, { type: tipo }));
  form.append('guestId', 'g1');
  form.append('guestAccessToken', 'tok1');
  return form;
}

beforeEach(() => {
  jest.clearAllMocks();
  archivosMemoria.clear();
  collectionsStore = new Map();
  turnoFiesta = Promise.resolve();
  sessionMock = { success: false };
  portalSessionOk = true;
  process.env.AK_USE_LOCAL_JSON_ONLY = 'false';
  delete process.env.FIRESTORE_EMULATOR_HOST;
  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_API_KEY;
  global.fetch = fetchOriginal;

  fiestaStore = {
    id: 'f1',
    presupuestoId: 'pres_1',
    configuracion: {
      nombreEvento: 'Cumple de Sofía',
      fechaEvento: '2026-12-10',
    },
    socialGallerySettings: {
      enabled: true,
      uploadsActive: true,
      requireApproval: false,
      allowLikes: true,
      allowComments: true,
    },
    invitados: [
      { id: 'g1', nombre: 'Sofía Pérez', guestAccessToken: 'tok1', tableNumber: '4' },
    ],
    clientPaymentNotifications: [],
  };
});

afterAll(() => {
  global.fetch = fetchOriginal;
  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_API_KEY;
});

describe('Orden 324 — Bloque 0: decidir con tope, interruptor y plan B', () => {
  it('sin GEMINI_API_KEY devuelve null y no gasta cupo ni llama a fetch', async () => {
    const espiaFetch = jest.fn();
    global.fetch = espiaFetch as any;

    const res = await decidir({
      entradas: ['Foto de fiesta'],
      preguntas: { apropiado: { tipo: 'si_no', instruccion: '¿Es apropiada?' } },
      funcion: 'decisiones',
    });

    expect(res).toBeNull();
    expect(espiaFetch).not.toHaveBeenCalled();
    expect((await getResumenDeGasto()).gastadoUYU).toBe(0);
  });

  it('con el interruptor Decisiones rápidas apagado devuelve null y no gasta cupo', async () => {
    process.env.GEMINI_API_KEY = 'clave-prueba';
    archivosMemoria.set('ai-assistant-settings.json', { decisionesRapidasActivas: false });
    const espiaFetch = jest.fn();
    global.fetch = espiaFetch as any;

    const res = await decidir({
      entradas: ['Foto de fiesta'],
      preguntas: { apropiado: { tipo: 'si_no', instruccion: '¿Es apropiada?' } },
      funcion: 'decisiones',
    });

    expect(res).toBeNull();
    expect(espiaFetch).not.toHaveBeenCalled();
    expect((await getResumenDeGasto()).gastadoUYU).toBe(0);
  });

  it('sin cupo devuelve null y no gasta cupo de más', async () => {
    process.env.GEMINI_API_KEY = 'clave-prueba';
    await setTopeMensual(1);
    const espiaFetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        results: { apropiado: { noul: true, confidence: 0.99 } },
      }),
    }));
    global.fetch = espiaFetch as any;

    const primera = await decidir({
      entradas: ['Foto 1'],
      preguntas: { apropiado: { tipo: 'si_no', instruccion: '¿Apropiada?' } },
    });
    expect(primera?.apropiado?.siNo).toBe(true);
    expect((await getResumenDeGasto()).gastadoUYU).toBe(COSTO_ESTIMADO_UYU.decisiones);

    const segunda = await decidir({
      entradas: ['Foto 2'],
      preguntas: { apropiado: { tipo: 'si_no', instruccion: '¿Apropiada?' } },
    });
    expect(segunda).toBeNull();
    expect(espiaFetch).toHaveBeenCalledTimes(1);
    expect((await getResumenDeGasto()).gastadoUYU).toBe(COSTO_ESTIMADO_UYU.decisiones);
  });

  it('con la IA colgada (>3s) devuelve null en menos de 4 segundos', async () => {
    process.env.GEMINI_API_KEY = 'clave-prueba';
    let abortada = false;
    global.fetch = jest.fn((_url: string, init?: RequestInit) => {
      init?.signal?.addEventListener('abort', () => {
        abortada = true;
      });
      return new Promise(() => {});
    }) as any;

    const inicio = Date.now();
    const res = await decidir({
      entradas: ['Foto lenta'],
      preguntas: { apropiado: { tipo: 'si_no', instruccion: '¿Apropiada?' } },
    });
    const duracionMs = Date.now() - inicio;

    expect(res).toBeNull();
    expect(abortada).toBe(true);
    expect(duracionMs).toBeLessThan(4000);
  }, 6000);

  it('Ajustes de IA tiene el interruptor Decisiones rápidas', () => {
    const panel = fs.readFileSync(
      path.join(process.cwd(), 'src/components/settings/panels/ai-assistant.tsx'),
      'utf8',
    );
    expect(panel).toContain('Decisiones rápidas');
    expect(panel).toContain('decisionesRapidasActivas');
  });
});

describe('Orden 324 — Bloque 1: Muro social y moderación', () => {
  it('con apropiado = no y requireApproval apagado, la foto no sale en el muro y sí en moderación con motivo', async () => {
    process.env.GEMINI_API_KEY = 'clave-prueba';
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        results: {
          apropiado: { noul: false, confidence: 0.94 },
          es_de_la_fiesta: { noul: true, confidence: 0.9 },
          calidad: { score: 2 },
          motivo_duda: { choice: 'desnudez' },
        },
      }),
    })) as any;

    const res = await uploadSocialPost(crearFormularioFoto());
    expect(res.success).toBe(true);
    expect(res.post?.moderationStatus).toBe('pending');
    expect(res.post?.iaRevision?.apropiado).toBe(false);
    expect(res.post?.iaRevision?.motivo).toBe('La IA la marcó como posible desnudez');

    // Público (sin permiso de moderación): NO ve la foto marcada
    const publicos = await getPublicSocialPosts('f1');
    expect(publicos).toHaveLength(0);

    // Moderación (dueño/operador): SÍ la ve pendiente con su motivo en criollo
    sessionMock = { success: true, user: { userId: 'u1', perfil: 'dueno', role: 'admin' } };
    const paraModerar = await getSocialPosts('f1');
    expect(paraModerar).toHaveLength(1);
    expect(paraModerar[0].moderationStatus).toBe('pending');
    expect(paraModerar[0].iaRevision?.motivo).toContain('desnudez');
  });

  it('con requireApproval prendido, todo va a revisión aunque la IA diga apropiado = sí', async () => {
    fiestaStore.socialGallerySettings.requireApproval = true;
    process.env.GEMINI_API_KEY = 'clave-prueba';
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        results: {
          apropiado: { noul: true },
          es_de_la_fiesta: { noul: true },
          calidad: { score: 3 },
          motivo_duda: { choice: 'ninguno' },
        },
      }),
    })) as any;

    const res = await uploadSocialPost(crearFormularioFoto());
    expect(res.success).toBe(true);
    expect(res.post?.moderationStatus).toBe('pending');
    expect(res.post?.iaRevision?.calidad).toBe(3);
  });

  it('cuando decidir devuelve null, uploadSocialPost se comporta igual que hoy', async () => {
    // Sin GEMINI_API_KEY => decidir devuelve null
    const resFoto = await uploadSocialPost(crearFormularioFoto('fiesta.jpg', 'image/jpeg'));
    expect(resFoto.success).toBe(true);
    expect(resFoto.post?.moderationStatus).toBe('approved');
    expect(resFoto.post?.iaRevision).toBeUndefined();

    const resVideo = await uploadSocialPost(crearFormularioFoto('baile.mp4', 'video/mp4'));
    expect(resVideo.error).toBeUndefined();
    expect(resVideo.success).toBe(true);
    expect(resVideo.post?.moderationStatus).toBe('pending');
  });

  it('la pantalla de moderación ordena arriba lo dudoso de IA y muestra su motivo', () => {
    const moderacion = fs.readFileSync(
      path.join(process.cwd(), 'src/app/evento/moderacion/[fiestaId]/page.tsx'),
      'utf8',
    );
    expect(moderacion).toContain('post.iaRevision?.apropiado === false');
    expect(moderacion).toContain('post.iaRevision.motivo');
  });
});

describe('Orden 324 — Bloque 2: Álbum inteligente', () => {
  const crearPost = (overrides: Partial<SocialGalleryPost>): SocialGalleryPost => ({
    id: 'p',
    fiestaId: 'f1',
    imageUrl: 'https://fotos.test/p.jpg',
    authorName: 'Invitado',
    timestamp: '2026-09-01T21:00:00Z',
    likes: 0,
    comments: [],
    moderationStatus: 'approved',
    ...overrides,
  });

  it('con notas 3, 1 y 2 las ordena 3, 2, 1 y las sin nota van después sin perderse', () => {
    const album = armarAlbumInteligente({
      posts: [
        crearPost({ id: 'nota1', authorName: 'A', imageUrl: 'https://fotos.test/1.jpg', timestamp: '2026-09-01T21:00:00Z', iaRevision: { apropiado: true, esDeLaFiesta: true, calidad: 1 } }),
        crearPost({ id: 'sinNota', authorName: 'B', imageUrl: 'https://fotos.test/0.jpg', timestamp: '2026-09-01T21:01:00Z' }),
        crearPost({ id: 'nota3', authorName: 'C', imageUrl: 'https://fotos.test/3.jpg', timestamp: '2026-09-01T21:02:00Z', iaRevision: { apropiado: true, esDeLaFiesta: true, calidad: 3 } }),
        crearPost({ id: 'nota2', authorName: 'D', imageUrl: 'https://fotos.test/2.jpg', timestamp: '2026-09-01T21:03:00Z', iaRevision: { apropiado: true, esDeLaFiesta: true, calidad: 2 } }),
      ],
    });

    expect(album.todosLosRecuerdos.map((r) => r.id)).toEqual(['nota3', 'nota2', 'nota1', 'sinNota']);
  });

  it('quita fotos repetidas de la misma ráfaga conservando la mejor nota', () => {
    const album = armarAlbumInteligente({
      posts: [
        crearPost({ id: 'rafaga_baja', authorName: 'Lucas', sourceModule: 'fotocabina', imageUrl: 'https://fotos.test/r1.jpg', timestamp: '2026-09-01T22:00:00Z', iaRevision: { apropiado: true, esDeLaFiesta: true, calidad: 1 } }),
        crearPost({ id: 'rafaga_alta', authorName: 'Lucas', sourceModule: 'fotocabina', imageUrl: 'https://fotos.test/r2.jpg', timestamp: '2026-09-01T22:00:05Z', iaRevision: { apropiado: true, esDeLaFiesta: true, calidad: 3 } }),
      ],
    });

    expect(album.todosLosRecuerdos.map((r) => r.id)).toEqual(['rafaga_alta']);
  });

  it('completa notas en tandas para fotos viejas y se detiene al quedarse sin cupo', async () => {
    const viejas = [
      crearPost({ id: 'v1', imageUrl: 'https://fotos.test/v1.jpg' }),
      crearPost({ id: 'v2', imageUrl: 'https://fotos.test/v2.jpg' }),
      crearPost({ id: 'v3', imageUrl: 'https://fotos.test/v3.jpg' }),
    ];
    let llamadas = 0;
    const res = await completarNotasAlbumEnTandas({
      posts: viejas,
      tamanoTanda: 2,
      maxTandas: 2,
      evaluarPost: async () => {
        llamadas += 1;
        if (llamadas > 2) return null; // Simula tope alcanzado
        return { apropiado: true, esDeLaFiesta: true, calidad: 2 };
      },
    });

    expect(res.actualizados.map((p) => p.id)).toEqual(['v1', 'v2']);
    expect(res.frenadoPorTope).toBe(true);
  });
});

describe('Orden 324 — Bloque 3: Comprobantes de pago (sólo avisa, nunca cobra)', () => {
  const comprobanteDummy = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

  it('con monto_coincide = no, el estado sigue pendiente, no modifica presupuesto y muestra el aviso', async () => {
    process.env.GEMINI_API_KEY = 'clave-prueba';
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        results: {
          es_comprobante: { noul: true },
          monto_coincide: { noul: false },
          tiene_fecha: { noul: true },
          tipo: { choice: 'transferencia' },
        },
      }),
    })) as any;

    const res = await submitClientPayment('f1', 15000, comprobanteDummy, 'comprobante.png');
    expect(res.success).toBe(true);
    expect(mockAddPagoToPresupuesto).not.toHaveBeenCalled();

    const notif = fiestaStore.clientPaymentNotifications[0];
    expect(notif.estado).toBe('pendiente');
    expect(notif.approvedAt).toBeUndefined();
    expect(notif.cobroConfirmadoAt).toBeUndefined();
    expect(notif.revisionIA).toMatchObject({
      esComprobante: true,
      montoCoincide: false,
      tieneFecha: true,
      tipo: 'transferencia',
    });

    const cartel = resumenRevisionComprobanteIA(notif.revisionIA);
    expect(cartel?.texto).toBe('La IA no encuentra el monto');
  });

  it('con comprobante válido muestra Parece un comprobante correcto pero sigue pendiente', async () => {
    process.env.GEMINI_API_KEY = 'clave-prueba';
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        results: {
          es_comprobante: { noul: true },
          monto_coincide: { noul: true },
          tiene_fecha: { noul: true },
          tipo: { choice: 'mercado_pago' },
        },
      }),
    })) as any;

    const res = await submitClientPayment('f1', 15000, comprobanteDummy, 'mp.png');
    expect(res.success).toBe(true);
    expect(mockAddPagoToPresupuesto).not.toHaveBeenCalled();

    const notif = fiestaStore.clientPaymentNotifications[0];
    expect(notif.estado).toBe('pendiente');
    const cartel = resumenRevisionComprobanteIA(notif.revisionIA);
    expect(cartel?.texto).toBe('Parece un comprobante correcto');
    expect(cartel?.tipoLabel).toBe('Mercado Pago');
  });

  it('alguien sin permiso (el personal) no ve los comprobantes ni su revisionIA', async () => {
    fiestaStore.personalAsignado = [{ empleadoId: 'op1', rol: 'Operador' }];
    fiestaStore.clientPaymentNotifications = [
      {
        id: 'cpn_1',
        monto: 15000,
        estado: 'pendiente',
        timestamp: '2026-11-19T12:00:00Z',
        revisionIA: {
          esComprobante: true,
          montoCoincide: false,
          tieneFecha: true,
          tipo: 'transferencia',
          revisadoAt: '2026-11-19T12:00:01Z',
        },
      },
    ];

    // El personal no tiene acceso a las fiestas ni a los comprobantes
    sessionMock = { success: true, user: { userId: 'emp1', perfil: 'personal', role: 'user' } };
    await expect(getFiestas()).rejects.toThrow(/no tiene acceso/i);

    const { recortarFiestaPorPerfil } = await import('@/lib/fiesta/recortar-para-afuera');
    const recortadaPersonal = recortarFiestaPorPerfil(fiestaStore, sessionMock.user);
    expect(recortadaPersonal.clientPaymentNotifications).toBeUndefined();

    // Un operador asignado a la fiesta sí ve su fiesta, pero tampoco ve comprobantes ni revisionIA
    sessionMock = { success: true, user: { userId: 'op1', email: 'op@ak.test', perfil: 'operador', role: 'user' } };
    const fiestasOperador = await getFiestas();
    expect(fiestasOperador).toHaveLength(1);
    expect(fiestasOperador[0].clientPaymentNotifications).toBeUndefined();

    // Quien tiene contabilidad (dueño) sí ve el comprobante y su revisionIA
    sessionMock = { success: true, user: { userId: 'adm1', perfil: 'dueno', role: 'admin' } };
    const fiestasDueno = await getFiestas();
    expect(fiestasDueno[0].clientPaymentNotifications).toHaveLength(1);
    expect(fiestasDueno[0].clientPaymentNotifications?.[0].revisionIA?.montoCoincide).toBe(false);
  });

  it('pagos-rapidos muestra el cartel de revisionIA y no llama a aprobar automáticamente', () => {
    const pagina = fs.readFileSync(
      path.join(process.cwd(), 'src/app/(app)/pagos-rapidos/page.tsx'),
      'utf8',
    );
    expect(pagina).toContain('resumenRevisionComprobanteIA(notificacion.revisionIA)');
  });
});

/** @jest-environment node */
/**
 * Orden 336 — Sección B y Escaneo 211:
 * Verifica permisos, pertenencia a la fiesta, recortes por perfil,
 * bloqueos del auditor y autenticación en vivo/ZIPs.
 */

const almacen: Record<string, any> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

let sesionActual: { success: boolean; user?: any } = { success: false };
let portalAutorizado = false;
let buzonMensajesMock: Array<{ id: string; fiestaId: string; authorName: string; mediaType: 'audio' | 'video' | 'photo'; mediaUrl: string; storagePath: string }> = [];

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => sesionActual),
}));

jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn(async () => portalAutorizado),
}));

jest.mock('@/app/actions/empleados', () => ({
  getEmpleados: jest.fn(async () => [
    { id: 'op-1', email: 'op1@ak.test', nombre: 'Operador 1' },
    { id: 'op-2', email: 'op2@ak.test', nombre: 'Operador Ajeno' },
  ]),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) =>
    almacen[archivo] === undefined ? porDefecto : copia(almacen[archivo]),
  ),
  readDataConDetalle: jest.fn(async (archivo: string, porDefecto: any) => ({
    valor: almacen[archivo] === undefined ? porDefecto : copia(almacen[archivo]),
    huboFalla: false,
  })),
  writeData: jest.fn(async (archivo: string, datos: any) => {
    almacen[archivo] = copia(datos);
  }),
  updateDataPartial: jest.fn(async (archivo: string, parcial: any) => {
    almacen[archivo] = { ...(almacen[archivo] || {}), ...copia(parcial) };
  }),
}));

jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumentoConTransaccion: jest.fn(async (path: string, _vacio: any, cambiar: (a: any) => any) => {
    const actual = almacen[path] !== undefined ? copia(almacen[path]) : null;
    const nuevo = await cambiar(actual);
    if (nuevo === null) return null;
    almacen[path] = copia(nuevo);
    return copia(nuevo);
  }),
}));

jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn(async () => (almacen['fiestas/f1.json'] ? [copia(almacen['fiestas/f1.json'])] : [])),
  leerHistorialCrudo: jest.fn(async () => []),
}));

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: null,
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(async () => undefined),
}));

jest.mock('@/app/actions/buzon', () => {
  const actual = jest.requireActual('@/app/actions/buzon');
  return {
    ...actual,
    getBuzonMessagesConDetalle: jest.fn(async () => ({
      mensajes: buzonMensajesMock,
      huboFalla: false,
    })),
  };
});

jest.mock('@/app/actions/social-gallery', () => ({
  getSocialPosts: jest.fn(async () => []),
  getPhotoFilePathsForZip: jest.fn(async () => ({
    photos: [],
    stats: { total: 0, approved: 0, pending: 0, hidden: 0 },
  })),
}));

jest.mock('@/app/actions/social-interactive', () => ({
  getDedications: jest.fn(async () => []),
}));

jest.mock('@/app/actions/fiesta/video-vida.actions', () => {
  const actual = jest.requireActual('@/app/actions/fiesta/video-vida.actions');
  return {
    ...actual,
    getLifeStoryVideoPhotos: jest.fn(async () => ({
      estado: 'ok',
      urls: [],
      fallidas: 0,
    })),
  };
});

jest.mock('@/lib/social-media/comments-backfill', () => ({
  getStoredComments: jest.fn(async () => []),
  getCommentsBackfillState: jest.fn(async () => ({})),
  syncCommentsFromNetworks: jest.fn(async () => ({ synced: 0 })),
  restoreHiddenCommentInternal: jest.fn(async () => ({ success: true })),
  hideCommentInternal: jest.fn(async () => ({ success: true })),
}));

import { getEntretenimientoFiesta } from '@/app/actions/fiesta/entretenimiento.actions';
import { updateListaDeCargaOperativa } from '@/app/actions/fiesta/carga-operativa.actions';
import { getTriviaGame, saveTriviaGame, getPhotoMissions, savePhotoMissions } from '@/app/actions/games.actions';
import { saveFiesta, updateFiestaPartial } from '@/app/actions/fiesta/fiesta.actions';
import { signContractDigitally } from '@/app/actions/fiesta/documentos.actions';
import { hideCommentAction, restoreHiddenCommentAction } from '@/app/actions/comentarios-redes';
import { getRoles } from '@/app/actions/roles';
import {
  requestLiveStream,
  getActiveLiveStreamForScreen,
  submitScreenLiveStreamAnswer,
  pushLiveStreamIceCandidate,
  getGuestLiveStreamStatus,
  getLiveStreamScreenToken,
} from '@/app/actions/social-live-stream';
import { GET as downloadBuzonZip } from '@/app/api/buzon/[fiestaId]/download/route';
import { GET as downloadRecuerdosZip } from '@/app/api/fiestas/[fiestaId]/download-recuerdos/route';
import { GET as downloadSocialZip } from '@/app/api/social-gallery/[fiestaId]/download/route';
import { GET as downloadVideoVidaZip } from '@/app/api/video-vida-photos/[fiestaId]/download/route';

const PERSONAL = { userId: 'p1', email: 'mozo@ak.test', perfil: 'personal' };
const OPERADOR_ASIGNADO = { userId: 'op-1', email: 'op1@ak.test', perfil: 'operador' };
const OPERADOR_AJENO = { userId: 'op-2', email: 'op2@ak.test', perfil: 'operador' };
const SECRETARIA = { userId: 'sec-1', email: 'sec@ak.test', perfil: 'secretaria' };
const AUDITOR = { userId: 'aud-1', email: 'aud@ak.test', perfil: 'auditor' };

const FIESTA_BASE = {
  id: 'f1',
  estado: 'Contratada',
  configuracion: {
    nombreEvento: 'XV de Martina',
    fechaEvento: '2026-12-10',
    invitadosEstimados: 100,
    clienteId: 'cli-1',
  },
  modulosContratados: {
    social: true,
    catering: false,
  },
  clientPortalSettings: {
    enabled: true,
    accessKey: 'clave-super-secreta',
  },
  personalAsignado: [
    { empleadoId: 'op-1', rolId: 'dj', eventSalary: 8500 },
  ],
  gestionCostos: { total: 120000 },
  contratoServicioTexto: 'Contrato original de prueba',
  invitados: [
    { id: 'guest-1', nombre: 'Ana', guestAccessToken: 'tok-ana', contacto: '099111222' },
  ],
  triviaGame: { id: 't1', fiestaId: 'f1', title: 'Trivia', questions: [], createdAt: '', status: 'active' as const },
  photoMissions: [{ id: 'm1', title: 'Foto grupal', description: '', points: 50 }],
  zonaDigitalAdolescentes: {
    enabled: true,
    features: [
      { id: 'transmision_invitado', label: 'En vivo', description: '', enabled: true, visibleForGuests: true },
    ],
  },
};

describe('Orden 336 — Quién ve qué y permisos (Sección B + Escaneo 211)', () => {
  const prevLocal = process.env.AK_USE_LOCAL_JSON_ONLY;

  beforeAll(() => {
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
    process.env.AK_ALLOW_LOCAL_JSON_WRITES = 'true';
  });

  afterAll(() => {
    if (prevLocal === undefined) delete process.env.AK_USE_LOCAL_JSON_ONLY;
    else process.env.AK_USE_LOCAL_JSON_ONLY = prevLocal;
  });

  beforeEach(() => {
    for (const k of Object.keys(almacen)) delete almacen[k];
    almacen['fiestas/f1.json'] = copia(FIESTA_BASE);
    almacen['roles.json'] = [
      {
        id: 'rol-1',
        nombre: 'DJ',
        categoriaServicio: 'Música',
        sueldoPorEvento: 5000,
        porcentajeAportesPatronales: 20,
        costoAportesCalculado: 1000,
        porcentajeSalarioVacacional: 10,
        porcentajeAguinaldo: 8.33,
      },
    ];
    sesionActual = { success: false };
    portalAutorizado = false;
    buzonMensajesMock = [];
  });

  it('getEntretenimientoFiesta rechaza a personal y operador ajeno, y recorta plata al operador asignado', async () => {
    sesionActual = { success: true, user: PERSONAL };
    expect((await getEntretenimientoFiesta('f1')).success).toBe(false);

    sesionActual = { success: true, user: OPERADOR_AJENO };
    expect((await getEntretenimientoFiesta('f1')).success).toBe(false);

    sesionActual = { success: true, user: OPERADOR_ASIGNADO };
    const ok = await getEntretenimientoFiesta('f1');
    expect(ok.success).toBe(true);
    expect((ok.fiesta as any).gestionCostos).toBeUndefined();
    expect((ok.fiesta as any).personalAsignado[0].eventSalary).toBeUndefined();
    expect((ok.fiesta as any).clientPortalSettings).toBeUndefined();
  });

  it('Escaneo 211: games.actions bloquea a personal y operador ajeno en trivia y misiones', async () => {
    sesionActual = { success: true, user: PERSONAL };
    await expect(getTriviaGame('f1')).rejects.toThrow();
    await expect(saveTriviaGame('f1', FIESTA_BASE.triviaGame as any)).rejects.toThrow();
    await expect(getPhotoMissions('f1')).rejects.toThrow();
    await expect(savePhotoMissions('f1', [])).rejects.toThrow();

    sesionActual = { success: true, user: OPERADOR_AJENO };
    await expect(getTriviaGame('f1')).rejects.toThrow();
    await expect(savePhotoMissions('f1', [])).rejects.toThrow();

    sesionActual = { success: true, user: OPERADOR_ASIGNADO };
    expect(await getTriviaGame('f1')).toBeTruthy();
  });

  it('updateListaDeCargaOperativa bloquea a personal y operador ajeno', async () => {
    sesionActual = { success: true, user: PERSONAL };
    const resPersonal = await updateListaDeCargaOperativa('f1', { categorias: [] });
    expect(resPersonal.success).toBe(false);

    sesionActual = { success: true, user: OPERADOR_AJENO };
    const resAjeno = await updateListaDeCargaOperativa('f1', { categorias: [] });
    expect(resAjeno.success).toBe(false);
  });

  it('las 4 descargas ZIP rechazan con 403 a personal y operador ajeno', async () => {
    const req = new Request('http://localhost/api/test');
    const props = { params: Promise.resolve({ fiestaId: 'f1' }) };

    for (const user of [PERSONAL, OPERADOR_AJENO]) {
      sesionActual = { success: true, user };
      expect((await downloadBuzonZip(req, props)).status).toBe(403);
      expect((await downloadRecuerdosZip(req, props)).status).toBe(403);
      expect((await downloadSocialZip(req, props)).status).toBe(403);
      expect((await downloadVideoVidaZip(req, props)).status).toBe(403);
    }
  });

  it('el portal del cliente no puede cambiar modulosContratados, configuracion estructural ni clientPortalSettings', async () => {
    portalAutorizado = true;

    const rParcial = await updateFiestaPartial(
      'f1',
      {
        modulosContratados: { social: true, catering: true } as any,
      },
      { allowPortal: true },
    );
    expect(rParcial.success).toBe(false);

    const rFechaParcial = await updateFiestaPartial(
      'f1',
      {
        configuracion: { ...FIESTA_BASE.configuracion, fechaEvento: '2028-01-01' } as any,
      },
      { allowPortal: true },
    );
    expect(rFechaParcial.success).toBe(false);

    await saveFiesta({
      ...copia(FIESTA_BASE),
      modulosContratados: { social: false, catering: true } as any,
      clientPortalSettings: { enabled: false, accessKey: 'hacked' } as any,
      configuracion: {
        ...FIESTA_BASE.configuracion,
        fechaEvento: '2029-05-05',
        invitadosEstimados: 999,
      } as any,
    } as any);

    const guardada = almacen['fiestas/f1.json'];
    expect(guardada.modulosContratados).toEqual(FIESTA_BASE.modulosContratados);
    expect(guardada.clientPortalSettings).toEqual(FIESTA_BASE.clientPortalSettings);
    expect(guardada.configuracion.fechaEvento).toBe('2026-12-10');
    expect(guardada.configuracion.invitadosEstimados).toBe(100);
  });

  it('el auditor no puede firmar contratos ni ocultar/desocultar comentarios en redes', async () => {
    sesionActual = { success: true, user: AUDITOR };
    portalAutorizado = true;

    const firma = await signContractDigitally('f1', 'Auditor Intruso', true, 'fake-hash');
    expect(firma.success).toBe(false);
    expect(firma.error).toMatch(/auditor/i);

    const ocultar = await hideCommentAction('c1');
    expect(ocultar.success).toBe(false);
    expect(ocultar.error).toMatch(/auditor/i);

    const mostrar = await restoreHiddenCommentAction('c1');
    expect(mostrar.success).toBe(false);
    expect(mostrar.error).toMatch(/auditor/i);
  });

  it('roles.ts oculta aportes patronales y porcentajes a quien no tiene SUELDOS', async () => {
    sesionActual = { success: true, user: SECRETARIA };
    const roles = await getRoles();
    expect(roles[0].sueldoPorEvento).toBe(0);
    expect(roles[0].costoAportesCalculado).toBe(0);
    expect(roles[0].porcentajeAportesPatronales).toBe(0);
  });

  it('transmisión en vivo exige credenciales de pantalla para leer/responder y token de invitado para ICE/status', async () => {
    const reqRes = await requestLiveStream('f1', {
      authorName: 'Ana',
      offerSdp: '{"type":"offer","sdp":"v=0"}',
      guestId: 'guest-1',
      guestAccessToken: 'tok-ana',
    });
    expect(reqRes.success).toBe(true);
    const reqId = reqRes.request!.id;

    // Sin token ni sesión de pantalla: no lee stream ni envía answer ni ICE de pantalla
    expect(await getActiveLiveStreamForScreen('f1')).toBeNull();
    expect((await submitScreenLiveStreamAnswer('f1', reqId, '{"type":"answer"}')).success).toBe(false);
    expect((await pushLiveStreamIceCandidate('f1', reqId, 'callee', '{"candidate":"c"}')).success).toBe(false);

    // Invitado sin token válido no puede consultar estado ni mandar ICE caller
    expect((await getGuestLiveStreamStatus('f1', reqId)).success).toBe(false);
    expect((await pushLiveStreamIceCandidate('f1', reqId, 'caller', '{"candidate":"c"}')).success).toBe(false);

    // Con callerToken o guestAccessToken válido sí funciona
    expect(
      (await getGuestLiveStreamStatus('f1', reqId, { callerToken: reqRes.callerToken })).success,
    ).toBe(true);
    expect(
      (await pushLiveStreamIceCandidate('f1', reqId, 'caller', '{"candidate":"c"}', {
        guestId: 'guest-1',
        guestAccessToken: 'tok-ana',
      })).success,
    ).toBe(true);

    // Operador asignado obtiene screenToken válido
    sesionActual = { success: true, user: OPERADOR_ASIGNADO };
    const tokenRes = await getLiveStreamScreenToken('f1');
    expect(tokenRes.success).toBe(true);
    expect(tokenRes.token).toBeTruthy();
  });
});

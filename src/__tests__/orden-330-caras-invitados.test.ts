import fs from 'node:fs';
import path from 'node:path';

jest.mock('@/lib/firebase/modo-local', () => ({
  sinBaseDisponible: jest.fn(() => true),
  sinDepositoDisponible: jest.fn(() => true),
}));

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: null,
}));

jest.mock('firebase-admin', () => ({
  __esModule: true,
  default: { firestore: { FieldValue: { serverTimestamp: jest.fn(), increment: jest.fn(), arrayUnion: jest.fn() } } },
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn(),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(),
  saveFiesta: jest.fn(),
}));

jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({
  getFiestaByIdRaw: jest.fn(),
}));

jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(),
}));

jest.mock('@/lib/auth/require-session', () => ({
  hasAppSession: jest.fn(),
  requireAppSession: jest.fn(),
  requirePermiso: jest.fn(),
}));

jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: jest.fn(),
}));

jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn(),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/auth/entertainment-token', () => ({
  verifyEntertainmentAccessToken: jest.fn(),
}));

jest.mock('@/lib/firebase/server-messaging', () => ({
  sendNotificationToTargets: jest.fn(),
}));

jest.mock('@/lib/whatsapp/meta-sender', () => ({
  sendMetaWhatsAppMessage: jest.fn(),
}));

jest.mock('@/app/actions/whatsapp', () => ({
  getWhatsAppConfig: jest.fn(),
}));

jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: jest.fn(),
  deleteFromStorage: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

import {
  asignarNombreCaraDesdePortal,
  borrarCaraInvitado,
  buscarInvitadoPorNombreExactoParaCara,
  deleteSocialPost,
  getCarasDeFiesta,
  guardarCarasDeFiesta,
  importarFotosFotografoConCaras,
  moderateSocialPost,
  obtenerMisFotosInvitado,
  obtenerPersonasParaPortalCliente,
  registrarCaraInvitado,
} from '@/app/actions/social-gallery';
import {
  buscarFotosDeUnaCara,
  DISTANCIA_DUDOSA,
  DISTANCIA_SEGURA,
} from '@/lib/caras/agrupar-caras';
import { filtrarPostsPorMomento, normalizarMomentoPost } from '@/lib/caras/momentos-galeria';
import { calcularEstimadoMensajesFotosWhatsapp } from '@/lib/caras/whatsapp-fotos';
import { toPublicSocialEvent } from '@/lib/social-fiesta/public-event';
import { mapFiestaToClientPortal } from '@/lib/client-portal/public-fiesta';
import { buildPublicGuestPortalData } from '@/lib/guest-portal-public-data';
import { readData, writeData } from '@/lib/data-service';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getFiestaByIdRaw } from '@/lib/fiesta/get-fiesta-raw';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import { hasAppSession, requireAppSession } from '@/lib/auth/require-session';
import { requireEventPermission } from '@/lib/auth/event-access';
import { verifyPortalSession } from '@/lib/security/portal-session';
import { verifyEntertainmentAccessToken } from '@/lib/auth/entertainment-token';
import { sendNotificationToTargets } from '@/lib/firebase/server-messaging';
import { sendMetaWhatsAppMessage } from '@/lib/whatsapp/meta-sender';
import { getWhatsAppConfig } from '@/app/actions/whatsapp';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { SocialGalleryPost } from '@/types/social-gallery';

const mockReadData = readData as jest.MockedFunction<typeof readData>;
const mockWriteData = writeData as jest.MockedFunction<typeof writeData>;
const mockGetFiestaById = getFiestaById as jest.MockedFunction<typeof getFiestaById>;
const mockGetFiestaByIdRaw = getFiestaByIdRaw as jest.MockedFunction<typeof getFiestaByIdRaw>;
const mockActualizarFiesta = actualizarFiesta as jest.MockedFunction<typeof actualizarFiesta>;
const mockHasAppSession = hasAppSession as jest.MockedFunction<typeof hasAppSession>;
const mockRequireAppSession = requireAppSession as jest.MockedFunction<typeof requireAppSession>;
const mockRequireEventPermission = requireEventPermission as jest.MockedFunction<typeof requireEventPermission>;
const mockVerifyPortalSession = verifyPortalSession as jest.MockedFunction<typeof verifyPortalSession>;
const mockVerifyEntertainmentToken = verifyEntertainmentAccessToken as jest.MockedFunction<typeof verifyEntertainmentAccessToken>;
const mockSendNotificationToTargets = sendNotificationToTargets as jest.MockedFunction<typeof sendNotificationToTargets>;
const mockSendMetaWhatsAppMessage = sendMetaWhatsAppMessage as jest.MockedFunction<typeof sendMetaWhatsAppMessage>;
const mockGetWhatsAppConfig = getWhatsAppConfig as jest.MockedFunction<typeof getWhatsAppConfig>;

function clonar<T>(val: T): T {
  return val === undefined ? val : JSON.parse(JSON.stringify(val));
}

function vectorDeCara(coordenadaDelta = 0, indiceInicio = 0): number[] {
  const vec = new Array(128).fill(0);
  for (let i = 0; i < 4; i++) {
    vec[indiceInicio + i] = coordenadaDelta;
  }
  return vec;
}

describe('Orden 330 — Cada invitado encuentra sus fotos solo, incluidas las del fotógrafo', () => {
  let jsonStore: Record<string, any>;
  let fiestaStore: Record<string, FiestaEnPlanificacion>;

  const FIESTA_ID = 'fiesta-330';
  const FECHA_EVENTO = '2026-10-10T22:00:00.000Z';
  const AHORA_FIESTA_MS = Date.parse('2026-10-11T01:00:00.000Z');
  const TOKEN_ANA = 'tok_ana_1234567890';
  const TOKEN_LUIS = 'tok_luis_1234567890';

  function crearFiestaBase(overrides: Partial<FiestaEnPlanificacion> = {}): FiestaEnPlanificacion {
    return {
      id: FIESTA_ID,
      configuracion: {
        nombreEvento: 'Cumple de Sofía',
        fechaEvento: FECHA_EVENTO,
        clienteNombre: 'Familia Demo',
        tipoEvento: '15 años',
      } as any,
      invitados: [
        {
          id: 'inv-ana',
          nombre: 'Ana Silva',
          rsvp: 'Confirmado',
          contacto: '099111222',
          guestAccessToken: TOKEN_ANA,
        } as any,
        {
          id: 'inv-luis',
          nombre: 'Luis Pérez',
          rsvp: 'Confirmado',
          contacto: '099333444',
          guestAccessToken: TOKEN_LUIS,
        } as any,
        {
          id: 'inv-marta',
          nombre: 'Marta Gómez',
          rsvp: 'Confirmado',
          contacto: '099555666',
          guestAccessToken: 'tok_marta_123456',
        } as any,
      ],
      clientPortalSettings: {
        enabled: true,
        accessKey: 'clave-portal-330',
      } as any,
      socialGallerySettings: {
        enabled: true,
        allowLikes: true,
        allowComments: true,
        uploadsActive: true,
        whatsappFotosInvitadosActivo: false,
      },
      ...overrides,
    } as FiestaEnPlanificacion;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    jsonStore = {};
    fiestaStore = {
      [FIESTA_ID]: crearFiestaBase(),
      'otra-fiesta': crearFiestaBase({
        id: 'otra-fiesta',
        invitados: [
          {
            id: 'inv-ajeno',
            nombre: 'Invitado de Otra Fiesta',
            rsvp: 'Confirmado',
            guestAccessToken: 'tok_ajeno_123',
          } as any,
        ],
      }),
    };

    mockReadData.mockImplementation(async (file: string, defaultVal: any) => {
      if (Object.prototype.hasOwnProperty.call(jsonStore, file)) {
        return clonar(jsonStore[file]);
      }
      return clonar(defaultVal);
    });
    mockWriteData.mockImplementation(async (file: string, data: any) => {
      jsonStore[file] = clonar(data);
    });

    mockGetFiestaById.mockImplementation(async (id: string) => {
      return fiestaStore[id] ? clonar(fiestaStore[id]) : null;
    });
    mockGetFiestaByIdRaw.mockImplementation(async (id: string) => {
      return fiestaStore[id] ? clonar(fiestaStore[id]) : null;
    });
    mockActualizarFiesta.mockImplementation(async (id: string, fn: (actual: FiestaEnPlanificacion) => FiestaEnPlanificacion) => {
      const actual = fiestaStore[id];
      if (!actual) return { success: false, error: 'Fiesta no encontrada' } as any;
      const updated = fn(clonar(actual));
      fiestaStore[id] = clonar(updated);
      return { success: true, fiesta: updated } as any;
    });

    mockHasAppSession.mockResolvedValue(true);
    mockRequireAppSession.mockResolvedValue({ userId: 'staff-1', role: 'admin' } as any);
    mockRequireEventPermission.mockImplementation(async (id: string) => fiestaStore[id]);
    mockVerifyPortalSession.mockResolvedValue(true);
    mockVerifyEntertainmentToken.mockReturnValue(true);
    mockSendNotificationToTargets.mockResolvedValue({ success: true, sentCount: 1 });
    mockSendMetaWhatsAppMessage.mockResolvedValue({ success: true, messageId: 'wamid-1' });
    mockGetWhatsAppConfig.mockResolvedValue({
      enabled: true,
      apiKey: 'meta-token',
      phoneNumberId: 'phone-id-1',
    } as any);
  });

  describe('Bloque 1: índice automático al aprobar y borrado al ocultar o eliminar', () => {
    it('mantiene el botón opcional "Volver a armar" en PrepararGrillaDeCara.tsx', () => {
      const src = fs.readFileSync(
        path.join(process.cwd(), 'src/components/social-gallery/PrepararGrillaDeCara.tsx'),
        'utf8',
      );
      expect(src).toContain('Volver a armar');
    });

    it('agrega caras de una foto nueva de forma incremental sin borrar caras de otras fotos ni requerir grilla manual', async () => {
      mockHasAppSession.mockResolvedValue(false);
      jsonStore['social-gallery/metadata.json'] = [
        {
          id: 'post-1',
          fiestaId: FIESTA_ID,
          imageUrl: 'https://cdn.test/p1.jpg',
          mediaType: 'image',
          moderationStatus: 'approved',
          timestamp: '2026-10-11T00:00:00.000Z',
          authorName: 'Ana',
          likes: 0,
          comments: [],
        },
        {
          id: 'post-2',
          fiestaId: FIESTA_ID,
          imageUrl: 'https://cdn.test/p2.jpg',
          mediaType: 'image',
          moderationStatus: 'approved',
          timestamp: '2026-10-11T00:05:00.000Z',
          authorName: 'Luis',
          likes: 0,
          comments: [],
        },
      ] satisfies SocialGalleryPost[];

      const r1 = await guardarCarasDeFiesta(
        FIESTA_ID,
        [{ fotoId: 'post-1', vector: vectorDeCara(0, 0) }],
        { incremental: true, guestId: 'inv-ana', guestAccessToken: TOKEN_ANA, ahoraMs: AHORA_FIESTA_MS },
      );
      expect(r1.ok).toBe(true);

      const r2 = await guardarCarasDeFiesta(
        FIESTA_ID,
        [{ fotoId: 'post-2', vector: vectorDeCara(1, 20) }],
        { incremental: true, stationModuleId: 'espejoMagicoFoto', stationAccessToken: 'tok-est', ahoraMs: AHORA_FIESTA_MS },
      );
      expect(r2.ok).toBe(true);

      const caras = await getCarasDeFiesta(FIESTA_ID);
      expect(caras.map((c) => c.fotoId).sort()).toEqual(['post-1', 'post-2']);
    });

    it('al ocultar o eliminar una foto, saca sus caras del índice inmediatamente', async () => {
      jsonStore['social-gallery/metadata.json'] = [
        {
          id: 'post-hide',
          fiestaId: FIESTA_ID,
          imageUrl: 'https://cdn.test/hide.jpg',
          mediaType: 'image',
          moderationStatus: 'approved',
          timestamp: '2026-10-11T00:00:00.000Z',
          authorName: 'Ana',
          likes: 0,
          comments: [],
        },
        {
          id: 'post-del',
          fiestaId: FIESTA_ID,
          imageUrl: 'https://cdn.test/del.jpg',
          mediaType: 'image',
          moderationStatus: 'approved',
          timestamp: '2026-10-11T00:01:00.000Z',
          authorName: 'Luis',
          likes: 0,
          comments: [],
        },
      ] satisfies SocialGalleryPost[];

      await guardarCarasDeFiesta(FIESTA_ID, [
        { fotoId: 'post-hide', vector: vectorDeCara(0, 0) },
        { fotoId: 'post-del', vector: vectorDeCara(1, 10) },
      ]);

      const modRes = await moderateSocialPost('post-hide', 'hidden');
      expect(modRes.success).toBe(true);
      expect(fiestaStore[FIESTA_ID].carasIndexadas?.some((c) => c.fotoId === 'post-hide')).toBe(false);
      expect((await getCarasDeFiesta(FIESTA_ID)).map((c) => c.fotoId)).toEqual(['post-del']);

      const delRes = await deleteSocialPost('post-del');
      expect(delRes.success).toBe(true);
      expect(fiestaStore[FIESTA_ID].carasIndexadas).toEqual([]);
      expect(await getCarasDeFiesta(FIESTA_ID)).toEqual([]);
    });
  });

  describe('Bloque 2 y 3: fotógrafo con Wfolio, push por tanda, distancias, privacidad y 90 días', () => {
    it('conserva los umbrales originales de buscarFotosDeUnaCara (0.5 segura / 0.62 dudosa)', () => {
      expect(DISTANCIA_SEGURA).toBe(0.5);
      expect(DISTANCIA_DUDOSA).toBe(0.62);
      const base = vectorDeCara(0, 0);
      const caras = [
        { fotoId: 'cerca', vector: vectorDeCara(0.2, 0) }, // dist = 0.4
        { fotoId: 'duda', vector: vectorDeCara(0.28, 0) }, // dist = 0.56
        { fotoId: 'lejos', vector: vectorDeCara(0.35, 0) }, // dist = 0.7
      ];
      const res = buscarFotosDeUnaCara([base], caras);
      expect(res.seguras).toEqual(['cerca']);
      expect(res.dudosas).toEqual(['duda']);
    });

    it('envía 1 solo push por tanda al entrar varias fotos del fotógrafo a distancia 0.4 y no avisa a distancia 0.7', async () => {
      const reg = await registrarCaraInvitado({
        fiestaId: FIESTA_ID,
        guestId: 'inv-ana',
        guestAccessToken: TOKEN_ANA,
        vector: vectorDeCara(0, 0),
        ahoraMs: AHORA_FIESTA_MS,
      });
      expect(reg).toEqual({ success: true, tieneCaraRegistrada: true });

      const imp = await importarFotosFotografoConCaras(
        FIESTA_ID,
        [
          {
            id: 'fg-1',
            imageUrl: 'https://wfolio.test/1.jpg',
            wfolioUrl: 'https://wfolio.test/gallery#1',
            momentTag: 'torta',
            descriptors: [vectorDeCara(0.2, 0)], // dist 0.4 -> match
          },
          {
            id: 'fg-2',
            imageUrl: 'https://wfolio.test/2.jpg',
            wfolioUrl: 'https://wfolio.test/gallery#2',
            momentTag: 'fiesta',
            descriptors: [vectorDeCara(0.2, 0)], // dist 0.4 -> match
          },
          {
            id: 'fg-3',
            imageUrl: 'https://wfolio.test/3.jpg',
            wfolioUrl: 'https://wfolio.test/gallery#3',
            momentTag: 'vals',
            descriptors: [vectorDeCara(0.35, 0)], // dist 0.7 -> NO match
          },
        ],
        { ahoraMs: AHORA_FIESTA_MS },
      );

      expect(imp.success).toBe(true);
      expect(imp.importedCount).toBe(3);
      expect(imp.pushEnviados).toBe(1);
      expect(mockSendNotificationToTargets).toHaveBeenCalledTimes(1);
      expect(mockSendNotificationToTargets.mock.calls[0][1].body).toContain('Aparecés en 2 fotos nuevas');

      const misFotos = await obtenerMisFotosInvitado(FIESTA_ID, 'inv-ana', TOKEN_ANA, {
        ahoraMs: AHORA_FIESTA_MS,
      });
      expect(misFotos.success).toBe(true);
      expect(misFotos.fotos.map((f) => f.id)).toEqual(['fg-1', 'fg-2']);
      expect(misFotos.fotos[0].wfolioUrl).toBe('https://wfolio.test/gallery#1');
    });

    it('nunca expone vectores faciales de invitados en lecturas públicas ni del portal cliente', async () => {
      const vectorSecreto = vectorDeCara(0.42, 4);
      await registrarCaraInvitado({
        fiestaId: FIESTA_ID,
        guestId: 'inv-ana',
        guestAccessToken: TOKEN_ANA,
        vector: vectorSecreto,
        ahoraMs: AHORA_FIESTA_MS,
      });

      const fiesta = fiestaStore[FIESTA_ID];
      const publicSocial = toPublicSocialEvent(fiesta);
      const clientPortal = mapFiestaToClientPortal(fiesta);
      const guestPortalOther = buildPublicGuestPortalData(fiesta, 'inv-luis', TOKEN_LUIS);
      const misFotos = await obtenerMisFotosInvitado(FIESTA_ID, 'inv-luis', TOKEN_LUIS, {
        ahoraMs: AHORA_FIESTA_MS,
      });
      const personasPortal = await obtenerPersonasParaPortalCliente(FIESTA_ID, 'clave-portal-330');

      const serializado = JSON.stringify({
        publicSocial,
        clientPortal,
        guestPortalOther,
        misFotos,
        personasPortal,
      });
      expect(serializado).not.toContain('vectoresCarasInvitados');
      expect(serializado).not.toContain('0.42');
    });

    it('a los 91 días (> 90 días desde la fiesta) vence, borra los vectores y no devuelve coincidencias ni avisa', async () => {
      await registrarCaraInvitado({
        fiestaId: FIESTA_ID,
        guestId: 'inv-ana',
        guestAccessToken: TOKEN_ANA,
        vector: vectorDeCara(0, 0),
        ahoraMs: AHORA_FIESTA_MS,
      });
      expect(fiestaStore[FIESTA_ID].vectoresCarasInvitados?.['inv-ana']).toBeDefined();

      const dia91Ms = Date.parse(FECHA_EVENTO) + 91 * 24 * 60 * 60 * 1000;

      const impTarde = await importarFotosFotografoConCaras(
        FIESTA_ID,
        [
          {
            id: 'fg-91',
            imageUrl: 'https://wfolio.test/91.jpg',
            descriptors: [vectorDeCara(0.2, 0)],
          },
        ],
        { ahoraMs: dia91Ms },
      );

      expect(impTarde.pushEnviados).toBe(0);
      expect(mockSendNotificationToTargets).not.toHaveBeenCalled();
      expect(fiestaStore[FIESTA_ID].vectoresCarasInvitados).toEqual({});

      const misFotos91 = await obtenerMisFotosInvitado(FIESTA_ID, 'inv-ana', TOKEN_ANA, {
        ahoraMs: dia91Ms,
      });
      expect(misFotos91.expirado).toBe(true);
      expect(misFotos91.tieneCaraRegistrada).toBe(false);
      expect(misFotos91.fotos).toEqual([]);
    });

    it('permite borrar la propia cara con "Borrar mi cara"', async () => {
      await registrarCaraInvitado({
        fiestaId: FIESTA_ID,
        guestId: 'inv-ana',
        guestAccessToken: TOKEN_ANA,
        vector: vectorDeCara(0, 0),
        ahoraMs: AHORA_FIESTA_MS,
      });
      const del = await borrarCaraInvitado({
        fiestaId: FIESTA_ID,
        guestId: 'inv-ana',
        guestAccessToken: TOKEN_ANA,
      });
      expect(del).toEqual({ success: true, tieneCaraRegistrada: false });
      expect(fiestaStore[FIESTA_ID].vectoresCarasInvitados?.['inv-ana']).toBeUndefined();
    });
  });

  describe('Bloque 4: filtros de momento de la fiesta', () => {
    it('filtra por momento Torta y asigna Fiesta por defecto cuando no tiene momentTag', () => {
      expect(normalizarMomentoPost(undefined)).toBe('Fiesta');
      expect(normalizarMomentoPost('corte de torta')).toBe('Torta');
      const posts = [
        { id: '1', momentTag: 'Torta' },
        { id: '2' },
        { id: '3', momentTag: 'Vals' },
      ];
      expect(filtrarPostsPorMomento(posts, 'Torta').map((p) => p.id)).toEqual(['1']);
      expect(filtrarPostsPorMomento(posts, 'Fiesta').map((p) => p.id)).toEqual(['2']);
      expect(filtrarPostsPorMomento(posts, 'Todos')).toHaveLength(3);
    });
  });

  describe('Bloque 7: nombrar caras desde portal cliente y coincidencia exacta de invitado', () => {
    it('permite asignar y deshacer un invitado de esa fiesta desde el portal, y rechaza invitados de otra fiesta', async () => {
      jsonStore['social-gallery/metadata.json'] = [
        {
          id: 'foto-portal-1',
          fiestaId: FIESTA_ID,
          imageUrl: 'https://cdn.test/fp1.jpg',
          mediaType: 'image',
          moderationStatus: 'approved',
          timestamp: '2026-10-11T00:10:00.000Z',
          authorName: 'Muro',
          likes: 0,
          comments: [],
        },
      ] satisfies SocialGalleryPost[];

      await guardarCarasDeFiesta(
        FIESTA_ID,
        [{ fotoId: 'foto-portal-1', vector: vectorDeCara(0.9, 30) }],
        { skipNotifications: true },
      );

      const rechazo = await asignarNombreCaraDesdePortal({
        fiestaId: FIESTA_ID,
        accessKey: 'clave-portal-330',
        personaId: 'persona-1',
        representativeFotoId: 'foto-portal-1',
        invitadoId: 'inv-ajeno',
        ahoraMs: AHORA_FIESTA_MS,
      });
      expect(rechazo.success).toBe(false);
      expect(rechazo.error).toContain('no pertenece');

      const ok = await asignarNombreCaraDesdePortal({
        fiestaId: FIESTA_ID,
        accessKey: 'clave-portal-330',
        personaId: 'persona-1',
        representativeFotoId: 'foto-portal-1',
        invitadoId: 'inv-luis',
        ahoraMs: AHORA_FIESTA_MS,
      });
      expect(ok).toEqual({ success: true, invitadoId: 'inv-luis', nombre: 'Luis Pérez' });
      expect(mockSendNotificationToTargets).toHaveBeenCalledTimes(1);

      const misFotosLuis = await obtenerMisFotosInvitado(FIESTA_ID, 'inv-luis', TOKEN_LUIS, {
        ahoraMs: AHORA_FIESTA_MS,
      });
      expect(misFotosLuis.fotos.map((f) => f.id)).toEqual(['foto-portal-1']);

      const deshacer = await asignarNombreCaraDesdePortal({
        fiestaId: FIESTA_ID,
        accessKey: 'clave-portal-330',
        personaId: 'persona-1',
        representativeFotoId: 'foto-portal-1',
      });
      expect(deshacer.success).toBe(true);
      expect(deshacer.invitadoId).toBeUndefined();
    });

    it('rechaza nombres parciales o parecidos cuando un invitado entra sin credencial', async () => {
      const parcial = await buscarInvitadoPorNombreExactoParaCara(FIESTA_ID, 'Marta');
      expect(parcial.found).toBe(false);

      const exacto = await buscarInvitadoPorNombreExactoParaCara(FIESTA_ID, 'marta gomez');
      expect(exacto).toEqual({
        found: true,
        invitadoId: 'inv-marta',
        nombre: 'Marta Gómez',
      });
    });
  });

  describe('Bloque 8: WhatsApp automático por tanda con interruptor apagado por defecto y reglas anti-spam', () => {
    it('calcula estimado conservador de mensajes para la fiesta', () => {
      const est = calcularEstimadoMensajesFotosWhatsapp(fiestaStore[FIESTA_ID].invitados);
      expect(est.invitadosConTelefono).toBe(3);
      expect(est.mensajesEstimados).toBe(6);
    });

    it('con interruptor apagado por defecto no envía ningún WhatsApp', async () => {
      await registrarCaraInvitado({
        fiestaId: FIESTA_ID,
        guestId: 'inv-ana',
        guestAccessToken: TOKEN_ANA,
        vector: vectorDeCara(0, 0),
        ahoraMs: AHORA_FIESTA_MS,
      });

      const res = await importarFotosFotografoConCaras(
        FIESTA_ID,
        [{ id: 'wa-off-1', imageUrl: 'https://wfolio.test/w1.jpg', descriptors: [vectorDeCara(0.2, 0)] }],
        { ahoraMs: AHORA_FIESTA_MS },
      );

      expect(res.whatsappEnviados).toBe(0);
      expect(mockSendMetaWhatsAppMessage).not.toHaveBeenCalled();
    });

    it('con interruptor prendido manda 1 WhatsApp por tanda de 5 fotos, respeta ventana de 2h y excluye personales, empleados y bajas', async () => {
      fiestaStore[FIESTA_ID].socialGallerySettings!.whatsappFotosInvitadosActivo = true;
      fiestaStore[FIESTA_ID].invitados = [
        {
          id: 'inv-ana',
          nombre: 'Ana Silva',
          rsvp: 'Confirmado',
          contacto: '099111222',
          guestAccessToken: TOKEN_ANA,
        } as any,
        {
          id: 'inv-personal',
          nombre: 'Personal Dueño',
          rsvp: 'Confirmado',
          contacto: '099888777',
          guestAccessToken: 'tok_pers',
        } as any,
        {
          id: 'inv-empleado',
          nombre: 'Empleado DJ',
          rsvp: 'Confirmado',
          contacto: '099666555',
          guestAccessToken: 'tok_emp',
        } as any,
        {
          id: 'inv-baja',
          nombre: 'Baja Chat',
          rsvp: 'Confirmado',
          contacto: '099444333',
          guestAccessToken: 'tok_baja',
        } as any,
      ];

      jsonStore['whatsapp-config.json'] = { numerosPersonales: ['+59899888777'] };
      jsonStore['empleados.json'] = [{ id: 'emp-1', telefono: '099666555' }];
      jsonStore['whatsapp-conversations.json'] = [
        {
          clientPhone: '59899444333',
          messages: [{ from: 'client', content: 'NO' }],
        },
      ];

      const baseVec = vectorDeCara(0, 0);
      for (const guest of fiestaStore[FIESTA_ID].invitados) {
        await registrarCaraInvitado({
          fiestaId: FIESTA_ID,
          guestId: guest.id,
          guestAccessToken: guest.guestAccessToken!,
          vector: baseVec,
          ahoraMs: AHORA_FIESTA_MS,
        });
      }

      const cincoFotos = [1, 2, 3, 4, 5].map((n) => ({
        id: `tanda1-${n}`,
        imageUrl: `https://wfolio.test/t1-${n}.jpg`,
        descriptors: [vectorDeCara(0.2, 0)],
      }));
      const res1 = await importarFotosFotografoConCaras(FIESTA_ID, cincoFotos, {
        ahoraMs: AHORA_FIESTA_MS,
      });

      expect(res1.whatsappEnviados).toBe(1);
      expect(mockSendMetaWhatsAppMessage).toHaveBeenCalledTimes(1);
      expect(mockSendMetaWhatsAppMessage.mock.calls[0][0].to).toBe('099111222');
      expect(mockSendMetaWhatsAppMessage.mock.calls[0][0].text).toContain('Aparecés en 5 fotos de Cumple de Sofía 📸');

      // 30 minutos después: no debe volver a mandar WhatsApp por ventana de 2 horas
      const res30Min = await importarFotosFotografoConCaras(
        FIESTA_ID,
        [{ id: 'tanda2-1', imageUrl: 'https://wfolio.test/t2-1.jpg', descriptors: [vectorDeCara(0.2, 0)] }],
        { ahoraMs: AHORA_FIESTA_MS + 30 * 60 * 1000 },
      );
      expect(res30Min.whatsappEnviados).toBe(0);
      expect(mockSendMetaWhatsAppMessage).toHaveBeenCalledTimes(1);

      // 2 horas y 1 minuto después: puede volver a mandar para Ana solamente
      const res2h = await importarFotosFotografoConCaras(
        FIESTA_ID,
        [{ id: 'tanda3-1', imageUrl: 'https://wfolio.test/t3-1.jpg', descriptors: [vectorDeCara(0.2, 0)] }],
        { ahoraMs: AHORA_FIESTA_MS + 2 * 60 * 60 * 1000 + 60_000 },
      );
      expect(res2h.whatsappEnviados).toBe(1);
      expect(mockSendMetaWhatsAppMessage).toHaveBeenCalledTimes(2);
    });
  });
});

/**
 * @jest-environment node
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  defaultZonaDigitalFeatures,
  isZonaDigitalFeatureEnabled,
  withZonaDigitalDefaults,
} from '@/lib/zona-digital-adolescentes';
import {
  computePartyExpirationMs,
  createFamilyModeratorToken,
  verifyFamilyModeratorToken,
} from '@/lib/auth/moderator-link';
import { isUploaderBlocked, type BlockedSocialGuest } from '@/lib/social-fiesta/moderacion-bloqueos';
import {
  LIVE_STREAM_CONNECT_TIMEOUT_MS,
  LIVE_STREAM_FALLBACK_CLIP_SECONDS,
  LIVE_STREAM_MAX_DURATION_SECONDS,
  LIVE_STREAM_STUN_URL,
  shouldDisplayLiveStreamOnScreen,
  type LiveStreamRequest,
} from '@/lib/social-fiesta/transmision-invitado';
import {
  GUESTBOOK_MAX_SECONDS,
  isGuestbookMessageClientOnly,
} from '@/lib/social-fiesta/libro-de-firmas';
import { evaluateMobilePrintLimit, type MobilePrintRequest } from '@/lib/social-fiesta/cola-impresion';
import {
  calcularEstadisticasEnVivo,
  formatearDatoEstadistica,
} from '@/lib/social-fiesta/estadisticas-en-vivo';
import { DEFAULT_TRIVIA_QUESTIONS } from '@/lib/games/game-engine';
import { topTrivia } from '@/lib/games/juegos-en-vivo';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { SocialGalleryPost } from '@/types/social-gallery';

const mockGetFiestaById = jest.fn();
const mockGetFiestaByIdRaw = jest.fn();
const mockRequireEventPermission = jest.fn();
const mockRequirePermiso = jest.fn();
const mockHasAppSession = jest.fn();
const mockVerifyPortalSession = jest.fn();
const mockReadData = jest.fn();
const mockWriteData = jest.fn();

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: (...args: any[]) => mockGetFiestaById(...args),
  saveFiesta: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({
  getFiestaByIdRaw: (...args: any[]) => mockGetFiestaByIdRaw(...args),
}));

jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: (...args: any[]) => mockRequireEventPermission(...args),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requirePermiso: (...args: any[]) => mockRequirePermiso(...args),
  hasAppSession: (...args: any[]) => mockHasAppSession(...args),
  requireAppSession: jest.fn().mockResolvedValue({ user: { email: 'staff@ak.uy' } }),
}));

jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: (...args: any[]) => mockVerifyPortalSession(...args),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/commercial/social-interaction-rate-limit', () => ({
  enforceSocialInteractionRateLimit: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/firebase/modo-local', () => ({
  sinBaseDisponible: () => true,
  sinDepositoDisponible: () => true,
}));

jest.mock('@/lib/data-service', () => ({
  readData: (...args: any[]) => mockReadData(...args),
  writeData: (...args: any[]) => mockWriteData(...args),
}));

jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: jest.fn().mockResolvedValue('https://storage.example/mock.jpg'),
  deleteFromStorage: jest.fn().mockResolvedValue(undefined),
  getSignedUrl: jest.fn().mockResolvedValue('https://storage.example/signed'),
}));

import {
  blockGuestFromSocialEvent,
  deleteSocialPost,
  generarEnlaceModeradorFamiliar,
  getModerationWorkspaceData,
  moderateSocialPost,
  requestMobilePrint,
  uploadSocialPost,
} from '@/app/actions/social-gallery';
import { requestLiveStream } from '@/app/actions/social-live-stream';
import { getClientGuestbookMessages, submitGuestbookMessage } from '@/app/actions/social-interactive';

const readFile = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf8');

function makeFiesta(overrides: Partial<FiestaEnPlanificacion> = {}): FiestaEnPlanificacion {
  return {
    id: 'fiesta-323',
    estado: 'En curso',
    configuracion: {
      nombreEvento: 'XV Sofía',
      tipoCelebracion: 'XV',
      fechaEvento: '2026-11-20',
      horaInicio: '21:00',
      horaFin: '05:00',
      nombreLugar: 'Club Uruguay',
      invitadosEstimados: 120,
      presupuestoEstimado: 0,
      notesAdicionales: '',
    },
    personalAsignado: [],
    invitados: [
      {
        id: 'guest-1',
        nombre: 'Sofía Invitada',
        telefono: '099111222',
        rsvp: 'Confirmado',
        partySize: 1,
        guestAccessToken: 'tok-guest-1',
      } as any,
    ],
    socialGallerySettings: {
      enabled: true,
      allowLikes: true,
      allowComments: true,
      uploadsActive: true,
      maxImpresionesPorPersona: 2,
    },
    ...overrides,
  };
}

describe('Orden 323 — Bloques 5, 6, 8, 9, 10 y 11', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasAppSession.mockResolvedValue(false);
    mockVerifyPortalSession.mockResolvedValue(false);
    mockRequireEventPermission.mockRejectedValue(new Error('Sin sesión'));
    mockRequirePermiso.mockResolvedValue({ ok: false, error: 'Sin sesión' });
    mockReadData.mockResolvedValue([]);
    mockWriteData.mockResolvedValue(undefined);
  });

  describe('Regla fundamental — Interruptores apagados de entrada', () => {
    it('incluye los tres interruptores nuevos apagados por defecto (false)', () => {
      const ids = ['transmision_invitado', 'libro_de_firmas', 'impresion_desde_celular'] as const;
      for (const id of ids) {
        const def = defaultZonaDigitalFeatures.find((f) => f.id === id);
        expect(def).toBeDefined();
        expect(def?.enabled).toBe(false);
        expect(isZonaDigitalFeatureEnabled(undefined, id)).toBe(false);
      }
    });

    it('habilita cada funcionalidad solo cuando su interruptor está prendido', () => {
      const settings = withZonaDigitalDefaults({
        enabled: true,
        features: [
          {
            id: 'transmision_invitado',
            label: 'En vivo',
            description: 'Camara',
            enabled: true,
            visibleForGuests: true,
          },
        ],
      });
      expect(isZonaDigitalFeatureEnabled(settings, 'transmision_invitado')).toBe(true);
      expect(isZonaDigitalFeatureEnabled(settings, 'libro_de_firmas')).toBe(false);
      expect(isZonaDigitalFeatureEnabled(settings, 'impresion_desde_celular')).toBe(false);
    });

    it('oculta los botones en /evento/social/[fiestaId] cuando están apagados', () => {
      const socialPage = readFile('src/app/evento/social/[fiestaId]/page.tsx');
      expect(socialPage).toContain('{canLiveStream && (');
      expect(socialPage).toContain('{canGuestbook && (');
      expect(socialPage).toContain('{canMobilePrint && !isVideo(post) && (');
    });
  });

  describe('Bloque 5 — Moderación completa, bloqueos y enlace temporal para familiar', () => {
    it('rechaza acceso a moderación si no hay sesión ni enlace válido', async () => {
      mockGetFiestaById.mockResolvedValue(makeFiesta());

      const res = await getModerationWorkspaceData('fiesta-323');
      expect(res.authorized).toBe(false);
      expect(res.posts).toBeUndefined();

      const sinEnlaceInvalido = await getModerationWorkspaceData('fiesta-323', 'token.trucho');
      expect(sinEnlaceInvalido.authorized).toBe(false);
    });

    it('valida el token temporal solo para su fiesta y vence al terminar o finalizar la fiesta', () => {
      const fiesta = makeFiesta();
      const nowActive = Date.parse('2026-11-21T01:00:00-03:00');
      const exp = computePartyExpirationMs(fiesta, nowActive);
      expect(exp).toBeGreaterThan(nowActive);

      const token = createFamilyModeratorToken('fiesta-323', exp);
      expect(verifyFamilyModeratorToken(token, 'fiesta-323', fiesta, nowActive)).toBe(true);
      expect(verifyFamilyModeratorToken(token, 'otra-fiesta', fiesta, nowActive)).toBe(false);

      const afterParty = Date.parse('2026-11-21T06:00:00-03:00');
      expect(verifyFamilyModeratorToken(token, 'fiesta-323', fiesta, afterParty)).toBe(false);

      const fiestaFinalizada = makeFiesta({ estado: 'Finalizada' });
      expect(verifyFamilyModeratorToken(token, 'fiesta-323', fiestaFinalizada, nowActive)).toBe(false);
    });

    it('permite al familiar con enlace válido aprobar, ocultar, borrar y bloquear sin exponer teléfonos', async () => {
      const fiesta = makeFiesta();
      const nowActive = Date.parse('2026-11-20T22:00:00-03:00');
      const exp = Date.now() + 3_600_000;
      const futureFiesta = makeFiesta({
        configuracion: {
          ...fiesta.configuracion,
          fechaEvento: new Date(Date.now() + 3_600_000).toISOString().slice(0, 10),
          horaInicio: '00:00',
          horaFin: '23:59',
        },
      });
      const token = createFamilyModeratorToken('fiesta-323', exp);
      expect(nowActive).toBeGreaterThan(0);

      mockGetFiestaById.mockResolvedValue(futureFiesta);
      const samplePost: SocialGalleryPost = {
        id: 'post-1',
        fiestaId: 'fiesta-323',
        imageUrl: 'https://example.com/foto.jpg',
        moderationStatus: 'pending',
        authorName: 'Carlos Pérez',
        guestId: 'guest-1',
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: [],
      };
      mockReadData.mockImplementation(async (filePath: string) => {
        if (filePath === 'social-gallery/metadata.json') return [samplePost];
        return [];
      });

      const ws = await getModerationWorkspaceData('fiesta-323', token);
      expect(ws.authorized).toBe(true);
      expect(ws.role).toBe('family');
      expect(JSON.stringify(ws)).not.toContain('099111222');

      const approved = await moderateSocialPost('post-1', 'approved', 'Familiar', token);
      expect(approved.success).toBe(true);
      expect(approved.post?.moderationStatus).toBe('approved');

      const blockedRes = await blockGuestFromSocialEvent(
        'fiesta-323',
        { authorName: 'Carlos Pérez', guestId: 'guest-1', postId: 'post-1' },
        token,
      );
      expect(blockedRes.success).toBe(true);

      const deleted = await deleteSocialPost('post-1', token);
      expect(deleted.success).toBe(true);
      expect(mockWriteData).toHaveBeenCalledWith('social-gallery/metadata.json', []);
    });

    it('impide nuevas subidas de un invitado bloqueado y avisa amablemente que su contenido fue reportado', async () => {
      const blockedList: BlockedSocialGuest[] = [
        {
          id: 'blk-1',
          fiestaId: 'fiesta-323',
          authorName: 'Carlos Pérez',
          guestId: 'guest-1',
          blockedAt: new Date().toISOString(),
        },
      ];
      expect(isUploaderBlocked(blockedList, { guestId: 'guest-1' })).not.toBeNull();
      expect(isUploaderBlocked(blockedList, { authorName: 'carlos perez' })).not.toBeNull();
      expect(isUploaderBlocked(blockedList, { authorName: 'Otro Invitado' })).toBeNull();

      mockGetFiestaById.mockResolvedValue(makeFiesta());
      mockReadData.mockImplementation(async (filePath: string) => {
        if (filePath.includes('blocked-fiesta-323')) return blockedList;
        return [];
      });

      const fd = new FormData();
      fd.append('fiestaId', 'fiesta-323');
      fd.append('authorName', 'Sofía Invitada');
      fd.append('guestId', 'guest-1');
      fd.append('guestAccessToken', 'tok-guest-1');
      fd.append('file', new File(['img'], 'foto.jpg', { type: 'image/jpeg' }));

      const uploadRes = await uploadSocialPost(fd);
      expect(uploadRes.success).toBe(false);
      expect(uploadRes.error).toMatch(/reportado/i);
    });

    it('solo el equipo con permiso NOCHE genera el enlace temporal de familiar y la UI usa deleteSocialPost', async () => {
      const noPerm = await generarEnlaceModeradorFamiliar('fiesta-323');
      expect(noPerm.success).toBe(false);

      const modPage = readFile('src/app/evento/moderacion/[fiestaId]/page.tsx');
      expect(modPage).toContain('deleteSocialPost');
      expect(modPage).toContain('Bloquear a este invitado');
    });
  });

  describe('Bloque 6 — Trivia con IA, revisión del equipo y ranking en muro', () => {
    it('el centro de fiesta integra generarTriviaConIa, revisión/edición y controles en vivo con fallback', () => {
      const centroPage = readFile('src/app/(app)/fiestas/[id]/centro/page.tsx');
      const triviaPanel = readFile('src/components/centro/CentroTriviaPanel.tsx');
      const muroPage = readFile('src/app/evento/muro-en-vivo/[fiestaId]/page.tsx');

      expect(centroPage).toContain('generarTriviaConIa');
      expect(triviaPanel).toContain('Armar con IA');
      expect(triviaPanel).toContain('DEFAULT_TRIVIA_QUESTIONS');
      expect(triviaPanel).toContain('Confirmar preguntas');
      expect(triviaPanel).toContain('Revelar respuesta');
      expect(triviaPanel).toContain('Terminar');
      expect(DEFAULT_TRIVIA_QUESTIONS.length).toBeGreaterThanOrEqual(5);

      const ranking = topTrivia({
        triviaGame: {
          id: 't1',
          fiestaId: 'fiesta-323',
          title: 'Trivia',
          questions: [],
          createdAt: '',
          status: 'active',
          participants: [
            { guestId: '1', guestName: 'Ana López', score: 250, answers: [] },
            { guestId: '2', guestName: 'Beto Díaz', score: 120, answers: [] },
          ],
        },
      });
      expect(ranking).toEqual([
        { nombre: 'Ana L.', puntos: 250 },
        { nombre: 'Beto D.', puntos: 120 },
      ]);
      expect(muroPage).toContain('rankingTrivia');
      expect(muroPage).toContain('Top Trivia');
    });
  });

  describe('Bloque 8 — Transmisión en vivo desde celular (STUN gratis + aceptación operador + Plan B)', () => {
    it('usa STUN gratis de Google, tope 60s, timeout 10s y clip Plan B 15s', () => {
      expect(LIVE_STREAM_STUN_URL).toBe('stun:stun.l.google.com:19302');
      expect(LIVE_STREAM_CONNECT_TIMEOUT_MS).toBe(10_000);
      expect(LIVE_STREAM_MAX_DURATION_SECONDS).toBe(60);
      expect(LIVE_STREAM_FALLBACK_CLIP_SECONDS).toBe(15);
    });

    it('nunca sale en pantalla sin aceptación del operador y corta a los 60 segundos', () => {
      const now = Date.now();
      const pending: LiveStreamRequest = {
        id: 'l1',
        fiestaId: 'fiesta-323',
        guestKey: 'g1',
        authorName: 'Lucía',
        status: 'pending',
        createdAt: new Date(now).toISOString(),
        maxDurationSeconds: 60,
      };
      expect(shouldDisplayLiveStreamOnScreen(pending, now)).toBe(false);

      const accepted: LiveStreamRequest = {
        ...pending,
        status: 'accepted',
        acceptedAt: new Date(now - 20_000).toISOString(),
      };
      expect(shouldDisplayLiveStreamOnScreen(accepted, now)).toBe(true);

      const expired: LiveStreamRequest = {
        ...pending,
        status: 'live',
        acceptedAt: new Date(now - 65_000).toISOString(),
      };
      expect(shouldDisplayLiveStreamOnScreen(expired, now)).toBe(false);
    });

    it('rechaza pedidos en vivo cuando el interruptor transmision_invitado está apagado', async () => {
      mockGetFiestaById.mockResolvedValue(makeFiesta());
      const offRes = await requestLiveStream('fiesta-323', {
        authorName: 'Lucía',
        offerSdp: '{"type":"offer","sdp":"v=0"}',
      });
      expect(offRes.success).toBe(false);

      mockGetFiestaById.mockResolvedValue(
        makeFiesta({
          zonaDigitalAdolescentes: withZonaDigitalDefaults({
            enabled: true,
            features: [
              { id: 'transmision_invitado', label: 'En vivo', description: '', enabled: true, visibleForGuests: true },
            ],
          }),
        }),
      );
      const onRes = await requestLiveStream('fiesta-323', {
        authorName: 'Lucía',
        offerSdp: '{"type":"offer","sdp":"v=0"}',
      });
      expect(onRes.success).toBe(true);
      expect(onRes.request?.status).toBe('pending');
    });
  });

  describe('Bloque 9 — Libro de firmas en audio y video privado para el cliente', () => {
    it('tope de 30s, solo visible para cliente y bloqueado si el interruptor está apagado', async () => {
      expect(GUESTBOOK_MAX_SECONDS).toBe(30);
      expect(isGuestbookMessageClientOnly({ visibility: 'client_only' })).toBe(true);

      mockGetFiestaById.mockResolvedValue(makeFiesta());
      const fd = new FormData();
      fd.append('authorName', 'Abuela Marta');
      fd.append('durationSeconds', '12');
      fd.append('file', new File(['audio-bytes'], 'saludo.webm', { type: 'audio/webm' }));

      const offRes = await submitGuestbookMessage('fiesta-323', fd);
      expect(offRes.success).toBe(false);

      mockGetFiestaById.mockResolvedValue(
        makeFiesta({
          zonaDigitalAdolescentes: withZonaDigitalDefaults({
            enabled: true,
            features: [
              { id: 'libro_de_firmas', label: 'Libro', description: '', enabled: true, visibleForGuests: true },
            ],
          }),
        }),
      );
      const onRes = await submitGuestbookMessage('fiesta-323', fd);
      expect(onRes).toMatchObject({ success: true });
      expect(onRes.entry?.visibility).toBe('client_only');

      // Sin sesión ni clave de cliente no se devuelven mensajes privados
      mockGetFiestaByIdRaw.mockResolvedValue(
        makeFiesta({
          clientPortalSettings: { enabled: true, accessKey: 'clave-secreta-123' } as any,
        }),
      );
      const unauth = await getClientGuestbookMessages('fiesta-323');
      expect(unauth.authorized).toBe(false);
      expect(unauth.messages).toHaveLength(0);

      // Con clave válida del cliente devuelve los mensajes
      mockReadData.mockResolvedValue([onRes.entry]);
      const authClient = await getClientGuestbookMessages('fiesta-323', 'clave-secreta-123');
      expect(authClient.authorized).toBe(true);
      expect(authClient.messages).toHaveLength(1);
      expect(authClient.messages[0].authorName).toBe('Abuela Marta');
    });
  });

  describe('Bloque 10 — Imprimir foto desde el celular con cola, número y límite', () => {
    it('respeta el interruptor, asigna número correlativo y aplica maxImpresionesPorPersona', async () => {
      const samplePost: SocialGalleryPost = {
        id: 'foto-1',
        fiestaId: 'fiesta-323',
        imageUrl: 'https://example.com/1.jpg',
        moderationStatus: 'approved',
        authorName: 'Martina',
        guestId: 'g-martina',
        timestamp: new Date().toISOString(),
        likes: 1,
        comments: [],
      };
      const existing: MobilePrintRequest[] = [
        {
          id: 'p1',
          fiestaId: 'fiesta-323',
          postId: 'otra-1',
          imageUrl: 'https://example.com/a.jpg',
          authorName: 'Martina',
          requestedBy: 'Martina',
          guestId: 'g-martina',
          ticketNumber: 1,
          status: 'queued',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'p2',
          fiestaId: 'fiesta-323',
          postId: 'otra-2',
          imageUrl: 'https://example.com/b.jpg',
          authorName: 'Martina',
          requestedBy: 'Martina',
          guestId: 'g-martina',
          ticketNumber: 2,
          status: 'printed',
          createdAt: new Date().toISOString(),
        },
      ];

      expect(evaluateMobilePrintLimit(samplePost, existing, 2).allowed).toBe(false);
      expect(evaluateMobilePrintLimit(samplePost, existing.slice(0, 1), 2).allowed).toBe(true);

      // Interruptor apagado
      mockGetFiestaById.mockResolvedValue(makeFiesta());
      const offRes = await requestMobilePrint('fiesta-323', 'foto-1', { authorName: 'Martina' });
      expect(offRes.success).toBe(false);

      // Interruptor prendido -> genera turno #2
      mockGetFiestaById.mockResolvedValue(
        makeFiesta({
          zonaDigitalAdolescentes: withZonaDigitalDefaults({
            enabled: true,
            features: [
              { id: 'impresion_desde_celular', label: 'Imprimir', description: '', enabled: true, visibleForGuests: true },
            ],
          }),
        }),
      );
      mockReadData.mockImplementation(async (filePath: string) => {
        if (filePath === 'social-gallery/metadata.json') return [samplePost];
        if (filePath.includes('print-queue-fiesta-323')) return existing.slice(0, 1);
        return [];
      });
      const onRes = await requestMobilePrint('fiesta-323', 'foto-1', {
        guestId: 'g-martina',
        authorName: 'Martina',
      });
      expect(onRes.success).toBe(true);
      expect(onRes.request?.ticketNumber).toBe(2);
    });
  });

  describe('Bloque 11 — Estadísticas en vivo reales para el operador', () => {
    it('muestra "Sin datos todavía" cuando no hay actividad real', () => {
      const emptyStats = calcularEstadisticasEnVivo({});
      expect(emptyStats.invitadosEntraron).toBe(0);
      expect(emptyStats.invitadosAhora).toBe(0);
      expect(emptyStats.fotosSubidas).toBe(0);
      expect(emptyStats.fotosAprobadas).toBe(0);
      expect(emptyStats.votos).toBe(0);
      expect(emptyStats.mesaMasActiva).toBeNull();
      expect(formatearDatoEstadistica(emptyStats.invitadosEntraron)).toBe('Sin datos todavía');
    });

    it('cuenta exactamente 2 invitados reales, fotos, votos y mesa más activa', () => {
      const now = Date.now();
      const stats = calcularEstadisticasEnVivo({
        nowMs: now,
        invitados: [
          { id: 'g1', nombre: 'Ana', checkedIn: true, partySize: 1, tableNumber: '4' } as any,
          { id: 'g2', nombre: 'Luis', checkedIn: false, partySize: 1, tableNumber: '7' } as any,
        ],
        presences: [
          {
            visitorKey: 'g:g1',
            fiestaId: 'fiesta-323',
            guestId: 'g1',
            tableNumber: '4',
            firstSeenAt: new Date(now - 60_000).toISOString(),
            lastSeenAt: new Date(now - 10_000).toISOString(),
          },
          {
            visitorKey: 'g:g2',
            fiestaId: 'fiesta-323',
            guestId: 'g2',
            tableNumber: '7',
            firstSeenAt: new Date(now - 60_000).toISOString(),
            lastSeenAt: new Date(now - 20_000).toISOString(),
          },
        ],
        posts: [
          {
            id: 'f1',
            fiestaId: 'fiesta-323',
            imageUrl: 'x',
            authorName: 'Ana',
            guestId: 'g1',
            moderationStatus: 'approved',
            timestamp: new Date(now).toISOString(),
            likes: 3,
            comments: [],
          },
          {
            id: 'f2',
            fiestaId: 'fiesta-323',
            imageUrl: 'y',
            authorName: 'Luis',
            moderationStatus: 'pending',
            timestamp: new Date(now).toISOString(),
            likes: 0,
            comments: [],
          },
        ],
        polls: [
          {
            id: 'poll-1',
            fiestaId: 'fiesta-323',
            question: '¿Sigue la música?',
            active: true,
            createdAt: new Date(now).toISOString(),
            options: [{ id: 'a', text: 'Sí', votes: 4 }],
          },
        ],
      });

      expect(stats.invitadosEntraron).toBe(2);
      expect(stats.invitadosAhora).toBe(2);
      expect(stats.fotosSubidas).toBe(2);
      expect(stats.fotosAprobadas).toBe(1);
      expect(stats.votos).toBe(7);
      expect(stats.mesaMasActiva?.mesa).toBe('4');
    });
  });
});

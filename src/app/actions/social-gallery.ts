'use server';

/**
 * Social Gallery actions — all data is persisted directly to Firestore.
 *
 * Why bypass data-service.ts (readData / writeData)?
 * ────────────────────────────────────────────────────────────────────
 * The generic helper stores each "file" as a full array document.  When 200+
 * guests upload simultaneously the pattern collapses into a read-modify-write
 * race: every server action reads the same snapshot, appends its own post, and
 * writes the array back — so only the last write survives and all others are
 * silently lost.
 *
 * By writing to Firestore directly we get:
 *   • One document per post  → zero write collisions on upload
 *   • FieldValue.increment   → atomic like counter (no missed likes)
 *   • FieldValue.arrayUnion  → atomic comment append (no missed comments)
 *   • runTransaction         → safe read-modify-write for highlight edits
 *   • One document per chat message → same safety for concurrent chat
 */

import type {
  SocialGalleryPost,
  SocialComment,
  ChatMessage,
  SocialPostIaRevision,
} from '@/types/social-gallery';
import { sinBaseDisponible } from '@/lib/firebase/modo-local';
import { LECTURA_COMPLETA } from '@/lib/fiesta/lectura-completa';
import { soloAprobados } from '@/lib/social-fiesta/visibilidad';
import type { FiestaEnPlanificacion, SocialGallerySettings } from '@/types/fiesta';
import { uploadToStorage, deleteFromStorage } from '@/lib/firebase/storage';
import type { Firestore, QueryDocumentSnapshot, Transaction } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import path from 'path';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { getFiestaByAccessKey } from '@/app/actions/fiesta/portal.actions';
import * as logger from '@/lib/logger';
import {
  reviewSocialContent,
  sanitizeSocialText,
  imageAiSafeDesde,
  type ResultadoRevisionImagen,
} from '@/lib/social-fiesta/content-review';
import { checkImageSafety } from '@/lib/social-fiesta/content-safety-ai';
import { hasAppSession, requireAppSession, requirePermiso } from '@/lib/auth/require-session';
import { requireEventPermission } from '@/lib/auth/event-access';
import { PERMISOS } from '@/lib/auth/perfiles';
import { shouldQueueForManualReview } from '@/lib/social-fiesta/guardrails';
import { toPublicSocialEvent, type PublicSocialEvent } from '@/lib/social-fiesta/public-event';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { readData, writeData } from '@/lib/data-service';
import { hasPublicGuestAccess, buildPublicGuestPortalData } from '@/lib/guest-portal-public-data';
import { verifyEntertainmentAccessToken } from '@/lib/auth/entertainment-token';
import { isEntertainmentModuleId } from '@/lib/entertainment/station-config';
import { resolveSocialUploadAccess } from '@/lib/social-fiesta/upload-access';
import { verifyPortalSession } from '@/lib/security/portal-session';
import { sumarMisionDeFoto } from '@/lib/games/misiones-fotos';
import { idDeMisionDelTag } from '@/lib/games/juegos-en-vivo';
import { getFiestaByIdRaw } from '@/lib/fiesta/get-fiesta-raw';
import { idDelIntento, esIdYaExistente } from '@/lib/intento-en-servidor';
import { isZonaDigitalFeatureEnabled } from '@/lib/zona-digital-adolescentes';
import {
  computePartyExpirationMs,
  createFamilyModeratorToken,
  verifyFamilyModeratorToken,
} from '@/lib/auth/moderator-link';
import {
  isUploaderBlocked,
  normalizeBlockedAuthorName,
  type BlockedSocialGuest,
} from '@/lib/social-fiesta/moderacion-bloqueos';
import {
  evaluateMobilePrintLimit,
  type MobilePrintRequest,
} from '@/lib/social-fiesta/cola-impresion';
import type { GuestPresenceRecord } from '@/lib/social-fiesta/estadisticas-en-vivo';
import { decidir } from '@/lib/ai/decisiones';
import { completarNotasAlbumEnTandas } from '@/lib/album/armar-album';
import { sendNotificationToTargets } from '@/lib/firebase/server-messaging';
import { sendMetaWhatsAppMessage } from '@/lib/whatsapp/meta-sender';
import { getWhatsAppConfig } from '@/app/actions/whatsapp';
import { WHATSAPP_WEBHOOK_INTERNAL_TOKEN } from '@/lib/whatsapp/internal-token';
import { normalizeUruguayPhone } from '@/lib/commercial/contact';
import { esAprobadoParaMostrar } from '@/lib/social-fiesta/visibilidad';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import {
  agruparEnPersonas,
  aplicarAsignacionesAPersonas,
  buscarFotosDeUnaCara,
  buscarInvitadoPorNombreExacto,
  esVectorFacialValido,
  filtrarCarasPorPosts,
  mezclarCarasPorFoto,
  quitarCarasDeFoto,
  vectorInvitadoExpirado,
  type AsignacionCara,
  type CaraEnFoto,
  type Persona,
} from '@/lib/caras/agrupar-caras';
import { normalizarMomentoPost } from '@/lib/caras/momentos-galeria';
import {
  armarMensajeWhatsappFotos,
  esRespuestaBajaWhatsapp,
  VENTANA_WHATSAPP_FOTOS_MS,
} from '@/lib/caras/whatsapp-fotos';
import type { Empleado } from '@/types/empleado';
import type { WhatsAppConfig, WhatsAppConversation } from '@/types/whatsapp';

// Firestore collection names
const GALLERY_COLLECTION = 'social_gallery_posts';
const CHAT_COLLECTION = 'social_chat';
const BLOCKED_GUESTS_COLLECTION = 'social_blocked_guests';
const PRINT_QUEUE_COLLECTION = 'social_mobile_print_queue';
const PRESENCE_COLLECTION = 'social_guest_presence';

/**
 * El tope va en lo que sube CADA invitado, no en lo que junta la fiesta.
 *
 * Antes el evento entero se cortaba a las 200 fotos. En una fiesta de 150
 * personas con tres estaciones eso se alcanza a mitad de la noche, y a partir
 * de ahi nadie mas puede subir nada: el que llega tarde se queda afuera y el
 * cliente pierde la mitad de sus recuerdos. Es exactamente lo contrario de lo
 * que se quiere.
 *
 * Ahora el limite del evento es una red de contencion contra un abuso masivo,
 * no un tope de uso normal. Quien acota de verdad es el limite por persona,
 * junto con el peso maximo por archivo y los 15 segundos de video.
 */
const MAX_PHOTOS_PER_EVENT = 5000;
const MAX_PHOTOS_PER_PERSON = 10;
const MAX_IMAGE_UPLOAD_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_UPLOAD_SIZE = 60 * 1024 * 1024;

/** Returns the Firestore Admin instance; throws if Firebase is not configured. */
async function getDb(): Promise<Firestore> {
  const { dbAdmin } = await import('@/lib/firebase/server');
  if (!dbAdmin) throw new Error('Firestore no disponible.');
  return dbAdmin as Firestore;
}

async function canModerateSocialEvent(fiestaId: string): Promise<boolean> {
  try {
    await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    return true;
  } catch {
    return false;
  }
}

async function resolveModerationAccess(
  fiestaId: string,
  modToken?: string,
): Promise<
  | { authorized: true; role: 'staff' | 'family'; fiesta: FiestaEnPlanificacion }
  | { authorized: false; error: string }
> {
  try {
    const fiesta = await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    return { authorized: true, role: 'staff', fiesta };
  } catch (staffError: any) {
    if (modToken) {
      await enforcePublicRateLimit({
        scope: 'social-family-moderation',
        identity: fiestaId,
        limit: 120,
        windowMs: 60_000,
      }).catch(() => undefined);

      const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
      if (fiesta && verifyFamilyModeratorToken(modToken, fiestaId, fiesta)) {
        return { authorized: true, role: 'family', fiesta };
      }
      return { authorized: false, error: 'Este enlace temporal de moderación no es válido o ya venció.' };
    }
    return {
      authorized: false,
      error: staffError?.message || 'Acceso no autorizado.',
    };
  }
}

async function getSocialPostModerationContext(postId: string) {
  const permission = await requirePermiso(PERMISOS.NOCHE);
  if (!permission.ok) throw new Error(permission.error);

  const db = await getDb();
  const ref = db.collection(GALLERY_COLLECTION).doc(postId);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new Error('Publicación no encontrada.');

  const post = snapshot.data() as SocialGalleryPost;
  await requireEventPermission(post.fiestaId, PERMISOS.NOCHE);
  return { db, ref, snapshot, post };
}

async function getLocalSocialPosts(fiestaId: string): Promise<SocialGalleryPost[]> {
  const posts = await readData<SocialGalleryPost[]>('social-gallery/metadata.json', []);
  return posts
    .filter((post) => post.fiestaId === fiestaId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

async function getAllEventPosts(fiestaId: string): Promise<SocialGalleryPost[]> {
  if (sinBaseDisponible()) {
    return getLocalSocialPosts(fiestaId);
  }
  const db = await getDb();
  const snapshot = await db
    .collection(GALLERY_COLLECTION)
    .where('fiestaId', '==', fiestaId)
    .get();
  return snapshot.docs
    .map((doc: QueryDocumentSnapshot) => {
      const data = { ...doc.data() } as any;
      delete data._syncedAt;
      return data as SocialGalleryPost;
    })
    .sort((a: SocialGalleryPost, b: SocialGalleryPost) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

async function getBlockedList(fiestaId: string): Promise<BlockedSocialGuest[]> {
  if (sinBaseDisponible()) {
    return readData<BlockedSocialGuest[]>(`social-gallery/blocked-${fiestaId}.json`, []);
  }
  const db = await getDb();
  const snap = await db
    .collection(BLOCKED_GUESTS_COLLECTION)
    .where('fiestaId', '==', fiestaId)
    .get();
  return snap.docs
    .map((doc: QueryDocumentSnapshot) => doc.data() as BlockedSocialGuest)
    .sort((a, b) => new Date(b.blockedAt).getTime() - new Date(a.blockedAt).getTime());
}

async function getPrintQueue(fiestaId: string): Promise<MobilePrintRequest[]> {
  if (sinBaseDisponible()) {
    const items = await readData<MobilePrintRequest[]>(`social-gallery/print-queue-${fiestaId}.json`, []);
    return [...items].sort((a, b) => (a.ticketNumber || 0) - (b.ticketNumber || 0));
  }
  const db = await getDb();
  const snap = await db
    .collection(PRINT_QUEUE_COLLECTION)
    .where('fiestaId', '==', fiestaId)
    .get();
  return snap.docs
    .map((doc: QueryDocumentSnapshot) => doc.data() as MobilePrintRequest)
    .sort((a, b) => (a.ticketNumber || 0) - (b.ticketNumber || 0));
}

function mapMotivoDudaACriollo(
  motivoChoice: string | undefined,
  apropiado: boolean,
  esDeLaFiesta: boolean,
): string | undefined {
  switch (motivoChoice) {
    case 'desnudez':
      return 'La IA la marcó como posible desnudez';
    case 'violencia':
      return 'La IA la marcó como posible violencia';
    case 'ofensivo':
      return 'La IA la marcó como posible contenido ofensivo';
    case 'spam':
      return 'La IA la marcó como posible spam';
    case 'borrosa':
      return 'La IA la marcó como foto muy oscura o movida';
    case 'ajena':
      return 'La IA duda si es de la fiesta';
    default:
      if (!apropiado) return 'La IA la marcó como posible contenido inapropiado';
      if (!esDeLaFiesta) return 'La IA duda si es de la fiesta';
      return undefined;
  }
}

async function evaluarImagenConDecisionesRapidas(
  entrada: { buffer: Buffer; mimeType: string } | { url: string },
  dedication?: string,
): Promise<SocialPostIaRevision | null> {
  const entradas = dedication
    ? [entrada, { texto: `Dedicatoria: ${dedication}` }]
    : [entrada];

  const decision = await decidir({
    entradas,
    preguntas: {
      apropiado: {
        tipo: 'si_no',
        instruccion: '¿La imagen es apropiada para mostrarse en una pantalla de fiesta familiar (sin desnudez, violencia ni gestos ofensivos)?',
      },
      es_de_la_fiesta: {
        tipo: 'si_no',
        instruccion: '¿La foto parece ser de una fiesta, evento social o celebración con personas?',
      },
      calidad: {
        tipo: 'nota',
        instruccion: 'Calificá la calidad visual y encuadre de la foto del 1 (mala/movida/oscura) al 3 (muy buena).',
        escala: { '1': 'Baja', '2': 'Normal', '3': 'Excelente' },
      },
      motivo_duda: {
        tipo: 'opcion',
        instruccion: 'Si no es apropiada o no parece de la fiesta, indicá el motivo principal.',
        opciones: {
          ninguno: 'Ninguno',
          desnudez: 'Posible desnudez o ropa inapropiada',
          violencia: 'Posible violencia o pelea',
          ofensivo: 'Contenido o gesto ofensivo',
          spam: 'Spam o cartel publicitario',
          borrosa: 'Foto muy oscura o movida',
          ajena: 'No parece ser de la fiesta',
        },
      },
    },
    funcion: 'decisiones',
  }).catch(() => null);

  if (!decision) return null;

  const apropiado = decision.apropiado?.siNo === true;
  const esDeLaFiesta = decision.es_de_la_fiesta?.siNo === true;
  const calidadRaw = decision.calidad?.nota;
  const calidad =
    typeof calidadRaw === 'number' && Number.isFinite(calidadRaw) && calidadRaw >= 1 && calidadRaw <= 3
      ? calidadRaw
      : undefined;
  const motivo = mapMotivoDudaACriollo(decision.motivo_duda?.opcion, apropiado, esDeLaFiesta);

  const revision: SocialPostIaRevision = {
    apropiado,
    esDeLaFiesta,
    revisadoAt: new Date().toISOString(),
  };
  if (calidad !== undefined) revision.calidad = calidad;
  if (motivo) revision.motivo = motivo;
  return revision;
}

export interface SocialInteractionCredentials {
  guestId?: string;
  guestAccessToken?: string;
  stationModuleId?: string;
  stationAccessToken?: string;
}

async function resolveSocialInteractionContext(
  fiestaId: string,
  submittedAuthorName: string,
  credentials: SocialInteractionCredentials = {},
) {
  const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
  if (!fiesta) return null;

  const appSession = await hasAppSession();
  const guest = fiesta.invitados?.find((item) => item.id === credentials.guestId);
  const guestAuthorized = hasPublicGuestAccess(
    guest,
    credentials.guestId || '',
    credentials.guestAccessToken || '',
  );
  const stationModuleId = credentials.stationModuleId
    && isEntertainmentModuleId(credentials.stationModuleId)
    ? credentials.stationModuleId
    : undefined;
  const stationAuthorized = Boolean(
    stationModuleId && verifyEntertainmentAccessToken(
      credentials.stationAccessToken,
      fiestaId,
      stationModuleId,
      'guest',
    ),
  );
  const access = resolveSocialUploadAccess({
    fiestaId,
    submittedAuthorName,
    submittedSource: 'social-interaction',
    submittedSourceModule: stationModuleId,
    appSession,
    guest: guest ? { id: guest.id, nombre: guest.nombre } : undefined,
    guestAuthorized,
    stationModuleId,
    stationAuthorized,
  });

  return access ? { fiesta, access } : null;
}

async function getClientSocialFiesta(
  fiestaId: string,
  accessKey?: string,
): Promise<FiestaEnPlanificacion | null> {
  if (!(await verifyPortalSession(fiestaId))) return null;
  const fiesta = await getFiestaByIdRaw(fiestaId);
  if (!fiesta?.clientPortalSettings?.enabled) {
    return null;
  }
  if (accessKey && fiesta.clientPortalSettings.accessKey !== accessKey) {
    return null;
  }
  return fiesta;
}

// ──────────────────── Photo Gallery ────────────────────

export async function getSocialPosts(fiestaId: string): Promise<SocialGalleryPost[]> {
  try {
    const canModerate = await canModerateSocialEvent(fiestaId);
    const posts = await getAllEventPosts(fiestaId);
    return canModerate
      ? posts
      : soloAprobados(posts);
  } catch (e) {
    // Si falla la lectura NO se devuelve [] (se vería como "no hay fotos"): se avisa a quien llama.
    logger.warn('[social-gallery] getSocialPosts failed:', e);
    throw e;
  }
}

/**
 * Public feed reader. Unlike the administrator reader, this never returns
 * pending or hidden content, even when the browser also has an app session.
 */
export async function getPublicSocialPosts(fiestaId: string): Promise<SocialGalleryPost[]> {
  const posts = await getSocialPosts(fiestaId);
  return soloAprobados(posts);
}

export async function getPublicSocialPostCount(
  fiestaId: string,
  guestId: string,
  guestAccessToken: string,
): Promise<number> {
  try {
    const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
    if (!fiesta || !buildPublicGuestPortalData(fiesta, guestId, guestAccessToken)) return 0;

    if (sinBaseDisponible()) {
      const posts = await getLocalSocialPosts(fiestaId);
      return soloAprobados(posts).length;
    }

    const db = await getDb();
    const baseQuery = db.collection(GALLERY_COLLECTION).where('fiestaId', '==', fiestaId);
    const [total, pending, hidden] = await Promise.all([
      baseQuery.count().get(),
      baseQuery.where('moderationStatus', '==', 'pending').count().get(),
      baseQuery.where('moderationStatus', '==', 'hidden').count().get(),
    ]);
    return Math.max(0, total.data().count - pending.data().count - hidden.data().count);
  } catch (error) {
    logger.warn('[social-gallery] getPublicSocialPostCount failed:', error);
    return 0;
  }
}

export async function getPublicSocialEvent(
  fiestaId: string,
  accessKey?: string,
): Promise<PublicSocialEvent | null> {
  const normalizedKey = accessKey?.trim();
  const fiesta = normalizedKey
    ? await getFiestaByAccessKey(normalizedKey)
    : await getFiestaById(fiestaId, LECTURA_COMPLETA);
  if (!fiesta || fiesta.id !== fiestaId) return null;

  return toPublicSocialEvent(fiesta, Boolean(normalizedKey));
}

export async function getSocialPostsByClient(
  fiestaId: string,
  accessKey: string
): Promise<{ success: boolean; posts?: SocialGalleryPost[]; error?: string }> {
  try {
    const fiesta = await getClientSocialFiesta(fiestaId, accessKey);
    if (!fiesta) return { success: false, error: 'Sesión del portal no autorizada.' };

    const posts = await getAllEventPosts(fiestaId);
    return { success: true, posts };
  } catch (error: any) {
    logger.warn('[social-gallery] getSocialPostsByClient failed:', error);
    return { success: false, error: error.message || 'No se pudieron cargar las publicaciones.' };
  }
}

export async function getSocialAdminAccess(fiestaId?: string): Promise<boolean> {
  if (fiestaId) return canModerateSocialEvent(fiestaId);
  return (await requirePermiso(PERMISOS.NOCHE)).ok;
}

export async function saveSocialGallerySettings(
  fiestaId: string,
  settings: SocialGallerySettings
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAppSession();
    const fiesta = await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    const result = await saveFiesta({ ...fiesta, socialGallerySettings: settings });
    return result.success
      ? { success: true }
      : { success: false, error: result.error || 'No se pudieron guardar los ajustes.' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Sesion no autorizada.' };
  }
}

export async function uploadSocialPost(
  formData: FormData
): Promise<{ success: boolean; post?: SocialGalleryPost; error?: string }> {
  const fiestaId = formData.get('fiestaId') as string;
  const file = formData.get('file') as File;
  const submittedAuthorName = (formData.get('authorName') as string) || 'Invitado';
  const dedication = (formData.get('dedication') as string) || undefined;
  const momentTag = (formData.get('momentTag') as string) || undefined;
  const imageHash = (formData.get('imageHash') as string) || undefined;
  const submittedSource = (formData.get('source') as string) || undefined;
  const submittedSourceModule = (formData.get('sourceModule') as string) || undefined;
  const requestedModuleId = (formData.get('moduleId') as string) || submittedSourceModule;
  const stationAccessToken = (formData.get('accessToken') as string) || undefined;
  const guestId = (formData.get('guestId') as string) || '';
  const guestAccessToken = (formData.get('guestAccessToken') as string) || '';
  const dispositivoId = (formData.get('dispositivoId') as string) || undefined;
  const idIntentoCrudo = formData.get('idIntento');

  if (!fiestaId || !file) return { success: false, error: 'Faltan datos (ID de fiesta o archivo).' };

  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');
  if (!isImage && !isVideo) return { success: false, error: 'Solo se aceptan fotos o videos.' };
  const maxSize = isVideo ? MAX_VIDEO_UPLOAD_SIZE : MAX_IMAGE_UPLOAD_SIZE;
  if (file.size > maxSize) {
    return { success: false, error: isVideo ? 'El video no puede superar los 60MB.' : 'La imagen no puede superar los 10MB.' };
  }

  try {
    const fiestaData = await getFiestaById(fiestaId, LECTURA_COMPLETA);
    if (!fiestaData) return { success: false, error: 'Evento no encontrado.' };

    const appSession = await hasAppSession();
    const guest = fiestaData.invitados?.find((item) => item.id === guestId);
    const guestAuthorized = hasPublicGuestAccess(guest, guestId, guestAccessToken);
    const stationModuleId = requestedModuleId && isEntertainmentModuleId(requestedModuleId)
      ? requestedModuleId
      : undefined;
    const stationAuthorized = Boolean(
      stationModuleId && verifyEntertainmentAccessToken(
        stationAccessToken,
        fiestaId,
        stationModuleId,
        'guest',
      ),
    );
    const uploadAccess = resolveSocialUploadAccess({
      fiestaId,
      submittedAuthorName,
      submittedSource,
      submittedSourceModule,
      appSession,
      guest: guest ? { id: guest.id, nombre: guest.nombre } : undefined,
      guestAuthorized,
      stationModuleId,
      stationAuthorized,
    });
    if (!uploadAccess) {
      return { success: false, error: 'Acceso no autorizado para publicar en este evento.' };
    }

    const { authorName, source, sourceModule, rateIdentity, sharedStation } = uploadAccess;

    await enforcePublicRateLimit({
      scope: 'social-media-upload',
      identity: rateIdentity,
      limit: 12,
      windowMs: 60_000,
    });

    const blockedGuests = await getBlockedList(fiestaId).catch(() => []);
    if (
      isUploaderBlocked(blockedGuests, {
        guestId: guestId || undefined,
        dispositivoId,
        authorName,
      })
    ) {
      return {
        success: false,
        error: 'Tu contenido fue reportado y no podés subir más fotos ni videos en esta fiesta.',
      };
    }

    const textReview = reviewSocialContent({
      type: 'text',
      text: [authorName, dedication].filter(Boolean).join(' '),
      authorName,
      moderationMode: 'automatico',
    });
    if (textReview.status === 'blocked') return { success: false, error: textReview.message };

    const idDeLaPantalla = idDelIntento('post', idIntentoCrudo);
    const wallEnabled = fiestaData.socialGallerySettings?.enabled !== false;
    const wallActive = fiestaData.socialGallerySettings?.uploadsActive !== false;
    const bypassWallCheck = source === 'entertainment';

    if (!wallEnabled && !bypassWallCheck) {
      return { success: false, error: 'El muro social no está habilitado para este evento.' };
    }
    if (!wallActive && !bypassWallCheck) {
      return { success: false, error: 'Las cargas están pausadas para este evento.' };
    }
    const eventLimit = fiestaData?.socialGallerySettings?.maxPhotos ?? MAX_PHOTOS_PER_EVENT;
    const personLimit = fiestaData?.socialGallerySettings?.maxPhotosPerPerson ?? MAX_PHOTOS_PER_PERSON;

    if (sinBaseDisponible()) {
      const localPosts = await getLocalSocialPosts(fiestaId);
      if (idDeLaPantalla) {
        const previa = localPosts.find((p) => p.id === idDeLaPantalla);
        if (previa) return { success: true, post: previa };
      }
      if (localPosts.length >= eventLimit) {
        return { success: false, error: `Se ha alcanzado el límite de ${eventLimit} fotos para este evento.` };
      }
      if (!sharedStation) {
        const personCount = localPosts.filter((p) => p.authorName === authorName).length;
        if (personCount >= personLimit) {
          return { success: false, error: `Ya subiste el máximo de ${personLimit} fotos permitidas por persona.` };
        }
      }
      if (imageHash && localPosts.some((p) => p.imageHash === imageHash)) {
        return { success: false, error: 'Esta imagen ya fue subida anteriormente.' };
      }
    } else {
      const db = await getDb();
      // Pregunta 58: si la respuesta se perdio y la persona reintenta, la foto ya esta con ese id: se
      // devuelve esa, sin volver a subir el archivo ni sumar otra vez la mision.
      if (idDeLaPantalla) {
        const previa = await db.collection(GALLERY_COLLECTION).doc(idDeLaPantalla).get();
        const previaData = previa.exists ? (previa.data() as SocialGalleryPost) : null;
        if (previaData && previaData.fiestaId === fiestaId) return { success: true, post: previaData };
      }

      // Lightweight count — fetches only doc IDs (no full documents) to check the event limit.
      const countSnap = await db
        .collection(GALLERY_COLLECTION)
        .where('fiestaId', '==', fiestaId)
        .select('id')
        .get();
      if (countSnap.size >= eventLimit) {
        return { success: false, error: `Se ha alcanzado el límite de ${eventLimit} fotos para este evento.` };
      }

      // Per-person limit — only applied to named (non-anonymous) users.
      if (!sharedStation) {
        const personSnap = await db
          .collection(GALLERY_COLLECTION)
          .where('fiestaId', '==', fiestaId)
          .where('authorName', '==', authorName)
          .select('id')
          .get();
        if (personSnap.size >= personLimit) {
          return { success: false, error: `Ya subiste el máximo de ${personLimit} fotos permitidas por persona.` };
        }
      }

      // Reject duplicate media regardless of whether it came from a guest or a shared kiosk.
      if (imageHash) {
        const hashSnap = await db
          .collection(GALLERY_COLLECTION)
          .where('fiestaId', '==', fiestaId)
          .where('imageHash', '==', imageHash)
          .select('id')
          .limit(1)
          .get();
        if (!hashSnap.empty) {
          return { success: false, error: 'Esta imagen ya fue subida anteriormente.' };
        }
      }
    }

    const fileExtension = path.extname(file.name);
    const postId = idDeLaPantalla ?? `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const storagePath = `social-gallery/${fiestaId}/${postId}${fileExtension}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let safetyResult: Awaited<ReturnType<typeof checkImageSafety>> = { safe: true, reason: 'clean' };
    let iaRevision: SocialPostIaRevision | null = null;
    if (isImage) {
      [safetyResult, iaRevision] = await Promise.all([
        checkImageSafety(buffer),
        evaluarImagenConDecisionesRapidas(
          { buffer, mimeType: file.type || 'image/jpeg' },
          dedication,
        ),
      ]);
      if (!safetyResult.safe) {
        return {
          success: false,
          error: 'Esta foto no está permitida. No cumple las reglas de la fiesta.'
        };
      }
    }

    const imageUrl = await uploadToStorage(
      buffer,
      storagePath,
      file.type || 'image/jpeg',
      true
    );

    const requireApproval = fiestaData?.socialGallerySettings?.requireApproval !== false;
    // Los videos no los puede revisar el analisis automatico, que mira imagenes
    // fijas. Van siempre a aprobacion: es la unica forma de que no aparezca algo
    // indebido en la pantalla grande delante de toda la fiesta.
    const queueForReview = shouldQueueForManualReview(requireApproval, safetyResult, isVideo);
    const mediaReview = reviewSocialContent({
      type: isVideo ? 'video' : 'image',
      text: dedication,
      authorName,
      moderationMode: queueForReview ? 'seguro' : 'automatico',
      imageAiSafe: safetyResult.safe,
    });
    if (mediaReview.status === 'blocked') return { success: false, error: mediaReview.message };
    const isWallRestricted = (!wallEnabled || !wallActive) && bypassWallCheck;
    const markedUnsafeByAi = Boolean(
      iaRevision && (iaRevision.apropiado === false || iaRevision.esDeLaFiesta === false),
    );
    const finalModerationStatus = isWallRestricted || markedUnsafeByAi
      ? 'pending'
      : (mediaReview.status === 'pending_review' ? 'pending' : 'approved');

    const newPost: SocialGalleryPost = {
      id: postId,
      fiestaId,
      imageUrl,
      mediaType: isVideo ? 'video' : 'image',
      moderationStatus: finalModerationStatus,
      timestamp: new Date().toISOString(),
      authorName: sanitizeSocialText(authorName) || 'Anónimo',
      // Se guarda de quien es la foto, pero solo si probo tener el enlace
      // personal de ese invitado. `guestAuthorized` ya comparo el token contra
      // el que tiene guardado la fiesta: sin eso, cualquiera podria mandar el
      // identificador de otro y quedarse con sus fotos, y esas fotos le
      // apareceran despues en SU recuerdo de la fiesta. Si vino suelto, la foto
      // se guarda igual pero sin dueno.
      ...(guestAuthorized && guestId ? { guestId } : {}),
      likes: 0,
      comments: [],
      source,
      ...(sourceModule ? { sourceModule } : {}),
      ...(dedication ? { dedication: sanitizeSocialText(dedication) } : {}),
      ...(momentTag ? { momentTag } : {}),
      ...(imageHash ? { imageHash } : {}),
    };
    if (iaRevision) {
      newPost.iaRevision = iaRevision;
    }

    if (sinBaseDisponible()) {
      const existing = await readData<SocialGalleryPost[]>('social-gallery/metadata.json', []);
      if (idDeLaPantalla) {
        const previa = existing.find((p) => p.id === postId);
        if (previa) return { success: true, post: previa };
      }
      await writeData('social-gallery/metadata.json', [newPost, ...existing.filter((p) => p.id !== postId)]);
    } else {
      const db = await getDb();
      // Single-document write — zero write conflict even with 200 simultaneous uploads,
      // because every caller writes to its own unique postId document.
      try {
        await (idDeLaPantalla ? db.collection(GALLERY_COLLECTION).doc(postId).create(newPost) : db.collection(GALLERY_COLLECTION).doc(postId).set(newPost));
      } catch (e) {
        if (!esIdYaExistente(e)) throw e;
        // Otro intento con la misma identidad llego primero: es la misma foto.
        const previa = await db.collection(GALLERY_COLLECTION).doc(postId).get();
        return { success: true, post: (previa.data() as SocialGalleryPost) ?? newPost };
      }
    }

    // Misión de fotos: la foto ya quedó guardada (aprobada o esperando aprobación). Se suman los
    // puntos una vez por jugador y misión; si esto falla, la foto no se pierde.
    if (idDeMisionDelTag(momentTag)) {
      try {
        await sumarMisionDeFoto(fiestaId, momentTag, { guestId, guestAccessToken, dispositivoId, nombre: authorName });
      } catch (misionError) {
        logger.warn('[social-gallery] no se pudieron sumar los puntos de la misión:', misionError);
      }
    }

    return { success: true, post: newPost };
  } catch (error: any) {
    return { success: false, error: 'Error al guardar la imagen: ' + error.message };
  }
}

interface CreateSocialMediaPostFromUrlInput {
  fiestaId: string;
  mediaUrl: string;
  mediaType?: 'image' | 'video';
  authorName?: string;
  /**
   * De quien es la foto que sube la estacion. Va con su token para poder
   * comprobarlo: el identificador solo NO alcanza, porque cualquiera podria
   * mandar el de otro invitado y sus fotos le apareceran despues a esa persona
   * en su recuerdo de la fiesta.
   */
  guestId?: string;
  guestAccessToken?: string;
  caption?: string;
  momentTag?: string;
  source?: string;
  sourceModule?: string;
  /** Identidad fija del posteo: el reintento de la misma captura escribe el mismo, no otro. */
  postId?: string;
  drinkId?: string;
  drinkName?: string;
  /** La estacion lo marca cuando lo subido no se pudo revisar automaticamente. */
  revisionManual?: boolean;
  /**
   * Lo que dijo la revision automatica de la imagen: segura / riesgosa / sin_revisar. Si no viene,
   * se deduce de `revisionManual` (false = segura). "Sin revisar" NUNCA se trata como riesgo: queda
   * pendiente de aprobacion manual.
   */
  revisionImagen?: ResultadoRevisionImagen;
}

async function persistSocialMediaPostFromUrl(
  input: CreateSocialMediaPostFromUrlInput,
): Promise<{ success: boolean; post?: SocialGalleryPost; error?: string; bloqueado?: boolean }> {
  if (!input.fiestaId || !input.mediaUrl) {
    return { success: false, error: 'Faltan datos para publicar en el muro social.' };
  }

  try {
    const review = reviewSocialContent({
      type: input.mediaType === 'video' ? 'video' : 'image',
      text: [input.authorName, input.caption].filter(Boolean).join(' '),
      authorName: input.authorName,
      moderationMode: 'automatico',
      // Tres estados: segura (true), riesgosa (false, se rechaza) y sin revisar (undefined, queda
      // pendiente de aprobacion manual). Antes "sin revisar" se convertia en `false` y se rechazaba
      // como si fuera contenido adulto: la foto no llegaba al muro y nadie la veia.
      imageAiSafe: process.env.AK_USE_LOCAL_JSON_ONLY === 'true'
        ? true
        : imageAiSafeDesde(input.revisionImagen ?? (input.revisionManual === false ? 'segura' : 'sin_revisar')),
    });
    if (review.status === 'blocked') return { success: false, error: review.message, bloqueado: true };
    const postId = input.postId || `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    // `revisionManual` lo manda la estacion cuando lo que se subio no se pudo
    // revisar solo: los videos, y las fotos cuando el analisis automatico no
    // estuvo disponible. En ese caso queda esperando el visto bueno en vez de
    // salir directo a la pantalla grande.
    const fiesta = await getFiestaById(input.fiestaId, LECTURA_COMPLETA);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
    const requireApproval = fiesta.socialGallerySettings?.requireApproval !== false;
    const esperaAprobacion = requireApproval || review.status === 'pending_review' || input.revisionManual === true;
    // Mismo candado que el muro: el dueno se guarda solo si la estacion mando el
    // enlace personal de ese invitado y coincide con el que tiene la fiesta. Si
    // no, la foto se publica igual pero sin dueno.
    const invitadoDeLaFoto = fiesta.invitados?.find((item) => item.id === input.guestId);
    const dueñoComprobado = hasPublicGuestAccess(
      invitadoDeLaFoto,
      input.guestId || '',
      input.guestAccessToken || '',
    );
    const newPost: SocialGalleryPost = {
      id: postId,
      fiestaId: input.fiestaId,
      imageUrl: input.mediaUrl,
      mediaType: input.mediaType ?? 'image',
      moderationStatus: esperaAprobacion ? 'pending' : 'approved',
      timestamp: new Date().toISOString(),
      authorName: sanitizeSocialText(input.authorName || 'AK Producciones') || 'AK Producciones',
      ...(dueñoComprobado && input.guestId ? { guestId: input.guestId } : {}),
      likes: 0,
      comments: [],
      source: input.source || 'entertainment',
      ...(input.sourceModule ? { sourceModule: input.sourceModule } : {}),
      // El `caption` se sigue guardando ademas de la dedicatoria: lo leen el muro
      // social, la pantalla de moderacion y la pantalla gigante, y ahi es como se
      // reconoce una foto de mision.
      ...(input.caption ? { caption: sanitizeSocialText(input.caption), dedication: sanitizeSocialText(input.caption) } : {}),
      ...(input.momentTag ? { momentTag: input.momentTag } : {}),
      ...(input.drinkId ? { drinkId: input.drinkId } : {}),
      ...(input.drinkName ? { drinkName: input.drinkName } : {}),
    };

    // Con identidad fija (el reintento de una captura), si el posteo ya existe se devuelve ese y NO
    // se pisa: así un reintento no duplica, y nadie puede sobreescribir el posteo de otro
    // mandando su identidad.
    if (sinBaseDisponible()) {
      const existing = await readData<SocialGalleryPost[]>('social-gallery/metadata.json', []);
      const yaEstaba = input.postId ? existing.find((p) => p.id === postId) : undefined;
      if (yaEstaba) return { success: true, post: yaEstaba };
      const sinDuplicados = existing.filter((p) => p.id !== postId);
      await writeData('social-gallery/metadata.json', [newPost, ...sinDuplicados]);
      return { success: true, post: newPost };
    }

    const db = await getDb();
    if (input.postId) {
      const ref = db.collection(GALLERY_COLLECTION).doc(postId);
      const guardado = await db.runTransaction(async (transaction: Transaction) => {
        const actual = await transaction.get(ref);
        if (actual.exists) return actual.data() as SocialGalleryPost;
        transaction.create(ref, newPost);
        return newPost;
      });
      return { success: true, post: guardado };
    }
    await db.collection(GALLERY_COLLECTION).doc(postId).set(newPost);
    return { success: true, post: newPost };
  } catch (error: any) {
    logger.warn('[social-gallery] createSocialMediaPostFromUrl failed:', error);
    return { success: false, error: error.message || 'No se pudo publicar en el muro social.' };
  }
}

export async function moderateSocialPost(
  postId: string,
  moderationStatus: 'pending' | 'approved' | 'hidden',
  moderatedBy: string = 'AK Producciones',
  modToken?: string,
): Promise<{ success: boolean; post?: SocialGalleryPost; error?: string }> {
  try {
    if (!modToken && !(await hasAppSession())) {
      return { success: false, error: 'Se requiere sesión del equipo o enlace de moderación.' };
    }
    const moderatedAt = new Date().toISOString();
    if (sinBaseDisponible()) {
      const allPosts = await readData<SocialGalleryPost[]>('social-gallery/metadata.json', []);
      const target = allPosts.find((p) => p.id === postId);
      if (!target) return { success: false, error: 'Publicación no encontrada.' };

      const access = await resolveModerationAccess(target.fiestaId, modToken);
      if (!access.authorized) return { success: false, error: access.error };

      const updatedPost: SocialGalleryPost = {
        ...target,
        moderationStatus,
        moderatedAt,
        moderatedBy,
      };
      const updatedAll = allPosts.map((p) => (p.id === postId ? updatedPost : p));
      await writeData('social-gallery/metadata.json', updatedAll);
      if (moderationStatus === 'hidden') {
        await eliminarCarasDePostEnIndice(target.fiestaId, postId);
      } else if (moderationStatus === 'approved') {
        await evaluarCarasDePostRecienAprobado(target.fiestaId, postId);
      }
      return { success: true, post: updatedPost };
    }

    const db = await getDb();
    const ref = db.collection(GALLERY_COLLECTION).doc(postId);
    const snapshot = await ref.get();
    if (!snapshot.exists) return { success: false, error: 'Publicación no encontrada.' };

    const post = snapshot.data() as SocialGalleryPost;
    const access = await resolveModerationAccess(post.fiestaId, modToken);
    if (!access.authorized) return { success: false, error: access.error };

    await ref.update({
      moderationStatus,
      moderatedAt,
      moderatedBy,
    });
    const updated = await ref.get();
    if (moderationStatus === 'hidden') {
      await eliminarCarasDePostEnIndice(post.fiestaId, postId);
    } else if (moderationStatus === 'approved') {
      await evaluarCarasDePostRecienAprobado(post.fiestaId, postId);
    }
    return { success: true, post: { ...updated.data() } as SocialGalleryPost };
  } catch (e: any) {
    return { success: false, error: e.message || 'No se pudo moderar la publicación.' };
  }
}

export async function addLikeToPost(
  postId: string,
  credentials: SocialInteractionCredentials = {},
): Promise<{ success: boolean; post?: SocialGalleryPost; error?: string }> {
  try {
    const db = await getDb();
    const ref = db.collection(GALLERY_COLLECTION).doc(postId);
    const current = await ref.get();
    if (!current.exists) return { success: false, error: 'Publicación no encontrada.' };
    const currentPost = current.data() as SocialGalleryPost;
    const context = await resolveSocialInteractionContext(currentPost.fiestaId, 'Invitado', credentials);
    if (!context) return { success: false, error: 'Acceso no autorizado para reaccionar.' };
    if (context.fiesta.socialGallerySettings?.enabled === false || context.fiesta.socialGallerySettings?.allowLikes === false) {
      return { success: false, error: 'Las reacciones no están habilitadas para este evento.' };
    }
    await enforcePublicRateLimit({
      scope: 'social-post-like',
      identity: `${context.access.rateIdentity}|${postId}`,
      limit: 40,
      windowMs: 60_000,
    });
    // FieldValue.increment is a server-side atomic operation — never loses a like.
    await ref.update({ likes: admin.firestore.FieldValue.increment(1) });
    const updated = await ref.get();
    if (!updated.exists) return { success: false, error: 'Publicación no encontrada.' };
    return { success: true, post: { ...updated.data() } as SocialGalleryPost };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function addCommentToPost(
  postId: string,
  text: string,
  authorName: string = 'Anónimo',
  credentials: SocialInteractionCredentials = {},
  opciones?: { idIntento?: string },
): Promise<{ success: boolean; comment?: SocialComment; error?: string }> {
  try {
    const db = await getDb();
    const ref = db.collection(GALLERY_COLLECTION).doc(postId);
    const current = await ref.get();
    if (!current.exists) return { success: false, error: 'Publicación no encontrada.' };
    const currentPost = current.data() as SocialGalleryPost;
    const context = await resolveSocialInteractionContext(currentPost.fiestaId, authorName, credentials);
    if (!context) return { success: false, error: 'Acceso no autorizado para comentar.' };
    if (context.fiesta.socialGallerySettings?.enabled === false || context.fiesta.socialGallerySettings?.allowComments === false) {
      return { success: false, error: 'Los comentarios no están habilitados para este evento.' };
    }
    await enforcePublicRateLimit({
      scope: 'social-post-comment',
      identity: `${context.access.rateIdentity}|${postId}`,
      limit: 20,
      windowMs: 60_000,
    });
    const resolvedAuthorName = context.access.authorName;
    const review = reviewSocialContent({ type: 'text', text, authorName: resolvedAuthorName, moderationMode: 'automatico' });
    if (review.status === 'blocked') return { success: false, error: review.message };
    // Pregunta 58: si la respuesta se perdio y el invitado reintenta, el comentario ya esta con ese id.
    const idDeLaPantalla = idDelIntento('comment', opciones?.idIntento);
    const comentarioPrevio = idDeLaPantalla ? (currentPost.comments || []).find((c) => c.id === idDeLaPantalla) : undefined;
    if (comentarioPrevio) return { success: true, comment: comentarioPrevio };
    const newComment: SocialComment = {
      id: idDeLaPantalla ?? `comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      authorName: sanitizeSocialText(resolvedAuthorName) || 'Anónimo',
      text: review.sanitizedText || sanitizeSocialText(text),
      timestamp: new Date().toISOString(),
    };
    // arrayUnion is atomic — concurrent comments on the same post are all preserved.
    await ref.update({ comments: admin.firestore.FieldValue.arrayUnion(newComment) });
    return { success: true, comment: newComment };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function highlightComment(
  postId: string,
  commentId: string,
  highlighted: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { db, ref } = await getSocialPostModerationContext(postId);
    await db.runTransaction(async (tx: Transaction) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error('Publicación no encontrada.');
      const data = snap.data() as SocialGalleryPost;
      const comments = (data.comments || []).map(c =>
        c.id === commentId ? { ...c, highlighted } : c
      );
      tx.update(ref, { comments });
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteSocialPost(
  postId: string,
  modToken?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!modToken && !(await hasAppSession())) {
      return { success: false, error: 'Se requiere sesión del equipo o enlace de moderación.' };
    }
    if (sinBaseDisponible()) {
      const allPosts = await readData<SocialGalleryPost[]>('social-gallery/metadata.json', []);
      const target = allPosts.find((p) => p.id === postId);
      if (!target) return { success: false, error: 'Publicación no encontrada.' };

      const access = await resolveModerationAccess(target.fiestaId, modToken);
      if (!access.authorized) return { success: false, error: access.error };

      try {
        await deleteFromStorage(target.imageUrl);
      } catch (fileError: any) {
        logger.warn(`[social-gallery] Could not delete Storage file for post ${postId}: ${fileError.message}`);
      }
      await writeData(
        'social-gallery/metadata.json',
        allPosts.filter((p) => p.id !== postId),
      );
      await eliminarCarasDePostEnIndice(target.fiestaId, postId);
      return { success: true };
    }

    const db = await getDb();
    const ref = db.collection(GALLERY_COLLECTION).doc(postId);
    const snapshot = await ref.get();
    if (!snapshot.exists) return { success: false, error: 'Publicación no encontrada.' };

    const post = snapshot.data() as SocialGalleryPost;
    const access = await resolveModerationAccess(post.fiestaId, modToken);
    if (!access.authorized) return { success: false, error: access.error };

    try {
      await deleteFromStorage(post.imageUrl);
    } catch (fileError: any) {
      logger.warn(`[social-gallery] Could not delete Storage file for post ${postId}: ${fileError.message}`);
    }
    await ref.delete();
    await eliminarCarasDePostEnIndice(post.fiestaId, postId);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'No se pudo borrar la publicación.' };
  }
}

export async function getModerationWorkspaceData(
  fiestaId: string,
  modToken?: string,
): Promise<{
  authorized: boolean;
  role?: 'staff' | 'family';
  eventName?: string;
  posts?: SocialGalleryPost[];
  blockedGuests?: BlockedSocialGuest[];
  error?: string;
}> {
  try {
    const access = await resolveModerationAccess(fiestaId, modToken);
    if (!access.authorized) {
      return { authorized: false, error: access.error };
    }

    const [posts, blockedGuests] = await Promise.all([
      getAllEventPosts(fiestaId),
      getBlockedList(fiestaId).catch(() => []),
    ]);

    return {
      authorized: true,
      role: access.role,
      eventName: access.fiesta.configuracion?.nombreEvento || 'Evento',
      posts,
      blockedGuests,
    };
  } catch (e: any) {
    return { authorized: false, error: e?.message || 'Acceso no autorizado.' };
  }
}

export async function blockGuestFromSocialEvent(
  fiestaId: string,
  input: {
    authorName?: string;
    guestId?: string;
    dispositivoId?: string;
    postId?: string;
    reason?: string;
  },
  modToken?: string,
): Promise<{ success: boolean; blocked?: BlockedSocialGuest; error?: string }> {
  try {
    if (!modToken && !(await hasAppSession())) {
      return { success: false, error: 'Se requiere sesión del equipo o enlace de moderación.' };
    }
    const access = await resolveModerationAccess(fiestaId, modToken);
    if (!access.authorized) {
      return { success: false, error: access.error };
    }

    const entry: BlockedSocialGuest = {
      id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      fiestaId,
      blockedAt: new Date().toISOString(),
      blockedBy: access.role === 'family' ? 'Familiar Moderador' : 'Equipo AK',
    };
    const cleanAuthor = sanitizeSocialText(input.authorName);
    if (cleanAuthor) {
      entry.authorName = cleanAuthor;
      entry.normalizedAuthorName = normalizeBlockedAuthorName(cleanAuthor);
    }
    const cleanGuestId = input.guestId?.trim();
    if (cleanGuestId) {
      entry.guestId = cleanGuestId;
    }
    const cleanDispositivoId = input.dispositivoId?.trim();
    if (cleanDispositivoId) {
      entry.dispositivoId = cleanDispositivoId;
    }
    const cleanReason = sanitizeSocialText(input.reason);
    if (cleanReason) {
      entry.reason = cleanReason;
    }

    if (sinBaseDisponible()) {
      const list = await getBlockedList(fiestaId);
      await writeData(`social-gallery/blocked-${fiestaId}.json`, [entry, ...list]);
      if (input.postId) {
        const posts = await readData<SocialGalleryPost[]>('social-gallery/metadata.json', []);
        const hasTarget = posts.some((p) => p.id === input.postId && p.fiestaId === fiestaId);
        if (hasTarget) {
          await writeData(
            'social-gallery/metadata.json',
            posts.map((p) =>
              p.id === input.postId && p.fiestaId === fiestaId
                ? { ...p, moderationStatus: 'hidden' as const }
                : p,
            ),
          );
          await eliminarCarasDePostEnIndice(fiestaId, input.postId);
        }
      }
    } else {
      const db = await getDb();
      await db.collection(BLOCKED_GUESTS_COLLECTION).doc(entry.id).set(entry);
      if (input.postId) {
        const postRef = db.collection(GALLERY_COLLECTION).doc(input.postId);
        const snap = await postRef.get();
        if (snap.exists && (snap.data() as SocialGalleryPost)?.fiestaId === fiestaId) {
          await postRef.update({
            moderationStatus: 'hidden',
            moderatedAt: entry.blockedAt,
            moderatedBy: entry.blockedBy,
          });
          await eliminarCarasDePostEnIndice(fiestaId, input.postId);
        }
      }
    }

    return { success: true, blocked: entry };
  } catch (e: any) {
    return { success: false, error: e?.message || 'No se pudo bloquear al invitado.' };
  }
}

export async function unblockGuestFromSocialEvent(
  fiestaId: string,
  blockId: string,
  modToken?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!modToken && !(await hasAppSession())) {
      return { success: false, error: 'Se requiere sesión del equipo o enlace de moderación.' };
    }
    const access = await resolveModerationAccess(fiestaId, modToken);
    if (!access.authorized) {
      return { success: false, error: access.error };
    }

    if (sinBaseDisponible()) {
      const list = await getBlockedList(fiestaId);
      await writeData(
        `social-gallery/blocked-${fiestaId}.json`,
        list.filter((item) => item.id !== blockId),
      );
      return { success: true };
    }

    const db = await getDb();
    const ref = db.collection(BLOCKED_GUESTS_COLLECTION).doc(blockId);
    const snap = await ref.get();
    if (snap.exists && (snap.data() as BlockedSocialGuest)?.fiestaId === fiestaId) {
      await ref.delete();
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'No se pudo desbloquear al invitado.' };
  }
}

export async function generarEnlaceModeradorFamiliar(
  fiestaId: string,
): Promise<{ success: boolean; url?: string; token?: string; expiresAt?: string; error?: string }> {
  try {
    await requireAppSession();
    const fiesta = await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    const expiresAtMs = computePartyExpirationMs(fiesta);
    if (expiresAtMs <= Date.now()) {
      return { success: false, error: 'La fiesta ya finalizó o fue cancelada.' };
    }
    const token = createFamilyModeratorToken(fiestaId, expiresAtMs);
    const url = `/evento/moderacion/${encodeURIComponent(fiestaId)}?modToken=${encodeURIComponent(token)}`;
    return {
      success: true,
      url,
      token,
      expiresAt: new Date(expiresAtMs).toISOString(),
    };
  } catch (e: any) {
    return { success: false, error: e?.message || 'No se pudo generar el enlace temporal.' };
  }
}

export async function requestMobilePrint(
  fiestaId: string,
  postId: string,
  input: {
    guestId?: string;
    guestAccessToken?: string;
    dispositivoId?: string;
    authorName?: string;
  } = {},
): Promise<{ success: boolean; request?: MobilePrintRequest; error?: string }> {
  try {
    const cleanGuestId = input.guestId?.trim();
    const identityKey = cleanGuestId || input.dispositivoId?.trim() || input.authorName?.trim() || 'guest';
    await enforcePublicRateLimit({
      scope: 'social-mobile-print',
      identity: `${fiestaId}:${identityKey}`,
      limit: 15,
      windowMs: 60_000,
    });

    const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
    if (!isZonaDigitalFeatureEnabled(fiesta.zonaDigitalAdolescentes, 'impresion_desde_celular')) {
      return {
        success: false,
        error: 'La impresión desde el celular no está habilitada para este evento.',
      };
    }

    let post: SocialGalleryPost | undefined;
    if (sinBaseDisponible()) {
      const localPosts = await getLocalSocialPosts(fiestaId);
      post = localPosts.find((p) => p.id === postId && p.fiestaId === fiestaId);
    } else {
      const db = await getDb();
      const snap = await db.collection(GALLERY_COLLECTION).doc(postId).get();
      if (snap.exists) {
        const data = snap.data() as SocialGalleryPost;
        if (data.fiestaId === fiestaId) post = data;
      }
    }

    if (!post) {
      return { success: false, error: 'Foto no encontrada en este evento.' };
    }

    const existingQueue = await getPrintQueue(fiestaId);
    const requesterName = sanitizeSocialText(input.authorName || post.authorName || 'Invitado') || 'Invitado';

    const alreadyQueued = existingQueue.find((req) => {
      if (req.postId !== postId || req.status === 'printed') return false;
      if (cleanGuestId && req.guestId) return req.guestId === cleanGuestId;
      return req.requestedBy.toLowerCase() === requesterName.toLowerCase();
    });
    if (alreadyQueued) {
      return { success: true, request: alreadyQueued };
    }

    const postForLimit: SocialGalleryPost = {
      ...post,
      authorName: requesterName,
    };
    if (cleanGuestId && !postForLimit.guestId) {
      postForLimit.guestId = cleanGuestId;
    }

    const maxImpresiones = fiesta.socialGallerySettings?.maxImpresionesPorPersona ?? 2;
    const limitResult = evaluateMobilePrintLimit(postForLimit, existingQueue, maxImpresiones);
    if (!limitResult.allowed) {
      return { success: false, error: limitResult.reason || 'No se puede imprimir esta foto.' };
    }

    const nextTicketNumber =
      existingQueue.reduce((max, item) => Math.max(max, item.ticketNumber || 0), 0) + 1;

    const request: MobilePrintRequest = {
      id: `print_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      fiestaId,
      postId: post.id,
      imageUrl: post.imageUrl,
      authorName: post.authorName,
      requestedBy: requesterName,
      ticketNumber: nextTicketNumber,
      status: 'queued',
      createdAt: new Date().toISOString(),
    };
    if (cleanGuestId) {
      request.guestId = cleanGuestId;
    }

    if (sinBaseDisponible()) {
      await writeData(`social-gallery/print-queue-${fiestaId}.json`, [...existingQueue, request]);
    } else {
      const db = await getDb();
      await db.collection(PRINT_QUEUE_COLLECTION).doc(request.id).set(request);
    }

    return { success: true, request };
  } catch (e: any) {
    return { success: false, error: e?.message || 'No se pudo enviar el pedido de impresión.' };
  }
}

export async function getMobilePrintQueueForStation(
  fiestaId: string,
): Promise<{ success: boolean; queue: MobilePrintRequest[]; error?: string }> {
  try {
    await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    const queue = await getPrintQueue(fiestaId);
    return { success: true, queue };
  } catch (e: any) {
    return { success: false, queue: [], error: e?.message || 'Acceso no autorizado.' };
  }
}

export async function updateMobilePrintStatus(
  fiestaId: string,
  requestId: string,
  status: 'queued' | 'ready' | 'printed',
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAppSession();
    await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    const updatedAt = new Date().toISOString();

    if (sinBaseDisponible()) {
      const queue = await getPrintQueue(fiestaId);
      const exists = queue.some((item) => item.id === requestId && item.fiestaId === fiestaId);
      if (!exists) return { success: false, error: 'Pedido de impresión no encontrado.' };
      const updated = queue.map((item) =>
        item.id === requestId ? { ...item, status, updatedAt } : item,
      );
      await writeData(`social-gallery/print-queue-${fiestaId}.json`, updated);
      return { success: true };
    }

    const db = await getDb();
    const ref = db.collection(PRINT_QUEUE_COLLECTION).doc(requestId);
    const snap = await ref.get();
    if (!snap.exists || (snap.data() as MobilePrintRequest)?.fiestaId !== fiestaId) {
      return { success: false, error: 'Pedido de impresión no encontrado.' };
    }
    await ref.update({ status, updatedAt });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'No se pudo actualizar el turno.' };
  }
}

export async function getMyMobilePrintRequests(
  fiestaId: string,
  filter?: { guestId?: string; authorName?: string },
): Promise<MobilePrintRequest[]> {
  try {
    const queue = await getPrintQueue(fiestaId);
    if (!filter?.guestId && !filter?.authorName) {
      return queue;
    }
    const cleanGuestId = filter.guestId?.trim();
    const cleanAuthor = filter.authorName?.trim().toLowerCase();
    return queue.filter((item) => {
      if (cleanGuestId && item.guestId) return item.guestId === cleanGuestId;
      if (cleanAuthor) return item.requestedBy.toLowerCase() === cleanAuthor;
      return false;
    });
  } catch {
    return [];
  }
}

export async function recordGuestPresence(
  fiestaId: string,
  input: {
    guestId?: string;
    guestAccessToken?: string;
    dispositivoId?: string | null;
    tableNumber?: string;
  } = {},
): Promise<{ success: boolean }> {
  try {
    const cleanGuestId = input.guestId?.trim();
    const cleanDispositivo = input.dispositivoId?.trim();
    const rateId = cleanGuestId || cleanDispositivo || 'anon';
    await enforcePublicRateLimit({
      scope: 'social-guest-presence',
      identity: `${fiestaId}:${rateId}`,
      limit: 30,
      windowMs: 60_000,
    });

    const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
    if (!fiesta) return { success: false };

    const guest = cleanGuestId
      ? fiesta.invitados?.find((item) => item.id === cleanGuestId)
      : undefined;
    const guestAuthorized = Boolean(
      cleanGuestId && hasPublicGuestAccess(guest, cleanGuestId, input.guestAccessToken || ''),
    );

    let visitorKey: string;
    if (guestAuthorized && cleanGuestId) {
      visitorKey = `g:${cleanGuestId}`;
    } else if (cleanDispositivo) {
      visitorKey = `d:${cleanDispositivo}`;
    } else {
      return { success: false };
    }

    const nowIso = new Date().toISOString();
    const cleanTable = sanitizeSocialText(input.tableNumber) || guest?.tableNumber?.trim();

    if (sinBaseDisponible()) {
      const list = await readData<GuestPresenceRecord[]>(`social-gallery/presences-${fiestaId}.json`, []);
      const existing = list.find((p) => p.visitorKey === visitorKey);
      const record: GuestPresenceRecord = {
        visitorKey,
        fiestaId,
        firstSeenAt: existing?.firstSeenAt || nowIso,
        lastSeenAt: nowIso,
      };
      if (guestAuthorized && cleanGuestId) record.guestId = cleanGuestId;
      if (cleanTable) record.tableNumber = cleanTable;
      else if (existing?.tableNumber) record.tableNumber = existing.tableNumber;

      await writeData(
        `social-gallery/presences-${fiestaId}.json`,
        [record, ...list.filter((p) => p.visitorKey !== visitorKey)],
      );
      return { success: true };
    }

    const db = await getDb();
    const docId = `${fiestaId}__${visitorKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const ref = db.collection(PRESENCE_COLLECTION).doc(docId);
    const snap = await ref.get();
    const prev = snap.exists ? (snap.data() as GuestPresenceRecord) : undefined;
    const record: GuestPresenceRecord = {
      visitorKey,
      fiestaId,
      firstSeenAt: prev?.firstSeenAt || nowIso,
      lastSeenAt: nowIso,
    };
    if (guestAuthorized && cleanGuestId) record.guestId = cleanGuestId;
    if (cleanTable) record.tableNumber = cleanTable;
    else if (prev?.tableNumber) record.tableNumber = prev.tableNumber;

    await ref.set(record);
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function completarNotasAlbum(
  fiestaId: string,
  limit: number = 5,
): Promise<{ updatedPosts: SocialGalleryPost[]; frenadoPorTope?: boolean }> {
  try {
    if (!(await hasAppSession())) {
      return { updatedPosts: [] };
    }
    const posts = soloAprobados(await getAllEventPosts(fiestaId));
    const res = await completarNotasAlbumEnTandas({
      posts,
      tamanoTanda: Math.max(1, Math.min(10, limit)),
      maxTandas: 1,
      evaluarPost: async (post) => {
        if (!post.imageUrl) return null;
        return evaluarImagenConDecisionesRapidas({ url: post.imageUrl }, post.caption || post.dedication);
      },
    });

    if (res.actualizados.length > 0) {
      if (sinBaseDisponible()) {
        const all = await readData<SocialGalleryPost[]>('social-gallery/metadata.json', []);
        const byId = new Map(res.actualizados.map((u) => [u.id, u]));
        await writeData(
          'social-gallery/metadata.json',
          all.map((p) => byId.get(p.id) ?? p),
        );
      } else {
        const db = await getDb();
        await Promise.all(
          res.actualizados.map((u) =>
            db.collection(GALLERY_COLLECTION).doc(u.id).update({ iaRevision: u.iaRevision }),
          ),
        );
      }
    }

    return { updatedPosts: res.actualizados, frenadoPorTope: res.frenadoPorTope };
  } catch {
    return { updatedPosts: [] };
  }
}

export async function clearGallery(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAppSession();
    await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    const db = await getDb();
    const snapshot = await db
      .collection(GALLERY_COLLECTION)
      .where('fiestaId', '==', fiestaId)
      .get();

    // Delete Storage files (failures are non-fatal)
    await Promise.allSettled(
      snapshot.docs.map((doc: QueryDocumentSnapshot) => deleteFromStorage((doc.data() as SocialGalleryPost).imageUrl))
    );

    // Batch-delete Firestore documents (max 450 per batch)
    const BATCH_SIZE = 450;
    for (let i = 0; i < snapshot.docs.length; i += BATCH_SIZE) {
      const batch = db.batch();
      snapshot.docs.slice(i, i + BATCH_SIZE).forEach((doc: QueryDocumentSnapshot) => batch.delete(doc.ref));
      await batch.commit();
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export interface PhotoZipItem {
  id?: string;
  path: string;
  imageUrl?: string;
  name: string;
  moderationStatus: 'approved' | 'pending' | 'hidden';
  approved?: boolean;
  authorName?: string;
  source?: string;
  sourceModule?: string;
  mediaType?: 'image' | 'video';
  caption?: string;
}

export async function getPhotoFilePathsForZip(
  fiestaId: string
): Promise<{
  photos: PhotoZipItem[];
  stats: {
    total: number;
    approved: number;
    pending: number;
    hidden: number;
  };
}> {
  try {
    await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    const db = await getDb();
    const snapshot = await db
      .collection(GALLERY_COLLECTION)
      .where('fiestaId', '==', fiestaId)
      .get();

    let approved = 0;
    let pending = 0;
    let hidden = 0;

    const photos: PhotoZipItem[] = snapshot.docs.map((doc: QueryDocumentSnapshot) => {
      const data = doc.data() as SocialGalleryPost;
      const status = (data.moderationStatus || 'approved') as 'approved' | 'pending' | 'hidden';
      if (status === 'approved') approved++;
      else if (status === 'pending') pending++;
      else if (status === 'hidden') hidden++;

      let name: string;
      try {
        name = new URL(data.imageUrl).pathname.split('/').filter(Boolean).pop() || data.id;
      } catch {
        name = data.id;
      }
      return {
        id: data.id || doc.id,
        path: data.imageUrl,
        imageUrl: data.imageUrl,
        name,
        moderationStatus: status,
        approved: status === 'approved',
        authorName: data.authorName,
        source: data.source,
        sourceModule: data.sourceModule,
        mediaType: data.mediaType,
        caption: data.caption,
      };
    });

    return {
      photos,
      stats: {
        total: photos.length,
        approved,
        pending,
        hidden,
      },
    };
  } catch (e) {
    // Un error de lectura no es "no hay fotos": se lanza para que la ruta responda error.
    logger.warn('[social-gallery] getPhotoFilePathsForZip failed:', e);
    throw e;
  }
}

// ──────────────────── Live Chat ────────────────────

export async function getChatMessages(fiestaId: string): Promise<ChatMessage[]> {
  try {
    // Sin base (modo local) no hay donde se hayan guardado: vacío es la verdad, no una falla.
    if (sinBaseDisponible()) return [];
    const db = await getDb();
    const snapshot = await db
      .collection(CHAT_COLLECTION)
      .where('fiestaId', '==', fiestaId)
      .get();
    return snapshot.docs
      .map((doc: QueryDocumentSnapshot) => doc.data() as ChatMessage)
      .sort((a: ChatMessage, b: ChatMessage) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch (e) {
    // Una falla de lectura no es "chat vacío": se lanza.
    logger.warn('[social-gallery] getChatMessages failed:', e);
    throw e;
  }
}

export async function addChatMessage(
  fiestaId: string,
  text: string,
  authorName: string = 'Anónimo',
  credentials: SocialInteractionCredentials = {},
  opciones?: { idIntento?: string },
): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
  if (!fiestaId || !text.trim()) {
    return { success: false, error: 'Datos del mensaje incompletos.' };
  }
  try {
    const context = await resolveSocialInteractionContext(fiestaId, authorName, credentials);
    if (!context) return { success: false, error: 'Acceso no autorizado para participar del chat.' };
    if (context.fiesta.socialGallerySettings?.enabled === false || context.fiesta.socialGallerySettings?.chatEnabled === false) {
      return { success: false, error: 'El chat no está habilitado para este evento.' };
    }
    const resolvedAuthorName = context.access.authorName;
    const review = reviewSocialContent({ type: 'text', text, authorName: resolvedAuthorName, moderationMode: 'automatico' });
    if (review.status === 'blocked') return { success: false, error: review.message };
    await enforcePublicRateLimit({
      scope: 'social-live-chat',
      identity: context.access.rateIdentity,
      limit: 30,
      windowMs: 60_000,
    });
    const db = await getDb();
    // Pregunta 58: si la respuesta se perdio y el invitado reintenta, el mensaje ya esta con ese id.
    const idDeLaPantalla = idDelIntento('chat', opciones?.idIntento);
    const msgId = idDeLaPantalla ?? `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newMessage: ChatMessage = {
      id: msgId,
      fiestaId,
      authorName: sanitizeSocialText(resolvedAuthorName) || 'Anónimo',
      text: review.sanitizedText || sanitizeSocialText(text),
      timestamp: new Date().toISOString(),
    };
    // Single-document write — safe for many concurrent senders.
    try {
      await (idDeLaPantalla ? db.collection(CHAT_COLLECTION).doc(msgId).create(newMessage) : db.collection(CHAT_COLLECTION).doc(msgId).set(newMessage));
    } catch (e) {
      if (!esIdYaExistente(e)) throw e;
      const previo = await db.collection(CHAT_COLLECTION).doc(msgId).get();
      return { success: true, message: (previo.data() as ChatMessage) ?? newMessage };
    }
    return { success: true, message: newMessage };
  } catch {
    return { success: false, error: 'No se pudo guardar el mensaje en el chat.' };
  }
}

export async function saveSocialSettingsByClient(
  fiestaId: string,
  accessKey: string,
  settings: Partial<SocialGallerySettings>,
  mobileControlCoverUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getClientSocialFiesta(fiestaId, accessKey);
    if (!fiesta) return { success: false, error: 'Sesión del portal no autorizada.' };
    const updatedSettings = {
      ...(fiesta.socialGallerySettings || {
        enabled: true,
        allowLikes: true,
        allowComments: true,
        uploadsActive: true,
        chatEnabled: true,
        showSongRequests: true,
        showDedications: true
      }),
      ...settings
    } as SocialGallerySettings;
    const updatedFiesta = {
      ...fiesta,
      socialGallerySettings: updatedSettings
    };
    if (mobileControlCoverUrl !== undefined) {
      updatedSettings.mobileControlCoverUrl = mobileControlCoverUrl;
    }
    const result = await saveFiesta(updatedFiesta);
    return result.success
      ? { success: true }
      : { success: false, error: result.error || 'No se pudieron guardar los ajustes.' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al guardar.' };
  }
}

export async function moderateSocialPostByClient(
  fiestaId: string,
  accessKey: string,
  postId: string,
  moderationStatus: 'pending' | 'approved' | 'hidden'
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getClientSocialFiesta(fiestaId, accessKey);
    if (!fiesta) return { success: false, error: 'Sesión del portal no autorizada.' };
    const db = await getDb();
    const ref = db.collection(GALLERY_COLLECTION).doc(postId);
    const snap = await ref.get();
    if (!snap.exists) return { success: false, error: 'Publicación no encontrada.' };

    // Validate that the post belongs to this event
    const postData = snap.data();
    if (postData?.fiestaId !== fiestaId) {
      return { success: false, error: 'La publicación no pertenece a este evento.' };
    }

    await ref.update({
      moderationStatus,
      moderatedAt: new Date().toISOString(),
      moderatedBy: 'Cliente Portal',
    });
    if (moderationStatus === 'hidden') {
      await eliminarCarasDePostEnIndice(fiestaId, postId);
    } else if (moderationStatus === 'approved') {
      await evaluarCarasDePostRecienAprobado(fiestaId, postId);
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al moderar.' };
  }
}

export async function createSocialMediaPostFromUrl(
  input: CreateSocialMediaPostFromUrlInput,
): Promise<{ success: boolean; post?: SocialGalleryPost; error?: string }> {
  await requireEventPermission(input.fiestaId, PERMISOS.NOCHE);
  // La identidad fija es sólo para las estaciones: acá no se acepta la que mande el que llama.
  const { postId: _sinIdentidad, ...sinIdentidad } = input;
  void _sinIdentidad;
  return persistSocialMediaPostFromUrl(sinIdentidad);
}

export async function createSocialMediaPostFromUrlForStation(
  input: CreateSocialMediaPostFromUrlInput & { sourceModule: string },
  accessToken: string,
): Promise<{ success: boolean; post?: SocialGalleryPost; error?: string; bloqueado?: boolean }> {
  if (
    !isEntertainmentModuleId(input.sourceModule) ||
    !verifyEntertainmentAccessToken(accessToken, input.fiestaId, input.sourceModule, 'guest')
  ) {
    return { success: false, error: 'Acceso de estación no autorizado.' };
  }
  const postId = input.postId && /^post_ent_[A-Za-z0-9_-]{1,80}$/.test(input.postId) ? input.postId : undefined;
  return persistSocialMediaPostFromUrl({
    ...input,
    postId,
    source: 'entertainment',
  });
}

export async function getPublicInstagramFeedAction() {
  const { getPublicInstagramFeed } = await import('@/lib/instagram/public-feed');
  return getPublicInstagramFeed();
}

function samePhoneDigits(a?: string | null, b?: string | null): boolean {
  const normA = normalizeUruguayPhone(a);
  const normB = normalizeUruguayPhone(b);
  if (normA && normB && normA === normB) return true;
  const digitsA = String(a || '').replace(/\D/g, '');
  const digitsB = String(b || '').replace(/\D/g, '');
  return digitsA.length >= 7 && digitsB.length >= 7 && digitsA === digitsB;
}

async function eliminarCarasDePostEnIndice(fiestaId: string, postId: string): Promise<void> {
  if (!fiestaId || !postId) return;
  try {
    const res = await actualizarFiesta(
      fiestaId,
      (fiesta) => {
        const actuales = fiesta.carasIndexadas || [];
        const filtradas = quitarCarasDeFoto(actuales, postId);
        if (filtradas.length === actuales.length) return fiesta;
        return {
          ...fiesta,
          carasIndexadas: filtradas,
        };
      },
      { publicRsvp: true },
    );
    if (!res.success) {
      logger.warn('[social-gallery] No se pudieron eliminar caras del índice al ocultar/borrar post:', res.error);
    }
  } catch (err) {
    logger.warn('[social-gallery] Error quitando caras de foto oculta:', err);
  }
}

async function purgarVectoresInvitadosSiExpiraron(
  fiesta: FiestaEnPlanificacion,
  ahoraMs: number = Date.now(),
): Promise<boolean> {
  if (!vectorInvitadoExpirado(fiesta.configuracion?.fechaEvento, ahoraMs)) {
    return false;
  }
  const tieneVectores = Boolean(
    fiesta.vectoresCarasInvitados && Object.keys(fiesta.vectoresCarasInvitados).length > 0,
  );
  if (tieneVectores) {
    const res = await actualizarFiesta(
      fiesta.id,
      (actual) => ({ ...actual, vectoresCarasInvitados: {} }),
      { publicRsvp: true },
    );
    if (!res.success) {
      logger.warn('[social-gallery] No se pudieron purgar vectores expirados:', res.error);
    }
  }
  return true;
}

async function evaluarCarasDePostRecienAprobado(fiestaId: string, postId: string): Promise<void> {
  try {
    const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
    if (!fiesta?.carasIndexadas?.length) return;
    const carasDelPost = fiesta.carasIndexadas.filter((c) => c.fotoId === postId);
    if (carasDelPost.length > 0) {
      await procesarNotificacionesTandaFotos(fiestaId, carasDelPost);
    }
  } catch (err) {
    logger.warn('[social-gallery] Error evaluando caras de post recién aprobado:', err);
  }
}

async function obtenerTelefonosExcluidosWhatsapp(): Promise<{
  personales: string[];
  empleados: string[];
  bajasPorTelefono: Set<string>;
}> {
  const [waConfigRaw, extraPersonales, empleadosRaw, conversacionesRaw, bajasRaw] = await Promise.all([
    readData<Partial<WhatsAppConfig>>('whatsapp-config.json', {}).catch((err) => {
      logger.warn('[social-gallery] No se pudo leer whatsapp-config.json:', err);
      return {} as Partial<WhatsAppConfig>;
    }),
    readData<string[]>('whatsapp-numeros-personales.json', []).catch((err) => {
      logger.warn('[social-gallery] No se pudo leer whatsapp-numeros-personales.json:', err);
      return [] as string[];
    }),
    readData<Empleado[]>('empleados.json', []).catch((err) => {
      logger.warn('[social-gallery] No se pudo leer empleados.json:', err);
      return [] as Empleado[];
    }),
    readData<WhatsAppConversation[]>('whatsapp-conversations.json', []).catch((err) => {
      logger.warn('[social-gallery] No se pudo leer whatsapp-conversations.json:', err);
      return [] as WhatsAppConversation[];
    }),
    readData<string[]>('whatsapp-fotos-bajas.json', []).catch((err) => {
      logger.warn('[social-gallery] No se pudo leer whatsapp-fotos-bajas.json:', err);
      return [] as string[];
    }),
  ]);

  const personales = [
    ...(Array.isArray(waConfigRaw?.numerosPersonales) ? waConfigRaw.numerosPersonales : []),
    ...(Array.isArray(extraPersonales) ? extraPersonales : []),
  ].filter(Boolean);

  const empleados = (Array.isArray(empleadosRaw) ? empleadosRaw : [])
    .map((e) => e?.telefono)
    .filter((t): t is string => Boolean(t));

  const bajasPorTelefono = new Set<string>();
  for (const tel of Array.isArray(bajasRaw) ? bajasRaw : []) {
    const norm = normalizeUruguayPhone(tel) || String(tel || '').replace(/\D/g, '');
    if (norm) bajasPorTelefono.add(norm);
  }
  for (const conv of Array.isArray(conversacionesRaw) ? conversacionesRaw : []) {
    const msgs = Array.isArray(conv?.messages) ? conv.messages : [];
    const pidioBaja = msgs.some((m) => m?.from === 'client' && esRespuestaBajaWhatsapp(m?.content));
    if (pidioBaja && conv?.clientPhone) {
      const norm = normalizeUruguayPhone(conv.clientPhone) || conv.clientPhone.replace(/\D/g, '');
      if (norm) bajasPorTelefono.add(norm);
    }
  }

  return { personales, empleados, bajasPorTelefono };
}

function calcularFotosNuevasPorInvitado(params: {
  fiesta: FiestaEnPlanificacion;
  carasTanda: readonly CaraEnFoto[];
  approvedPostIds: ReadonlySet<string>;
  expirado: boolean;
}): Map<string, Set<string>> {
  const { fiesta, carasTanda, approvedPostIds, expirado } = params;
  const carasAprobadasTanda = carasTanda.filter(
    (c) => approvedPostIds.size === 0 || approvedPostIds.has(c.fotoId),
  );
  const todasCarasAprobadas = (fiesta.carasIndexadas || []).filter(
    (c) => approvedPostIds.size === 0 || approvedPostIds.has(c.fotoId),
  );
  const personasAgrupadas = aplicarAsignacionesAPersonas(
    agruparEnPersonas(todasCarasAprobadas, { minimoDeApariciones: 1 }),
    fiesta.asignacionesCaras,
  );

  const mapa = new Map<string, Set<string>>();
  const agregar = (guestId: string, fotoId: string) => {
    if (!guestId || !fotoId) return;
    let set = mapa.get(guestId);
    if (!set) {
      set = new Set<string>();
      mapa.set(guestId, set);
    }
    set.add(fotoId);
  };

  if (!expirado && fiesta.vectoresCarasInvitados && carasAprobadasTanda.length > 0) {
    for (const [guestId, entry] of Object.entries(fiesta.vectoresCarasInvitados)) {
      if (!entry?.vector?.length) continue;
      const res = buscarFotosDeUnaCara([entry.vector], carasAprobadasTanda);
      for (const fotoId of res.seguras) {
        agregar(guestId, fotoId);
      }
    }
  }

  const asignaciones = Object.values(fiesta.asignacionesCaras || {});
  if (asignaciones.length > 0 && carasAprobadasTanda.length > 0) {
    for (const persona of personasAgrupadas) {
      if (!persona.invitadoId) continue;
      const res = buscarFotosDeUnaCara([persona.representante.vector], carasAprobadasTanda);
      for (const fotoId of res.seguras) {
        agregar(persona.invitadoId, fotoId);
      }
      for (const fotoId of persona.fotoIds) {
        if (carasAprobadasTanda.some((c) => c.fotoId === fotoId)) {
          agregar(persona.invitadoId, fotoId);
        }
      }
    }
  }

  return mapa;
}

async function procesarNotificacionesTandaFotos(
  fiestaId: string,
  carasTanda: readonly CaraEnFoto[],
  opciones: { ahoraMs?: number; baseUrl?: string } = {},
): Promise<{ pushEnviados: number; whatsappEnviados: number }> {
  const ahoraMs = opciones.ahoraMs ?? Date.now();
  const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
  if (!fiesta) return { pushEnviados: 0, whatsappEnviados: 0 };

  const expirado = await purgarVectoresInvitadosSiExpiraron(fiesta, ahoraMs);
  if (expirado) {
    return { pushEnviados: 0, whatsappEnviados: 0 };
  }

  const allPosts = await getAllEventPosts(fiestaId).catch((err) => {
    logger.warn('[social-gallery] No se pudieron leer posts al evaluar notificaciones:', err);
    return [] as SocialGalleryPost[];
  });
  const approvedPostIds = new Set(
    allPosts.filter((p) => esAprobadoParaMostrar(p)).map((p) => p.id),
  );
  // Si ya hay posts cargados para la fiesta y todos quedaron ocultos/pendientes, no notificar nada.
  if (allPosts.length > 0 && approvedPostIds.size === 0) {
    return { pushEnviados: 0, whatsappEnviados: 0 };
  }

  const fotosPorInvitado = calcularFotosNuevasPorInvitado({
    fiesta,
    carasTanda,
    approvedPostIds: allPosts.length > 0 ? approvedPostIds : new Set<string>(),
    expirado,
  });

  if (fotosPorInvitado.size === 0) {
    return { pushEnviados: 0, whatsappEnviados: 0 };
  }

  const whatsappActivo = fiesta.socialGallerySettings?.whatsappFotosInvitadosActivo === true;
  const excluidos = whatsappActivo ? await obtenerTelefonosExcluidosWhatsapp() : null;
  let waConfig: WhatsAppConfig | null = null;
  if (whatsappActivo) {
    waConfig = await getWhatsAppConfig(WHATSAPP_WEBHOOK_INTERNAL_TOKEN).catch((err) => {
      logger.warn('[social-gallery] No se pudo leer configuración de WhatsApp:', err);
      return null;
    });
  }

  const nombreEvento = fiesta.configuracion?.nombreEvento || 'la fiesta';
  const baseUrl = opciones.baseUrl || process.env.NEXT_PUBLIC_APP_URL || '';

  let pushEnviados = 0;
  let whatsappEnviados = 0;
  const pushNuevosPorGuest = new Map<string, string[]>();
  const waNuevosPorGuest = new Map<string, { fotoIds: string[]; enviadoAt: string }>();

  for (const invitado of fiesta.invitados || []) {
    const coincidencias = fotosPorInvitado.get(invitado.id);
    if (!coincidencias || coincidencias.size === 0) continue;

    const yaNotifPush = new Set(invitado.fotosYaNotificadasPush || []);
    const nuevasPush = [...coincidencias].filter((id) => !yaNotifPush.has(id));
    if (nuevasPush.length > 0) {
      const cantidad = nuevasPush.length;
      const body = cantidad === 1
        ? 'Aparecés en 1 foto nueva'
        : `Aparecés en ${cantidad} fotos nuevas`;
      const guestPath = `/portal-invitado/${encodeURIComponent(fiestaId)}/${encodeURIComponent(invitado.id)}${
        invitado.guestAccessToken ? `?token=${encodeURIComponent(invitado.guestAccessToken)}` : ''
      }#mis-fotos`;
      const pushRes = await sendNotificationToTargets(
        { guestIds: [invitado.id], fiestaId },
        {
          title: `${nombreEvento} 📸`,
          body,
          url: baseUrl ? `${baseUrl}${guestPath}` : guestPath,
          data: { fiestaId, guestId: invitado.id, cantidad: String(cantidad) },
        },
      );
      if (pushRes.success) {
        pushEnviados += 1;
        pushNuevosPorGuest.set(invitado.id, nuevasPush);
      } else {
        logger.warn('[social-gallery] No se pudo enviar push de fotos nuevas:', pushRes.error);
      }
    }

    if (whatsappActivo && excluidos) {
      if (invitado.rsvp === 'Rechazado' || invitado.whatsappFotosBaja) continue;
      const rawPhone = invitado.contacto?.trim();
      const digits = String(rawPhone || '').replace(/\D/g, '');
      if (!rawPhone || digits.length < 8) continue;

      const esPersonalOEmpleado =
        excluidos.personales.some((n) => samePhoneDigits(n, rawPhone)) ||
        excluidos.empleados.some((n) => samePhoneDigits(n, rawPhone));
      if (esPersonalOEmpleado) continue;

      const normPhone = normalizeUruguayPhone(rawPhone) || digits;
      if (excluidos.bajasPorTelefono.has(normPhone)) continue;

      const ultimoMs = invitado.ultimoWhatsappFotosAt ? Date.parse(invitado.ultimoWhatsappFotosAt) : NaN;
      if (Number.isFinite(ultimoMs) && ahoraMs - ultimoMs < VENTANA_WHATSAPP_FOTOS_MS) {
        continue;
      }

      const yaNotifWa = new Set(invitado.fotosYaNotificadasWhatsapp || []);
      const nuevasWa = [...coincidencias].filter((id) => !yaNotifWa.has(id));
      if (nuevasWa.length === 0) continue;

      const apiToken = waConfig?.apiKey?.trim() || process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_API_TOKEN || '';
      const phoneNumberId =
        waConfig?.phoneNumberId?.trim() || process.env.META_WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || '';
      if (waConfig && waConfig.enabled === false && Boolean(waConfig.apiKey?.trim())) {
        continue;
      }

      const misFotosPath = `/portal-invitado/${encodeURIComponent(fiestaId)}/${encodeURIComponent(invitado.id)}${
        invitado.guestAccessToken ? `?token=${encodeURIComponent(invitado.guestAccessToken)}` : ''
      }#mis-fotos`;
      const linkMisFotos = baseUrl ? `${baseUrl}${misFotosPath}` : misFotosPath;
      const texto = armarMensajeWhatsappFotos({
        nombre: invitado.nombre,
        cantidad: nuevasWa.length,
        nombreEvento,
        linkMisFotos,
      });

      const waRes = await sendMetaWhatsAppMessage({
        to: rawPhone,
        text: texto,
        apiToken,
        phoneNumberId,
      });
      if (waRes.success) {
        whatsappEnviados += 1;
        waNuevosPorGuest.set(invitado.id, {
          fotoIds: nuevasWa,
          enviadoAt: new Date(ahoraMs).toISOString(),
        });
      } else {
        logger.warn('[social-gallery] No se pudo enviar WhatsApp de fotos nuevas:', waRes.error);
      }
    }
  }

  if (pushNuevosPorGuest.size > 0 || waNuevosPorGuest.size > 0) {
    const saveRes = await actualizarFiesta(
      fiestaId,
      (actual) => ({
        ...actual,
        invitados: (actual.invitados || []).map((inv) => {
          const pNuevas = pushNuevosPorGuest.get(inv.id);
          const wInfo = waNuevosPorGuest.get(inv.id);
          if (!pNuevas && !wInfo) return inv;
          return {
            ...inv,
            ...(pNuevas
              ? {
                  fotosYaNotificadasPush: Array.from(
                    new Set([...(inv.fotosYaNotificadasPush || []), ...pNuevas]),
                  ),
                }
              : {}),
            ...(wInfo
              ? {
                  fotosYaNotificadasWhatsapp: Array.from(
                    new Set([...(inv.fotosYaNotificadasWhatsapp || []), ...wInfo.fotoIds]),
                  ),
                  ultimoWhatsappFotosAt: wInfo.enviadoAt,
                }
              : {}),
          };
        }),
      }),
      { publicRsvp: true },
    );
    if (!saveRes.success) {
      logger.warn('[social-gallery] No se pudo guardar historial de avisos de fotos:', saveRes.error);
    }
  }

  return { pushEnviados, whatsappEnviados };
}

export async function getCarasDeFiesta(fiestaId: string): Promise<CaraEnFoto[]> {
  try {
    const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
    if (!fiesta) return [];
    if (fiesta.socialGallerySettings?.modoCaras === 'apagado') return [];
    if (!fiesta.socialGallerySettings?.carasPreparadas && !fiesta.carasIndexadas?.length) {
      return [];
    }
    const baseCaras =
      fiesta.carasIndexadas && fiesta.carasIndexadas.length > 0
        ? fiesta.carasIndexadas
        : (await readData<CaraEnFoto[]>(`caras/${fiestaId}.json`, [])) || [];

    const posts = await getAllEventPosts(fiestaId).catch((err) => {
      logger.warn('[social-gallery] Error leyendo posts al filtrar caras:', err);
      return [] as SocialGalleryPost[];
    });
    const noAprobados = new Set(
      posts.filter((p) => !esAprobadoParaMostrar(p)).map((p) => p.id),
    );
    return baseCaras
      .filter((c) => Boolean(c?.fotoId) && Array.isArray(c?.vector) && !noAprobados.has(c.fotoId))
      .map((c) => ({
        fotoId: c.fotoId,
        vector: c.vector,
        ...(c.tamano !== undefined ? { tamano: c.tamano } : {}),
      }));
  } catch (err) {
    logger.warn('[social-gallery] Error al leer caras de fiesta:', err);
    return [];
  }
}

export async function guardarCarasDeFiesta(
  fiestaId: string,
  caras: CaraEnFoto[],
  opciones: {
    incremental?: boolean;
    guestId?: string;
    guestAccessToken?: string;
    stationModuleId?: string;
    stationAccessToken?: string;
    ahoraMs?: number;
    skipNotifications?: boolean;
  } = {},
): Promise<{ ok: boolean; error?: string }> {
  try {
    const appSession = await hasAppSession();
    const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
    if (!fiesta) return { ok: false, error: 'Fiesta no encontrada.' };

    if (!appSession) {
      await enforcePublicRateLimit({
        scope: 'social-guardar-caras',
        identity: `${fiestaId}:${opciones.guestId || opciones.stationModuleId || 'public'}`,
        limit: 60,
        windowMs: 60_000,
      });
      const guest = opciones.guestId
        ? fiesta.invitados?.find((item) => item.id === opciones.guestId)
        : undefined;
      const guestAuthorized = Boolean(
        opciones.guestId &&
          hasPublicGuestAccess(guest, opciones.guestId, opciones.guestAccessToken || ''),
      );
      const stationModuleId =
        opciones.stationModuleId && isEntertainmentModuleId(opciones.stationModuleId)
          ? opciones.stationModuleId
          : undefined;
      const stationAuthorized = Boolean(
        stationModuleId &&
          verifyEntertainmentAccessToken(
            opciones.stationAccessToken,
            fiestaId,
            stationModuleId,
            'guest',
          ),
      );
      if (!guestAuthorized && !stationAuthorized) {
        return { ok: false, error: 'Acceso no autorizado para actualizar caras.' };
      }
    }

    const limpias = (caras || [])
      .filter((c) => Boolean(c?.fotoId) && Array.isArray(c?.vector) && c.vector.length > 0)
      .map((c) => ({
        fotoId: c.fotoId,
        vector: [...c.vector],
        ...(c.tamano !== undefined ? { tamano: c.tamano } : {}),
      }));

    const saveRes = await actualizarFiesta(
      fiestaId,
      (actual) => {
        const siguientesCaras = opciones.incremental
          ? mezclarCarasPorFoto(actual.carasIndexadas || [], limpias)
          : limpias;
        return {
          ...actual,
          carasIndexadas: siguientesCaras,
          socialGallerySettings: {
            ...actual.socialGallerySettings,
            enabled: actual.socialGallerySettings?.enabled ?? true,
            allowLikes: actual.socialGallerySettings?.allowLikes ?? true,
            allowComments: actual.socialGallerySettings?.allowComments ?? true,
            uploadsActive: actual.socialGallerySettings?.uploadsActive ?? true,
            carasPreparadas: true,
            modoCaras: actual.socialGallerySettings?.modoCaras ?? 'grilla',
          },
        };
      },
      { publicRsvp: true },
    );
    if (!saveRes.success) {
      return { ok: false, error: saveRes.error };
    }

    if (!opciones.skipNotifications && limpias.length > 0) {
      await procesarNotificacionesTandaFotos(fiestaId, limpias, {
        ahoraMs: opciones.ahoraMs,
      });
    }

    return { ok: true };
  } catch (err: any) {
    logger.warn('[social-gallery] Error al guardar caras de fiesta:', err);
    return { ok: false, error: err?.message };
  }
}

export interface FotoFotografoImportInput {
  id?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  wfolioUrl?: string;
  momentTag?: string;
  authorName?: string;
  descriptors?: number[][];
  caras?: Array<{ vector: number[]; tamano?: number }>;
}

/**
 * Bloque 2: Importa un lote de fotos del fotógrafo (desde AK Editor / Centro de la fiesta)
 * con miniatura, enlace a Wfolio, momento y descriptores faciales de 128 números.
 */
export async function importarFotosFotografoConCaras(
  fiestaId: string,
  lote: FotoFotografoImportInput[],
  opciones: { ahoraMs?: number } = {},
): Promise<{
  success: boolean;
  importedCount: number;
  indexedFacesCount: number;
  pushEnviados?: number;
  whatsappEnviados?: number;
  error?: string;
}> {
  try {
    await requireAppSession();
    await requireEventPermission(fiestaId, PERMISOS.NOCHE);

    if (!Array.isArray(lote) || lote.length === 0) {
      return { success: false, importedCount: 0, indexedFacesCount: 0, error: 'El lote está vacío.' };
    }

    const postsNuevos: SocialGalleryPost[] = [];
    const carasNuevas: CaraEnFoto[] = [];
    const nowIso = new Date(opciones.ahoraMs ?? Date.now()).toISOString();

    for (let i = 0; i < lote.length; i++) {
      const item = lote[i];
      if (!item?.imageUrl?.trim()) continue;
      const postId =
        item.id?.trim() ||
        `post_fotografo_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`;
      const post: SocialGalleryPost = {
        id: postId,
        fiestaId,
        imageUrl: item.imageUrl.trim(),
        thumbnailUrl: item.thumbnailUrl?.trim() || item.imageUrl.trim(),
        mediaType: 'image',
        moderationStatus: 'approved',
        timestamp: nowIso,
        authorName: sanitizeSocialText(item.authorName || 'Fotógrafo Oficial') || 'Fotógrafo Oficial',
        likes: 0,
        comments: [],
        source: 'fotografo',
        sourceModule: 'fotografo',
        momentTag: normalizarMomentoPost(item.momentTag),
        ...(item.wfolioUrl?.trim() ? { wfolioUrl: item.wfolioUrl.trim() } : {}),
      };
      postsNuevos.push(post);

      for (const desc of item.descriptors || []) {
        if (esVectorFacialValido(desc)) {
          carasNuevas.push({ fotoId: post.id, vector: [...desc] });
        }
      }
      for (const cara of item.caras || []) {
        if (esVectorFacialValido(cara?.vector)) {
          carasNuevas.push({
            fotoId: post.id,
            vector: [...cara.vector],
            ...(cara.tamano !== undefined ? { tamano: cara.tamano } : {}),
          });
        }
      }
    }

    if (postsNuevos.length === 0) {
      return { success: false, importedCount: 0, indexedFacesCount: 0, error: 'No hay fotos válidas para importar.' };
    }

    if (sinBaseDisponible()) {
      const existing = await readData<SocialGalleryPost[]>('social-gallery/metadata.json', []);
      const idsNuevos = new Set(postsNuevos.map((p) => p.id));
      await writeData('social-gallery/metadata.json', [
        ...postsNuevos,
        ...existing.filter((p) => !idsNuevos.has(p.id)),
      ]);
    } else {
      const db = await getDb();
      const batch = db.batch();
      for (const post of postsNuevos) {
        batch.set(db.collection(GALLERY_COLLECTION).doc(post.id), post);
      }
      await batch.commit();
    }

    if (carasNuevas.length > 0) {
      const saveCaras = await actualizarFiesta(
        fiestaId,
        (actual) => ({
          ...actual,
          carasIndexadas: mezclarCarasPorFoto(actual.carasIndexadas || [], carasNuevas),
          socialGallerySettings: {
            ...actual.socialGallerySettings,
            enabled: actual.socialGallerySettings?.enabled ?? true,
            allowLikes: actual.socialGallerySettings?.allowLikes ?? true,
            allowComments: actual.socialGallerySettings?.allowComments ?? true,
            uploadsActive: actual.socialGallerySettings?.uploadsActive ?? true,
            carasPreparadas: true,
            modoCaras: actual.socialGallerySettings?.modoCaras ?? 'grilla',
          },
        }),
        { publicRsvp: true },
      );
      if (!saveCaras.success) {
        return {
          success: false,
          importedCount: postsNuevos.length,
          indexedFacesCount: 0,
          error: saveCaras.error || 'No se pudieron guardar las caras del fotógrafo.',
        };
      }
    }

    const notif = await procesarNotificacionesTandaFotos(fiestaId, carasNuevas, {
      ahoraMs: opciones.ahoraMs,
    });

    return {
      success: true,
      importedCount: postsNuevos.length,
      indexedFacesCount: carasNuevas.length,
      pushEnviados: notif.pushEnviados,
      whatsappEnviados: notif.whatsappEnviados,
    };
  } catch (err: any) {
    logger.warn('[social-gallery] Error importando fotos del fotógrafo:', err);
    return {
      success: false,
      importedCount: 0,
      indexedFacesCount: 0,
      error: err?.message || 'No se pudieron importar las fotos del fotógrafo.',
    };
  }
}

/**
 * Bloque 3: El invitado registra su descriptor facial de 128 números ("Quiero que me lleguen mis fotos").
 * Sólo se guardan números, nunca la selfie, y el vector vence automáticamente a los 90 días.
 */
export async function registrarCaraInvitado(input: {
  fiestaId: string;
  guestId: string;
  guestAccessToken: string;
  vector: number[];
  fcmToken?: string;
  ahoraMs?: number;
}): Promise<{ success: boolean; tieneCaraRegistrada?: boolean; error?: string }> {
  try {
    await enforcePublicRateLimit({
      scope: 'social-guest-face-register',
      identity: `${input.fiestaId}:${input.guestId || 'anon'}`,
      limit: 20,
      windowMs: 60_000,
    });

    if (!input.fiestaId || !input.guestId || !input.guestAccessToken) {
      return { success: false, error: 'Falta tu credencial personal de invitado.' };
    }
    if (!esVectorFacialValido(input.vector)) {
      return { success: false, error: 'No pudimos leer los rasgos faciales. Intentá de nuevo.' };
    }

    const fiesta = await getFiestaById(input.fiestaId, LECTURA_COMPLETA);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };

    const ahoraMs = input.ahoraMs ?? Date.now();
    if (await purgarVectoresInvitadosSiExpiraron(fiesta, ahoraMs)) {
      return {
        success: false,
        tieneCaraRegistrada: false,
        error: 'El plazo de 90 días para guardar tu cara en este evento ya venció.',
      };
    }

    const guest = fiesta.invitados?.find((item) => item.id === input.guestId);
    if (!hasPublicGuestAccess(guest, input.guestId, input.guestAccessToken)) {
      return { success: false, error: 'Credencial de invitado no autorizada.' };
    }

    const saveRes = await actualizarFiesta(
      input.fiestaId,
      (actual) => ({
        ...actual,
        vectoresCarasInvitados: {
          ...(actual.vectoresCarasInvitados || {}),
          [guest.id]: {
            vector: [...input.vector],
            registradoAt: new Date(ahoraMs).toISOString(),
          },
        },
      }),
      { publicRsvp: true },
    );

    if (!saveRes.success) {
      return { success: false, error: saveRes.error || 'No se pudo guardar tu registro facial.' };
    }

    if (input.fcmToken && !sinBaseDisponible()) {
      try {
        const db = await getDb();
        await db.collection('fcm_tokens').doc(input.fcmToken).set(
          {
            token: input.fcmToken,
            guestId: guest.id,
            fiestaId: input.fiestaId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      } catch (fcmErr) {
        logger.warn('[social-gallery] No se pudo guardar token FCM del invitado:', fcmErr);
      }
    }

    return { success: true, tieneCaraRegistrada: true };
  } catch (err: any) {
    logger.warn('[social-gallery] Error registrando cara de invitado:', err);
    return { success: false, error: err?.message || 'Error al registrar tu cara.' };
  }
}

/**
 * Bloque 3 (Privacidad): El invitado borra su descriptor facial a un toque ("Borrar mi cara").
 */
export async function borrarCaraInvitado(input: {
  fiestaId: string;
  guestId: string;
  guestAccessToken: string;
}): Promise<{ success: boolean; tieneCaraRegistrada?: boolean; error?: string }> {
  try {
    await enforcePublicRateLimit({
      scope: 'social-guest-face-delete',
      identity: `${input.fiestaId}:${input.guestId || 'anon'}`,
      limit: 20,
      windowMs: 60_000,
    });

    if (!input.fiestaId || !input.guestId || !input.guestAccessToken) {
      return { success: false, error: 'Falta tu credencial personal de invitado.' };
    }

    const fiesta = await getFiestaById(input.fiestaId, LECTURA_COMPLETA);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };

    const guest = fiesta.invitados?.find((item) => item.id === input.guestId);
    if (!hasPublicGuestAccess(guest, input.guestId, input.guestAccessToken)) {
      return { success: false, error: 'Credencial de invitado no autorizada.' };
    }

    const saveRes = await actualizarFiesta(
      input.fiestaId,
      (actual) => {
        const siguientes = { ...(actual.vectoresCarasInvitados || {}) };
        delete siguientes[guest.id];
        return {
          ...actual,
          vectoresCarasInvitados: siguientes,
        };
      },
      { publicRsvp: true },
    );

    if (!saveRes.success) {
      return { success: false, error: saveRes.error || 'No se pudo borrar tu cara.' };
    }
    return { success: true, tieneCaraRegistrada: false };
  } catch (err: any) {
    logger.warn('[social-gallery] Error borrando cara de invitado:', err);
    return { success: false, error: err?.message || 'Error al borrar tu cara.' };
  }
}

/**
 * Bloque 3: Devuelve las fotos aprobadas de ese invitado (sin exponer jamás vectores faciales).
 */
export async function obtenerMisFotosInvitado(
  fiestaId: string,
  guestId: string,
  guestAccessToken: string,
  opciones: { ahoraMs?: number } = {},
): Promise<{
  success: boolean;
  fotos: SocialGalleryPost[];
  tieneCaraRegistrada: boolean;
  expirado?: boolean;
  error?: string;
}> {
  try {
    const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
    if (!fiesta) {
      return { success: false, fotos: [], tieneCaraRegistrada: false, error: 'Fiesta no encontrada.' };
    }

    const guest = fiesta.invitados?.find((item) => item.id === guestId);
    const autorizadoInvitado = hasPublicGuestAccess(guest, guestId, guestAccessToken);
    const autorizadoEquipo = autorizadoInvitado ? false : await canModerateSocialEvent(fiestaId);

    if (!autorizadoInvitado && !autorizadoEquipo) {
      return { success: false, fotos: [], tieneCaraRegistrada: false, error: 'No autorizado.' };
    }

    const ahoraMs = opciones.ahoraMs ?? Date.now();
    const expirado = await purgarVectoresInvitadosSiExpiraron(fiesta, ahoraMs);

    const postsAprobados = soloAprobados(await getAllEventPosts(fiestaId));
    const approvedIds = new Set(postsAprobados.map((p) => p.id));
    const carasAprobadas = filtrarCarasPorPosts(fiesta.carasIndexadas || [], approvedIds);

    const matchedIds = new Set<string>();
    for (const post of postsAprobados) {
      if (post.guestId === guestId) {
        matchedIds.add(post.id);
      }
    }

    const personasAsignadas = aplicarAsignacionesAPersonas(
      agruparEnPersonas(carasAprobadas, { minimoDeApariciones: 1 }),
      fiesta.asignacionesCaras,
    );
    for (const persona of personasAsignadas) {
      if (persona.invitadoId === guestId) {
        for (const fid of persona.fotoIds) matchedIds.add(fid);
        const matches = buscarFotosDeUnaCara([persona.representante.vector], carasAprobadas);
        for (const fid of matches.seguras) matchedIds.add(fid);
      }
    }

    const vectorInvitado = !expirado ? fiesta.vectoresCarasInvitados?.[guestId]?.vector : undefined;
    if (vectorInvitado?.length && carasAprobadas.length > 0) {
      const res = buscarFotosDeUnaCara([vectorInvitado], carasAprobadas);
      for (const fid of res.seguras) {
        matchedIds.add(fid);
      }
    }

    return {
      success: true,
      fotos: postsAprobados.filter((p) => matchedIds.has(p.id)),
      tieneCaraRegistrada: Boolean(!expirado && vectorInvitado?.length),
      expirado,
    };
  } catch (err: any) {
    logger.warn('[social-gallery] Error obteniendo Mis fotos del invitado:', err);
    return {
      success: false,
      fotos: [],
      tieneCaraRegistrada: false,
      error: err?.message || 'No se pudieron cargar tus fotos.',
    };
  }
}

export interface PersonaPortalCliente {
  id: string;
  representativeFotoId: string;
  thumbnailUrl?: string;
  fotoIds: string[];
  apariciones: number;
  invitadoId?: string;
  nombre?: string;
}

/**
 * Bloque 7: Devuelve las caras agrupadas de la fiesta (SIN vectores faciales) y la lista de invitados
 * de ESA fiesta para que el cliente pueda asignar "¿Quién es quién?" en su portal.
 */
export async function obtenerPersonasParaPortalCliente(
  fiestaId: string,
  accessKey?: string,
): Promise<{
  success: boolean;
  personas: PersonaPortalCliente[];
  invitados: Array<{ id: string; nombre: string }>;
  error?: string;
}> {
  try {
    const tienePortal = await verifyPortalSession(fiestaId);
    const esEquipo = tienePortal ? false : await canModerateSocialEvent(fiestaId);
    if (!tienePortal && !esEquipo) {
      return { success: false, personas: [], invitados: [], error: 'Sesión del portal no autorizada.' };
    }

    const fiesta = await getFiestaByIdRaw(fiestaId);
    if (!fiesta) {
      return { success: false, personas: [], invitados: [], error: 'Fiesta no encontrada.' };
    }
    if (
      tienePortal &&
      !esEquipo &&
      accessKey !== undefined &&
      (!fiesta.clientPortalSettings?.enabled || fiesta.clientPortalSettings?.accessKey !== accessKey)
    ) {
      return { success: false, personas: [], invitados: [], error: 'Sesión del portal no autorizada.' };
    }

    const postsAprobados = soloAprobados(await getAllEventPosts(fiestaId));
    const postById = new Map(postsAprobados.map((p) => [p.id, p]));
    const carasBase = postsAprobados.length > 0
      ? filtrarCarasPorPosts(fiesta.carasIndexadas || [], new Set(postById.keys()))
      : (fiesta.carasIndexadas || []);

    const personasAgrupadas: Persona[] = aplicarAsignacionesAPersonas(
      agruparEnPersonas(carasBase, { minimoDeApariciones: 1 }),
      fiesta.asignacionesCaras,
    );

    const personas: PersonaPortalCliente[] = personasAgrupadas.map((p) => {
      const repPost = postById.get(p.representante.fotoId);
      return {
        id: p.id,
        representativeFotoId: p.representante.fotoId,
        thumbnailUrl: repPost?.thumbnailUrl || repPost?.imageUrl,
        fotoIds: p.fotoIds,
        apariciones: p.apariciones,
        ...(p.invitadoId ? { invitadoId: p.invitadoId } : {}),
        ...(p.nombre ? { nombre: p.nombre } : {}),
      };
    });

    const invitados = (fiesta.invitados || []).map((inv) => ({
      id: inv.id,
      nombre: inv.nombre,
    }));

    return { success: true, personas, invitados };
  } catch (err: any) {
    logger.warn('[social-gallery] Error cargando personas para portal cliente:', err);
    return {
      success: false,
      personas: [],
      invitados: [],
      error: err?.message || 'No se pudieron cargar las caras.',
    };
  }
}

/**
 * Bloque 7: Asigna (o deshace) un invitado de ESA fiesta a una cara agrupada desde el portal del cliente.
 * Valida sesión del portal, opcionalmente `accessKey`, y que el `invitadoId` pertenezca a esta fiesta.
 */
export async function asignarNombreCaraDesdePortal(input: {
  fiestaId: string;
  accessKey?: string;
  personaId: string;
  representativeFotoId?: string;
  invitadoId?: string;
  nombre?: string;
  ahoraMs?: number;
}): Promise<{ success: boolean; invitadoId?: string; nombre?: string; error?: string }> {
  try {
    if (!(await verifyPortalSession(input.fiestaId))) {
      return { success: false, error: 'Sesión del portal no autorizada.' };
    }

    const fiesta = await getFiestaByIdRaw(input.fiestaId);
    if (!fiesta || !fiesta.clientPortalSettings?.enabled) {
      return { success: false, error: 'Portal del cliente no habilitado para este evento.' };
    }
    if (
      input.accessKey !== undefined &&
      (!input.accessKey || fiesta.clientPortalSettings.accessKey !== input.accessKey)
    ) {
      return { success: false, error: 'Clave del portal inválida.' };
    }

    const claveAsignacion = input.representativeFotoId?.trim() || input.personaId?.trim();
    if (!claveAsignacion) {
      return { success: false, error: 'Falta identificar la cara a asignar.' };
    }

    if (!input.invitadoId) {
      const saveRes = await actualizarFiesta(
        input.fiestaId,
        (actual) => {
          const siguientes = { ...(actual.asignacionesCaras || {}) };
          delete siguientes[claveAsignacion];
          if (input.personaId && siguientes[input.personaId]) {
            delete siguientes[input.personaId];
          }
          for (const [k, v] of Object.entries(siguientes)) {
            if (
              (input.personaId && v.personaId === input.personaId) ||
              (input.representativeFotoId && v.representativeFotoId === input.representativeFotoId)
            ) {
              delete siguientes[k];
            }
          }
          return {
            ...actual,
            asignacionesCaras: siguientes,
          };
        },
        { publicRsvp: true },
      );
      if (!saveRes.success) {
        return { success: false, error: saveRes.error || 'No se pudo deshacer la asignación.' };
      }
      return { success: true, invitadoId: undefined, nombre: undefined };
    }

    const guest = (fiesta.invitados || []).find((i) => i.id === input.invitadoId);
    if (!guest) {
      return {
        success: false,
        error: 'El invitado seleccionado no pertenece a esta fiesta.',
      };
    }

    const nuevaAsignacion: AsignacionCara = {
      personaId: input.personaId,
      ...(input.representativeFotoId ? { representativeFotoId: input.representativeFotoId } : {}),
      invitadoId: guest.id,
      nombre: guest.nombre,
      updatedAt: new Date(input.ahoraMs ?? Date.now()).toISOString(),
    };

    const saveRes = await actualizarFiesta(
      input.fiestaId,
      (actual) => ({
        ...actual,
        asignacionesCaras: {
          ...(actual.asignacionesCaras || {}),
          [claveAsignacion]: nuevaAsignacion,
        },
      }),
      { publicRsvp: true },
    );

    if (!saveRes.success) {
      return { success: false, error: saveRes.error || 'No se pudo guardar la asignación.' };
    }

    if ((fiesta.carasIndexadas || []).length > 0) {
      await procesarNotificacionesTandaFotos(input.fiestaId, fiesta.carasIndexadas || [], {
        ahoraMs: input.ahoraMs,
      });
    }

    return {
      success: true,
      invitadoId: guest.id,
      nombre: guest.nombre,
    };
  } catch (err: any) {
    logger.warn('[social-gallery] Error asignando nombre a cara desde portal:', err);
    return { success: false, error: err?.message || 'Error al asignar el nombre.' };
  }
}

/**
 * Bloque 7: Búsqueda de invitado por nombre exacto normalizado cuando entra sin credencial.
 * Rechaza coincidencias parciales o parecidas (ej. "Juan" cuando es "Juan Pérez").
 */
export async function buscarInvitadoPorNombreExactoParaCara(
  fiestaId: string,
  nombre: string,
): Promise<{ found: boolean; invitadoId?: string; nombre?: string; error?: string }> {
  try {
    await enforcePublicRateLimit({
      scope: 'social-guest-exact-name',
      identity: fiestaId,
      limit: 30,
      windowMs: 60_000,
    });

    if (!fiestaId || !nombre?.trim()) {
      return { found: false, error: 'Escribí tu nombre completo exacto.' };
    }

    const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
    if (!fiesta) {
      return { found: false, error: 'Fiesta no encontrada.' };
    }

    const match = buscarInvitadoPorNombreExacto(fiesta.invitados || [], nombre);
    if (!match) {
      return {
        found: false,
        error: 'No encontramos un invitado con ese nombre completo exacto.',
      };
    }

    return {
      found: true,
      invitadoId: match.id,
      nombre: match.nombre,
    };
  } catch (err: any) {
    logger.warn('[social-gallery] Error buscando invitado por nombre exacto:', err);
    return { found: false, error: err?.message || 'No se pudo verificar el nombre.' };
  }
}


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

import type { SocialGalleryPost, SocialComment, ChatMessage } from '@/types/social-gallery';
import type { FiestaEnPlanificacion, SocialGallerySettings } from '@/types/fiesta';
import { uploadToStorage, deleteFromStorage } from '@/lib/firebase/storage';
import type { Firestore, QueryDocumentSnapshot, Transaction } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import path from 'path';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { getFiestaByAccessKey } from '@/app/actions/fiesta/portal.actions';
import * as logger from '@/lib/logger';
import { reviewSocialContent, sanitizeSocialText } from '@/lib/social-fiesta/content-review';
import { checkImageSafety } from '@/lib/social-fiesta/content-safety-ai';
import { hasAppSession, requireAppSession } from '@/lib/auth/require-session';
import { shouldQueueForManualReview } from '@/lib/social-fiesta/guardrails';
import { toPublicSocialEvent, type PublicSocialEvent } from '@/lib/social-fiesta/public-event';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { readData } from '@/lib/data-service';
import { hasPublicGuestAccess, buildPublicGuestPortalData } from '@/lib/guest-portal-public-data';
import { verifyEntertainmentAccessToken } from '@/lib/auth/entertainment-token';
import { isEntertainmentModuleId } from '@/lib/entertainment/station-config';
import { resolveSocialUploadAccess } from '@/lib/social-fiesta/upload-access';
import { verifyPortalSession } from '@/lib/security/portal-session';
import { getFiestaByIdRaw } from '@/lib/fiesta/get-fiesta-raw';

// Firestore collection names
const GALLERY_COLLECTION = 'social_gallery_posts';
const CHAT_COLLECTION = 'social_chat';
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

async function getLocalSocialPosts(fiestaId: string): Promise<SocialGalleryPost[]> {
  const posts = await readData<SocialGalleryPost[]>('social-gallery/metadata.json', []);
  return posts
    .filter((post) => post.fiestaId === fiestaId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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
  const fiesta = await getFiestaById(fiestaId);
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
  accessKey: string,
): Promise<FiestaEnPlanificacion | null> {
  if (!(await verifyPortalSession(fiestaId))) return null;
  const fiesta = await getFiestaByIdRaw(fiestaId);
  if (
    !fiesta?.clientPortalSettings?.enabled
    || !accessKey
    || fiesta.clientPortalSettings.accessKey !== accessKey
  ) {
    return null;
  }
  return fiesta;
}

// ──────────────────── Photo Gallery ────────────────────

export async function getSocialPosts(fiestaId: string): Promise<SocialGalleryPost[]> {
  try {
    const canModerate = await hasAppSession();
    if (process.env.AK_USE_LOCAL_JSON_ONLY === 'true') {
      const posts = await getLocalSocialPosts(fiestaId);
      return canModerate
        ? posts
        : posts.filter((post) => (post.moderationStatus ?? 'approved') === 'approved');
    }

    const db = await getDb();
    // Single equality filter — uses the auto-created single-field index on fiestaId.
    const snapshot = await db
      .collection(GALLERY_COLLECTION)
      .where('fiestaId', '==', fiestaId)
      .get();
    const posts = snapshot.docs
      .map((doc: QueryDocumentSnapshot) => {
        const data = { ...doc.data() } as any;
        delete data._syncedAt;
        return data as SocialGalleryPost;
      })
      .sort((a: SocialGalleryPost, b: SocialGalleryPost) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return canModerate
      ? posts
      : posts.filter((post) => (post.moderationStatus ?? 'approved') === 'approved');
  } catch (e) {
    logger.warn('[social-gallery] getSocialPosts failed:', e);
    return [];
  }
}

/**
 * Public feed reader. Unlike the administrator reader, this never returns
 * pending or hidden content, even when the browser also has an app session.
 */
export async function getPublicSocialPosts(fiestaId: string): Promise<SocialGalleryPost[]> {
  const posts = await getSocialPosts(fiestaId);
  return posts.filter((post) => (post.moderationStatus ?? 'approved') === 'approved');
}

export async function getPublicSocialPostCount(
  fiestaId: string,
  guestId: string,
  guestAccessToken: string,
): Promise<number> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta || !buildPublicGuestPortalData(fiesta, guestId, guestAccessToken)) return 0;

    if (process.env.AK_USE_LOCAL_JSON_ONLY === 'true') {
      const posts = await getLocalSocialPosts(fiestaId);
      return posts.filter((post) => (post.moderationStatus ?? 'approved') === 'approved').length;
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
    : await getFiestaById(fiestaId);
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

    if (process.env.AK_USE_LOCAL_JSON_ONLY === 'true') {
      return { success: true, posts: await getLocalSocialPosts(fiestaId) };
    }

    const db = await getDb();
    const snapshot = await db
      .collection(GALLERY_COLLECTION)
      .where('fiestaId', '==', fiestaId)
      .get();

    const posts = snapshot.docs
      .map((doc: QueryDocumentSnapshot) => {
        const data = { ...doc.data() } as any;
        delete data._syncedAt;
        return data as SocialGalleryPost;
      })
      .sort((a: SocialGalleryPost, b: SocialGalleryPost) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return { success: true, posts };
  } catch (error: any) {
    logger.warn('[social-gallery] getSocialPostsByClient failed:', error);
    return { success: false, error: error.message || 'No se pudieron cargar las publicaciones.' };
  }
}

export async function getSocialAdminAccess(): Promise<boolean> {
  return hasAppSession();
}

export async function saveSocialGallerySettings(
  fiestaId: string,
  settings: SocialGallerySettings
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAppSession();
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado.' };
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

  if (!fiestaId || !file) return { success: false, error: 'Faltan datos (ID de fiesta o archivo).' };

  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');
  if (!isImage && !isVideo) return { success: false, error: 'Solo se aceptan fotos o videos.' };
  const maxSize = isVideo ? MAX_VIDEO_UPLOAD_SIZE : MAX_IMAGE_UPLOAD_SIZE;
  if (file.size > maxSize) {
    return { success: false, error: isVideo ? 'El video no puede superar los 60MB.' : 'La imagen no puede superar los 10MB.' };
  }

  try {
    const fiestaData = await getFiestaById(fiestaId);
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
    const textReview = reviewSocialContent({
      type: 'text',
      text: [authorName, dedication].filter(Boolean).join(' '),
      authorName,
      moderationMode: 'automatico',
    });
    if (textReview.status === 'blocked') return { success: false, error: textReview.message };

    await enforcePublicRateLimit({
      scope: 'social-media-upload',
      identity: rateIdentity,
      limit: 12,
      windowMs: 60_000,
    });
    const db = await getDb();
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

    const fileExtension = path.extname(file.name);
    const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const storagePath = `social-gallery/${fiestaId}/${postId}${fileExtension}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let safetyResult: Awaited<ReturnType<typeof checkImageSafety>> = { safe: true, reason: 'clean' };
    if (isImage) {
      safetyResult = await checkImageSafety(buffer);
      if (!safetyResult.safe) {
        return {
          success: false,
          error: 'Archivo bloqueado por riesgo de contenido adulto o inapropiado.'
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
    const finalModerationStatus = isWallRestricted
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
      likes: 0,
      comments: [],
      source,
      ...(sourceModule ? { sourceModule } : {}),
      ...(dedication ? { dedication: sanitizeSocialText(dedication) } : {}),
      ...(momentTag ? { momentTag } : {}),
      ...(imageHash ? { imageHash } : {}),
    };

    // Single-document write — zero write conflict even with 200 simultaneous uploads,
    // because every caller writes to its own unique postId document.
    await db.collection(GALLERY_COLLECTION).doc(postId).set(newPost);

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
  caption?: string;
  momentTag?: string;
  source?: string;
  sourceModule?: string;
  drinkId?: string;
  drinkName?: string;
  /** La estacion lo marca cuando lo subido no se pudo revisar automaticamente. */
  revisionManual?: boolean;
}

async function persistSocialMediaPostFromUrl(
  input: CreateSocialMediaPostFromUrlInput,
): Promise<{ success: boolean; post?: SocialGalleryPost; error?: string }> {
  if (!input.fiestaId || !input.mediaUrl) {
    return { success: false, error: 'Faltan datos para publicar en el muro social.' };
  }

  try {
    const db = await getDb();
    const review = reviewSocialContent({
      type: input.mediaType === 'video' ? 'video' : 'image',
      text: [input.authorName, input.caption].filter(Boolean).join(' '),
      authorName: input.authorName,
      moderationMode: 'automatico',
    });
    if (review.status === 'blocked') return { success: false, error: review.message };
    const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    // `revisionManual` lo manda la estacion cuando lo que se subio no se pudo
    // revisar solo: los videos, y las fotos cuando el analisis automatico no
    // estuvo disponible. En ese caso queda esperando el visto bueno en vez de
    // salir directo a la pantalla grande.
    const fiesta = await getFiestaById(input.fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
    const requireApproval = fiesta.socialGallerySettings?.requireApproval !== false;
    const esperaAprobacion = requireApproval || review.status === 'pending_review' || input.revisionManual === true;
    const newPost: SocialGalleryPost = {
      id: postId,
      fiestaId: input.fiestaId,
      imageUrl: input.mediaUrl,
      mediaType: input.mediaType ?? 'image',
      moderationStatus: esperaAprobacion ? 'pending' : 'approved',
      timestamp: new Date().toISOString(),
      authorName: sanitizeSocialText(input.authorName || 'AK Producciones') || 'AK Producciones',
      likes: 0,
      comments: [],
      source: input.source || 'entertainment',
      ...(input.sourceModule ? { sourceModule: input.sourceModule } : {}),
      ...(input.caption ? { caption: sanitizeSocialText(input.caption), dedication: sanitizeSocialText(input.caption) } : {}),
      ...(input.momentTag ? { momentTag: input.momentTag } : {}),
      ...(input.drinkId ? { drinkId: input.drinkId } : {}),
      ...(input.drinkName ? { drinkName: input.drinkName } : {}),
    };

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
  moderatedBy: string = 'AK Producciones'
): Promise<{ success: boolean; post?: SocialGalleryPost; error?: string }> {
  try {
    await requireAppSession();
    const db = await getDb();
    const ref = db.collection(GALLERY_COLLECTION).doc(postId);
    const snap = await ref.get();
    if (!snap.exists) return { success: false, error: 'Publicación no encontrada.' };
    await ref.update({
      moderationStatus,
      moderatedAt: new Date().toISOString(),
      moderatedBy,
    });
    const updated = await ref.get();
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
    const newComment: SocialComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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
    await requireAppSession();
    const db = await getDb();
    const ref = db.collection(GALLERY_COLLECTION).doc(postId);
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
  postId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAppSession();
    const db = await getDb();
    const ref = db.collection(GALLERY_COLLECTION).doc(postId);
    const snap = await ref.get();
    if (!snap.exists) return { success: false, error: 'Publicación no encontrada para eliminar.' };
    const data = snap.data() as SocialGalleryPost;
    try {
      await deleteFromStorage(data.imageUrl);
    } catch (fileError: any) {
      logger.warn(`[social-gallery] Could not delete Storage file for post ${postId}: ${fileError.message}`);
    }
    await ref.delete();
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function clearGallery(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAppSession();
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

export async function getPhotoFilePathsForZip(
  fiestaId: string
): Promise<{ path: string; name: string }[]> {
  try {
    await requireAppSession();
    const db = await getDb();
    const snapshot = await db
      .collection(GALLERY_COLLECTION)
      .where('fiestaId', '==', fiestaId)
      .get();
    return snapshot.docs.map((doc: QueryDocumentSnapshot) => {
      const data = doc.data() as SocialGalleryPost;
      let name: string;
      try {
        name = new URL(data.imageUrl).pathname.split('/').filter(Boolean).pop() || data.id;
      } catch {
        name = data.id;
      }
      return { path: data.imageUrl, name };
    });
  } catch {
    return [];
  }
}

// ──────────────────── Live Chat ────────────────────

export async function getChatMessages(fiestaId: string): Promise<ChatMessage[]> {
  try {
    const db = await getDb();
    const snapshot = await db
      .collection(CHAT_COLLECTION)
      .where('fiestaId', '==', fiestaId)
      .get();
    return snapshot.docs
      .map((doc: QueryDocumentSnapshot) => doc.data() as ChatMessage)
      .sort((a: ChatMessage, b: ChatMessage) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch {
    return [];
  }
}

export async function addChatMessage(
  fiestaId: string,
  text: string,
  authorName: string = 'Anónimo',
  credentials: SocialInteractionCredentials = {},
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
    const msgId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newMessage: ChatMessage = {
      id: msgId,
      fiestaId,
      authorName: sanitizeSocialText(resolvedAuthorName) || 'Anónimo',
      text: review.sanitizedText || sanitizeSocialText(text),
      timestamp: new Date().toISOString(),
    };
    // Single-document write — safe for many concurrent senders.
    await db.collection(CHAT_COLLECTION).doc(msgId).set(newMessage);
    return { success: true, message: newMessage };
  } catch (error: any) {
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
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al moderar.' };
  }
}

export async function createSocialMediaPostFromUrl(
  input: CreateSocialMediaPostFromUrlInput,
): Promise<{ success: boolean; post?: SocialGalleryPost; error?: string }> {
  await requireAppSession();
  return persistSocialMediaPostFromUrl(input);
}

export async function createSocialMediaPostFromUrlForStation(
  input: CreateSocialMediaPostFromUrlInput & { sourceModule: string },
  accessToken: string,
): Promise<{ success: boolean; post?: SocialGalleryPost; error?: string }> {
  if (
    !isEntertainmentModuleId(input.sourceModule) ||
    !verifyEntertainmentAccessToken(accessToken, input.fiestaId, input.sourceModule, 'guest')
  ) {
    return { success: false, error: 'Acceso de estación no autorizado.' };
  }
  return persistSocialMediaPostFromUrl({
    ...input,
    source: 'entertainment',
  });
}


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
import { uploadToStorage, deleteFromStorage } from '@/lib/firebase/storage';
import type { Firestore, QueryDocumentSnapshot, Transaction } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import path from 'path';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import * as logger from '@/lib/logger';
import { reviewSocialContent, sanitizeSocialText } from '@/lib/social-fiesta/content-review';
import { checkImageSafety } from '@/lib/social-fiesta/content-safety-ai';

// Firestore collection names
const GALLERY_COLLECTION = 'social_gallery_posts';
const CHAT_COLLECTION = 'social_chat';
const MAX_PHOTOS_PER_EVENT = 200;
const MAX_PHOTOS_PER_PERSON = 10;
const MAX_IMAGE_UPLOAD_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_UPLOAD_SIZE = 60 * 1024 * 1024;

/** Returns the Firestore Admin instance; throws if Firebase is not configured. */
async function getDb(): Promise<Firestore> {
  const { dbAdmin } = await import('@/lib/firebase/server');
  if (!dbAdmin) throw new Error('Firestore no disponible.');
  return dbAdmin as Firestore;
}

// ──────────────────── Photo Gallery ────────────────────

export async function getSocialPosts(fiestaId: string): Promise<SocialGalleryPost[]> {
  try {
    const db = await getDb();
    // Single equality filter — uses the auto-created single-field index on fiestaId.
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
  } catch (e) {
    logger.warn('[social-gallery] getSocialPosts failed:', e);
    return [];
  }
}

export async function uploadSocialPost(
  formData: FormData
): Promise<{ success: boolean; post?: SocialGalleryPost; error?: string }> {
  const fiestaId = formData.get('fiestaId') as string;
  const file = formData.get('file') as File;
  const authorName = (formData.get('authorName') as string) || 'Anónimo';
  const dedication = (formData.get('dedication') as string) || undefined;
  const momentTag = (formData.get('momentTag') as string) || undefined;
  const imageHash = (formData.get('imageHash') as string) || undefined;

  if (!fiestaId || !file) return { success: false, error: 'Faltan datos (ID de fiesta o archivo).' };
  const textReview = reviewSocialContent({
    type: 'text',
    text: [authorName, dedication].filter(Boolean).join(' '),
    authorName,
    moderationMode: 'automatico',
  });
  if (textReview.status === 'blocked') return { success: false, error: textReview.message };

  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');
  if (!isImage && !isVideo) return { success: false, error: 'Solo se aceptan fotos o videos.' };
  const maxSize = isVideo ? MAX_VIDEO_UPLOAD_SIZE : MAX_IMAGE_UPLOAD_SIZE;
  if (file.size > maxSize) {
    return { success: false, error: isVideo ? 'El video no puede superar los 60MB.' : 'La imagen no puede superar los 10MB.' };
  }

  try {
    const db = await getDb();
    const fiestaData = await getFiestaById(fiestaId);
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
    const isAnonymous = !authorName || authorName.toLowerCase() === 'anónimo' || authorName.toLowerCase() === 'anonimo';
    if (!isAnonymous) {
      const personSnap = await db
        .collection(GALLERY_COLLECTION)
        .where('fiestaId', '==', fiestaId)
        .where('authorName', '==', authorName)
        .select('id')
        .get();
      if (personSnap.size >= personLimit) {
        return { success: false, error: `Ya subiste el máximo de ${personLimit} fotos permitidas por persona.` };
      }

      // Duplicate image detection — reject if the same content hash was already uploaded.
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
    const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const storagePath = `social-gallery/${fiestaId}/${postId}${fileExtension}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let imageAiSafe = true;
    if (isImage) {
      const safetyResult = await checkImageSafety(buffer);
      imageAiSafe = safetyResult.safe;
      if (!imageAiSafe) {
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

    const requireApproval = fiestaData?.socialGallerySettings?.requireApproval === true;
    const mediaReview = reviewSocialContent({
      type: isVideo ? 'video' : 'image',
      text: dedication,
      authorName,
      moderationMode: requireApproval ? 'seguro' : 'automatico',
      imageAiSafe,
    });
    if (mediaReview.status === 'blocked') return { success: false, error: mediaReview.message };
    const newPost: SocialGalleryPost = {
      id: postId,
      fiestaId,
      imageUrl,
      mediaType: isVideo ? 'video' : 'image',
      moderationStatus: mediaReview.status === 'pending_review' ? 'pending' : 'approved',
      timestamp: new Date().toISOString(),
      authorName: sanitizeSocialText(authorName) || 'Anónimo',
      likes: 0,
      comments: [],
      source: 'guest',
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

export async function createSocialMediaPostFromUrl(input: {
  fiestaId: string;
  mediaUrl: string;
  mediaType?: 'image' | 'video';
  authorName?: string;
  caption?: string;
  momentTag?: string;
  source?: string;
  sourceModule?: string;
}): Promise<{ success: boolean; post?: SocialGalleryPost; error?: string }> {
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
    const newPost: SocialGalleryPost = {
      id: postId,
      fiestaId: input.fiestaId,
      imageUrl: input.mediaUrl,
      mediaType: input.mediaType ?? 'image',
      moderationStatus: review.status === 'pending_review' ? 'pending' : 'approved',
      timestamp: new Date().toISOString(),
      authorName: sanitizeSocialText(input.authorName || 'AK Producciones') || 'AK Producciones',
      likes: 0,
      comments: [],
      source: input.source || 'entertainment',
      ...(input.sourceModule ? { sourceModule: input.sourceModule } : {}),
      ...(input.caption ? { caption: sanitizeSocialText(input.caption), dedication: sanitizeSocialText(input.caption) } : {}),
      ...(input.momentTag ? { momentTag: input.momentTag } : {}),
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
    const db = await getDb();
    const ref = db.collection(GALLERY_COLLECTION).doc(postId);
    const snap = await ref.get();
    if (!snap.exists) return { success: false, error: 'Publicación no encontrada.' };
    const data = snap.data() as SocialGalleryPost;

    if (moderationStatus === 'hidden' && data.imageUrl) {
      try {
        await deleteFromStorage(data.imageUrl);
      } catch (fileError: any) {
        logger.warn(`[social-gallery] Could not delete Storage file on rejection for post ${postId}: ${fileError.message}`);
      }
    }

    await ref.update({
      moderationStatus,
      imageUrl: moderationStatus === 'hidden' ? '' : data.imageUrl,
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
  postId: string
): Promise<{ success: boolean; post?: SocialGalleryPost; error?: string }> {
  try {
    const db = await getDb();
    const ref = db.collection(GALLERY_COLLECTION).doc(postId);
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
  authorName: string = 'Anónimo'
): Promise<{ success: boolean; comment?: SocialComment; error?: string }> {
  try {
    const review = reviewSocialContent({ type: 'text', text, authorName, moderationMode: 'automatico' });
    if (review.status === 'blocked') return { success: false, error: review.message };
    const db = await getDb();
    const newComment: SocialComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      authorName: sanitizeSocialText(authorName) || 'Anónimo',
      text: review.sanitizedText || sanitizeSocialText(text),
      timestamp: new Date().toISOString(),
    };
    const ref = db.collection(GALLERY_COLLECTION).doc(postId);
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
  authorName: string = 'Anónimo'
): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
  if (!fiestaId || !text.trim()) {
    return { success: false, error: 'Datos del mensaje incompletos.' };
  }
  const review = reviewSocialContent({ type: 'text', text, authorName, moderationMode: 'automatico' });
  if (review.status === 'blocked') return { success: false, error: review.message };
  try {
    const db = await getDb();
    const msgId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newMessage: ChatMessage = {
      id: msgId,
      fiestaId,
      authorName: sanitizeSocialText(authorName) || 'Anónimo',
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

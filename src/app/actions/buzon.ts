'use server';

import type { Firestore, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { uploadToStorage, deleteFromStorage } from '@/lib/firebase/storage';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { addChatMessage } from '@/app/actions/social-gallery';
import { requireAppSession } from '@/lib/auth/require-session';
import * as logger from '@/lib/logger';
import path from 'path';
import { hasEntertainmentGuestAccess } from '@/lib/auth/entertainment-token';
import { getEntertainmentStationConfig } from '@/lib/entertainment/station-config';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { detectBuzonMedia } from '@/lib/buzon/media-upload';
import { isFrameTemplateId } from '@/lib/buzon/video-frame-templates';

const BUZON_COLLECTION = 'buzon_messages';
const MAX_AUDIO_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_VIDEO_SIZE = 40 * 1024 * 1024; // 40MB

export interface BuzonMessage {
  id: string;
  fiestaId: string;
  authorName: string;
  mediaUrl: string;
  mediaType: 'audio' | 'video';
  durationSeconds: number;
  timestamp: string;
  storagePath: string;
  // Bloque G: Cápsula del tiempo para abrir en el futuro
  isTimeCapsule?: boolean;
  unlockYears?: number; // ej. 1, 3, 5, 10, 15
  unlockDate?: string; // Fecha calculada ISO para la apertura
  recipientNote?: string;
}

/** Returns the Firestore Admin instance; throws if Firebase is not configured. */
async function getDb(): Promise<Firestore> {
  const { dbAdmin } = await import('@/lib/firebase/server');
  if (!dbAdmin) throw new Error('Firestore no disponible.');
  return dbAdmin as Firestore;
}

/**
 * Gets all mailbox messages for a given party.
 */
export async function getBuzonMessages(fiestaId: string): Promise<BuzonMessage[]> {
  if (!fiestaId) return [];
  try {
    await requireAppSession();
    const db = await getDb();
    const snapshot = await db
      .collection(BUZON_COLLECTION)
      .where('fiestaId', '==', fiestaId)
      .get();

    return snapshot.docs
      .map((doc: QueryDocumentSnapshot) => doc.data() as BuzonMessage)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    logger.warn('[buzon] getBuzonMessages failed:', error);
    return [];
  }
}

/**
 * Uploads a guest's audio or video mailbox entry.
 */
export async function uploadBuzonMessage(
  formData: FormData
): Promise<{ success: boolean; message?: BuzonMessage; error?: string }> {
  const fiestaId = formData.get('fiestaId') as string;
  const file = formData.get('file') as File;
  const accessToken = String(formData.get('accessToken') || '');
  const authorName = String(formData.get('authorName') || '').trim().slice(0, 80) || 'Anónimo';
  const mediaType = formData.get('mediaType') as 'audio' | 'video';

  if (!fiestaId || !file || file.size <= 0) {
    return { success: false, error: 'Faltan datos obligatorios (fiestaId o archivo).' };
  }

  if (mediaType !== 'audio' && mediaType !== 'video') {
    return { success: false, error: 'Formato de archivo no soportado (solo audio o video).' };
  }

  const limitSize = mediaType === 'audio' ? MAX_AUDIO_SIZE : MAX_VIDEO_SIZE;
  if (file.size > limitSize) {
    return {
      success: false,
      error: `El archivo supera el límite permitido (${mediaType === 'audio' ? '15MB' : '40MB'}).`,
    };
  }

  try {
    if (!(await hasEntertainmentGuestAccess(fiestaId, 'capsulaTiempo', accessToken))) {
      return { success: false, error: 'Acceso de estación no autorizado.' };
    }
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
    const station = getEntertainmentStationConfig(fiesta, 'capsulaTiempo');
    if (
      !station.enabled
      || fiesta.buzonConfig?.enabled === false
      || fiesta.guestPortalSettings?.showBuzon === false
    ) {
      return { success: false, error: 'El buzón no está habilitado para esta fiesta.' };
    }

    await enforcePublicRateLimit({
      scope: 'buzon-upload',
      identity: fiestaId,
      limit: 30,
      windowMs: 10 * 60 * 1000,
    });

    const bytes = new Uint8Array(await file.arrayBuffer());
    const detectedMedia = detectBuzonMedia(bytes, mediaType, file.type);
    if (!detectedMedia) {
      return { success: false, error: 'El contenido del archivo no coincide con un audio o video válido.' };
    }

    const db = await getDb();
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const storagePath = `fiestas/${fiestaId}/buzon/${messageId}${detectedMedia.extension}`;
    const durationLimit = detectedMedia.mediaType === 'audio' ? 60 : 15;
    const durationSeconds = Math.min(
      durationLimit,
      Math.max(0, Math.round(Number(formData.get('durationSeconds')) || 0)),
    );

    // Upload to Firebase Storage
    const mediaUrl = await uploadToStorage(
      Buffer.from(bytes),
      storagePath,
      detectedMedia.contentType,
      true // make public so the client/host can reproduce it directly
    );

    const isTimeCapsule = formData.get('isTimeCapsule') === 'true';
    const unlockYears = Number(formData.get('unlockYears')) || (isTimeCapsule ? 10 : undefined);
    let unlockDate: string | undefined;
    if (isTimeCapsule && unlockYears && unlockYears > 0) {
      const future = new Date();
      future.setFullYear(future.getFullYear() + unlockYears);
      unlockDate = future.toISOString();
    }
    const recipientNote = String(formData.get('recipientNote') || '').trim().slice(0, 120) || undefined;

    const newMessage: BuzonMessage = {
      id: messageId,
      fiestaId,
      authorName,
      mediaUrl,
      mediaType: detectedMedia.mediaType,
      durationSeconds,
      timestamp: new Date().toISOString(),
      storagePath,
      ...(isTimeCapsule ? { isTimeCapsule: true, unlockYears, unlockDate, recipientNote } : {}),
    };

    // Save metadata in Firestore
    await db.collection(BUZON_COLLECTION).doc(messageId).set(newMessage);

    // Notify the screen visually by adding a system chat message
    const alertText = isTimeCapsule
      ? `⏳ Dejó una cápsula del tiempo (abrir en ${unlockYears} años)`
      : detectedMedia.mediaType === 'audio'
        ? '🎙️ Dejó un saludo de voz en el buzón'
        : '📹 Subió un video al buzón';

    await addChatMessage(fiestaId, alertText, authorName, {
      stationModuleId: 'capsulaTiempo',
      stationAccessToken: accessToken,
    }).catch((err) => {
      logger.warn('[buzon] Failed to send chat notification:', err);
    });

    return { success: true, message: newMessage };
  } catch (error: any) {
    logger.warn('[buzon] uploadBuzonMessage failed:', error);
    return { success: false, error: 'Error al subir el mensaje: ' + (error.message || error) };
  }
}

/**
 * Deletes a mailbox message.
 */
export async function deleteBuzonMessage(
  messageId: string
): Promise<{ success: boolean; error?: string }> {
  if (!messageId) return { success: false, error: 'ID de mensaje es requerido.' };
  try {
    await requireAppSession();
    const db = await getDb();
    const ref = db.collection(BUZON_COLLECTION).doc(messageId);
    const snap = await ref.get();

    if (!snap.exists) {
      return { success: false, error: 'El mensaje no existe.' };
    }

    const data = snap.data() as BuzonMessage;

    // Delete from Firebase Storage
    if (data.storagePath) {
      await deleteFromStorage(data.storagePath).catch((err) => {
        logger.warn('[buzon] Failed to delete file from storage:', err);
      });
    }

    // Delete from Firestore
    await ref.delete();
    return { success: true };
  } catch (error: any) {
    logger.warn('[buzon] deleteBuzonMessage failed:', error);
    return { success: false, error: error.message || 'Error al eliminar el mensaje.' };
  }
}

/**
 * Uploads/Updates the hosts' welcome message.
 */
export async function uploadWelcomeAudio(
  formData: FormData
): Promise<{ success: boolean; welcomeAudioUrl?: string; error?: string }> {
  const fiestaId = formData.get('fiestaId') as string;
  const file = formData.get('file') as File;

  if (!fiestaId || !file) {
    return { success: false, error: 'Faltan datos obligatorios (fiestaId o archivo).' };
  }

  try {
    await requireAppSession();
    const fileExtension = path.extname(file.name) || '.webm';
    const storagePath = `fiestas/${fiestaId}/buzon/bienvenida${fileExtension}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload welcome file to Storage
    const welcomeAudioUrl = await uploadToStorage(
      buffer,
      storagePath,
      file.type || 'audio/webm',
      true
    );

    // Update fiesta configuration
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) {
      return { success: false, error: 'Fiesta no encontrada.' };
    }

    const updatedFiesta = {
      ...fiesta,
      buzonConfig: {
        ...fiesta.buzonConfig,
        welcomeAudioUrl,
        welcomeAudioPath: storagePath,
        enabled: true,
      },
    };

    const result = await saveFiesta(updatedFiesta);
    if (!result.success) {
      return { success: false, error: result.error || 'Error al guardar los ajustes de la fiesta.' };
    }

    return { success: true, welcomeAudioUrl };
  } catch (error: any) {
    logger.warn('[buzon] uploadWelcomeAudio failed:', error);
    return { success: false, error: 'Error al subir audio de bienvenida: ' + (error.message || error) };
  }
}

/**
 * Deletes the hosts' welcome message.
 */
export async function deleteWelcomeAudio(
  fiestaId: string
): Promise<{ success: boolean; error?: string }> {
  if (!fiestaId) return { success: false, error: 'ID de fiesta es requerido.' };
  try {
    await requireAppSession();
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };

    const audioPath = fiesta.buzonConfig?.welcomeAudioPath;

    if (audioPath) {
      await deleteFromStorage(audioPath).catch((err) => {
        logger.warn('[buzon] Failed to delete welcome audio from storage:', err);
      });
    }

    const updatedFiesta = {
      ...fiesta,
      buzonConfig: {
        ...fiesta.buzonConfig,
        welcomeAudioUrl: '',
        welcomeAudioPath: '',
      },
    };

    const result = await saveFiesta(updatedFiesta);
    if (!result.success) {
      return { success: false, error: result.error || 'Error al actualizar configuración.' };
    }

    return { success: true };
  } catch (error: any) {
    logger.warn('[buzon] deleteWelcomeAudio failed:', error);
    return { success: false, error: error.message || 'Error al borrar audio de bienvenida.' };
  }
}
export async function updateBuzonFrameTemplate(fiestaId: string, template: string, customText?: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAppSession();
    if (!isFrameTemplateId(template)) {
      return { success: false, error: 'Plantilla de video no válida.' };
    }
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };

    const updatedFiesta = {
      ...fiesta,
      buzonConfig: {
        ...fiesta.buzonConfig,
        customText: typeof customText === 'string'
          ? customText.trim().slice(0, 80)
          : fiesta.buzonConfig?.customText || '',
      }
    };

    const result = await saveFiesta(updatedFiesta);
    return result.success ? { success: true } : { success: false, error: result.error };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

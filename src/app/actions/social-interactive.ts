
'use server';

/**
 * Social Interactive actions — polls, song requests, dedications.
 *
 * All data is persisted directly to Firestore (bypassing the generic
 * readData / writeData helpers) so that concurrent operations are safe:
 *
 *   • createPoll / getPolls / getActivePoll — individual poll documents
 *   • votePoll — Firestore transaction (no votes are lost under concurrency)
 *   • addSongRequest / voteSongRequest — FieldValue.increment (atomic)
 *   • addDedication / highlightDedication — individual dedication documents
 *
 * Settings that live on the fiesta document (sorteo participants, momentos,
 * activeGame) still use saveFiesta — those paths are low-frequency writes
 * that don't have the 200-concurrent-user problem.
 */

import type { SocialPoll, SongRequest, Dedication, SorteoParticipant, FiestaMomento } from '@/types/social-gallery';
import type { SocialGallerySettings } from '@/types/fiesta';
import type { Firestore, QueryDocumentSnapshot, Transaction } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import * as logger from '@/lib/logger';
import { reviewSocialContent, sanitizeSocialText } from '@/lib/social-fiesta/content-review';
import { getSignedUrl, uploadToStorage } from '@/lib/firebase/storage';
import { hasAppSession, requireAppSession } from '@/lib/auth/require-session';
import {
  canReadDedications,
  isDedicationAudioOwnedByEvent,
  validateDedicationAudioFile,
} from '@/lib/social-fiesta/guardrails';

// Firestore collection names
const POLLS_COLLECTION = 'social_polls';
const SONGS_COLLECTION = 'social_song_requests';
const DEDICATIONS_COLLECTION = 'social_dedications';

function dedicationAudioExtension(contentType: string): string {
  switch (contentType.toLowerCase()) {
    case 'audio/ogg':
      return 'ogg';
    case 'audio/mp4':
      return 'm4a';
    case 'audio/mpeg':
      return 'mp3';
    case 'audio/wav':
    case 'audio/x-wav':
      return 'wav';
    default:
      return 'webm';
  }
}

/** Returns the Firestore Admin instance; throws if Firebase is not configured. */
async function getDb(): Promise<Firestore> {
  const { dbAdmin } = await import('@/lib/firebase/server');
  if (!dbAdmin) throw new Error('Firestore no disponible.');
  return dbAdmin as Firestore;
}

// ─────────────────────────── POLLS ───────────────────────────

export async function getPolls(fiestaId: string): Promise<SocialPoll[]> {
  try {
    const db = await getDb();
    const snapshot = await db
      .collection(POLLS_COLLECTION)
      .where('fiestaId', '==', fiestaId)
      .get();
    return snapshot.docs
      .map((doc: QueryDocumentSnapshot) => doc.data() as SocialPoll)
      .sort((a: SocialPoll, b: SocialPoll) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    logger.warn('[social-interactive] getPolls failed:', e);
    return [];
  }
}

export async function getActivePoll(fiestaId: string): Promise<SocialPoll | null> {
  try {
    const db = await getDb();
    const snapshot = await db
      .collection(POLLS_COLLECTION)
      .where('fiestaId', '==', fiestaId)
      .get();
    return snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as SocialPoll).find((p: SocialPoll) => p.active) ?? null;
  } catch {
    return null;
  }
}

export async function createPoll(
  fiestaId: string,
  question: string,
  options: string[]
): Promise<{ success: boolean; poll?: SocialPoll; error?: string }> {
  try {
    await requireAppSession();
    const questionReview = reviewSocialContent({ type: 'text', text: question, moderationMode: 'automatico' });
    if (questionReview.status === 'blocked') return { success: false, error: questionReview.message };
    const reviewedOptions = options.map((option) => reviewSocialContent({ type: 'text', text: option, moderationMode: 'automatico' }));
    const blockedOption = reviewedOptions.find((review) => review.status === 'blocked');
    if (blockedOption) return { success: false, error: blockedOption.message };

    const db = await getDb();
    // Deactivate any currently active poll for this event.
    const activeSnap = await db
      .collection(POLLS_COLLECTION)
      .where('fiestaId', '==', fiestaId)
      .get();
    const deactivateBatch = db.batch();
    activeSnap.docs
      .filter((doc: QueryDocumentSnapshot) => (doc.data() as SocialPoll).active)
      .forEach((doc: QueryDocumentSnapshot) => deactivateBatch.update(doc.ref, { active: false }));
    await deactivateBatch.commit();

    const newPoll: SocialPoll = {
      id: `poll_${Date.now()}`,
      fiestaId,
      question: questionReview.sanitizedText || sanitizeSocialText(question),
      options: reviewedOptions.map((review, i) => ({ id: `opt_${i}`, text: review.sanitizedText || sanitizeSocialText(options[i]), votes: 0 })),
      createdAt: new Date().toISOString(),
      active: true,
    };
    await db.collection(POLLS_COLLECTION).doc(newPoll.id).set(newPoll);
    return { success: true, poll: newPoll };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function votePoll(
  fiestaId: string,
  pollId: string,
  optionId: string
): Promise<{ success: boolean; poll?: SocialPoll; error?: string }> {
  try {
    const db = await getDb();
    const ref = db.collection(POLLS_COLLECTION).doc(pollId);
    // Transaction guarantees that every concurrent vote is counted — no vote is lost.
    const updatedPoll = await db.runTransaction(async (tx: Transaction) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error('Encuesta no encontrada.');
      const data = snap.data() as SocialPoll;
      if (data.fiestaId !== fiestaId) throw new Error('Encuesta no pertenece a este evento.');
      const optIdx = data.options.findIndex(o => o.id === optionId);
      if (optIdx === -1) throw new Error('Opción no encontrada.');
      const updatedOptions = data.options.map(o =>
        o.id === optionId ? { ...o, votes: o.votes + 1 } : o
      );
      tx.update(ref, { options: updatedOptions });
      return { ...data, options: updatedOptions };
    });
    return { success: true, poll: updatedPoll };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function closePoll(
  fiestaId: string,
  pollId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAppSession();
    const db = await getDb();
    await db.collection(POLLS_COLLECTION).doc(pollId).update({ active: false });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ─────────────────────────── SONG REQUESTS ───────────────────────────

export async function getSongRequests(fiestaId: string): Promise<SongRequest[]> {
  try {
    const db = await getDb();
    const snapshot = await db
      .collection(SONGS_COLLECTION)
      .where('fiestaId', '==', fiestaId)
      .get();
    return snapshot.docs
      .map((doc: QueryDocumentSnapshot) => doc.data() as SongRequest)
      .sort((a: SongRequest, b: SongRequest) => b.votes - a.votes);
  } catch {
    return [];
  }
}

export async function addSongRequest(
  fiestaId: string,
  song: string,
  requestedBy: string
): Promise<{ success: boolean; request?: SongRequest; error?: string }> {
  try {
    const review = reviewSocialContent({ type: 'text', text: song, authorName: requestedBy, moderationMode: 'automatico' });
    if (review.status === 'blocked') return { success: false, error: review.message };
    const db = await getDb();
    const newReq: SongRequest = {
      id: `song_${Date.now()}`,
      fiestaId,
      song: review.sanitizedText || sanitizeSocialText(song),
      requestedBy: sanitizeSocialText(requestedBy) || 'Anónimo',
      timestamp: new Date().toISOString(),
      played: false,
      votes: 1,
    };
    await db.collection(SONGS_COLLECTION).doc(newReq.id).set(newReq);
    return { success: true, request: newReq };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function voteSongRequest(
  fiestaId: string,
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb();
    // Atomic increment — concurrent votes are all counted.
    await db.collection(SONGS_COLLECTION).doc(requestId).update({
      votes: admin.firestore.FieldValue.increment(1),
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function markSongPlayed(
  fiestaId: string,
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAppSession();
    const db = await getDb();
    await db.collection(SONGS_COLLECTION).doc(requestId).update({ played: true });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ─────────────────────────── DEDICATIONS ───────────────────────────

export async function getDedications(fiestaId: string): Promise<Dedication[]> {
  try {
    const [fiesta, adminSession] = await Promise.all([
      getFiestaById(fiestaId),
      hasAppSession(),
    ]);
    if (!fiesta) return [];
    const privateMode = fiesta.socialGallerySettings?.privateDedicationsMode === true;
    if (!canReadDedications(privateMode, adminSession)) return [];

    const db = await getDb();
    const snapshot = await db
      .collection(DEDICATIONS_COLLECTION)
      .where('fiestaId', '==', fiestaId)
      .get();
    const dedications = snapshot.docs
      .map((doc: QueryDocumentSnapshot) => doc.data() as Dedication)
      .filter((dedication) => adminSession || dedication.visibility !== 'private')
      .sort((a: Dedication, b: Dedication) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return Promise.all(dedications.map(async (dedication) => {
      if (!dedication.audioUrl || dedication.audioUrl.startsWith('http')) return dedication;
      const signedUrl = await getSignedUrl(dedication.audioUrl);
      return signedUrl ? { ...dedication, audioUrl: signedUrl } : { ...dedication, audioUrl: undefined };
    }));
  } catch {
    return [];
  }
}

export async function addDedication(
  fiestaId: string,
  message: string,
  authorName: string,
  audioUrl?: string
): Promise<{ success: boolean; dedication?: Dedication; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado.' };
    if (fiesta.socialGallerySettings?.showDedications === false) {
      return { success: false, error: 'Las dedicatorias estan deshabilitadas para este evento.' };
    }
    if (audioUrl && !isDedicationAudioOwnedByEvent(audioUrl, fiestaId)) {
      return { success: false, error: 'El audio no pertenece a este evento.' };
    }
    const review = reviewSocialContent({ type: 'text', text: message, authorName, moderationMode: 'automatico' });
    if (review.status === 'blocked') return { success: false, error: review.message };
    const db = await getDb();
    const newDed: Dedication = {
      id: `ded_${Date.now()}`,
      fiestaId,
      message: review.sanitizedText || sanitizeSocialText(message),
      authorName: sanitizeSocialText(authorName) || 'Anónimo',
      timestamp: new Date().toISOString(),
      visibility: fiesta.socialGallerySettings?.privateDedicationsMode ? 'private' : 'public',
      ...(audioUrl ? { audioUrl } : {}),
    };
    await db.collection(DEDICATIONS_COLLECTION).doc(newDed.id).set(newDed);
    return { success: true, dedication: newDed };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function highlightDedication(
  fiestaId: string,
  dedicationId: string,
  highlighted: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAppSession();
    const db = await getDb();
    await db.collection(DEDICATIONS_COLLECTION).doc(dedicationId).update({ highlighted });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ─────────────────────────── SORTEO / PARTICIPANTES REDES ───────────────────────────

export async function addSorteoParticipanteRedes(
  fiestaId: string,
  nombre: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const review = reviewSocialContent({ type: 'text', text: nombre, authorName: nombre, moderationMode: 'automatico' });
    if (review.status === 'blocked') return { success: false, error: review.message };
    const safeName = sanitizeSocialText(nombre);
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
    const settings = fiesta.socialGallerySettings ?? ({} as SocialGallerySettings);
    const existing = settings.sorteoParticipantesRedes ?? [];
    const alreadyExists = existing.some(p => p.nombre.toLowerCase() === safeName.toLowerCase());
    if (alreadyExists) return { success: false, error: 'Ya estás registrado en el sorteo.' };
    const updated: typeof existing = [...existing, { nombre: safeName, timestamp: new Date().toISOString() }];
    await saveFiesta({ ...fiesta, socialGallerySettings: { ...settings, sorteoParticipantesRedes: updated } });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function addSorteoGanador(
  fiestaId: string,
  nombre: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAppSession();
    const review = reviewSocialContent({ type: 'text', text: nombre, authorName: nombre, moderationMode: 'automatico' });
    if (review.status === 'blocked') return { success: false, error: review.message };
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
    const settings = fiesta.socialGallerySettings ?? ({} as SocialGallerySettings);
    const ganadores = [...(settings.sorteoGanadores ?? []), sanitizeSocialText(nombre)];
    await saveFiesta({ ...fiesta, socialGallerySettings: { ...settings, sorteoGanadores: ganadores } });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ─────────────────────────── MOMENTOS ───────────────────────────

export async function activateMomento(
  fiestaId: string,
  momento: FiestaMomento
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAppSession();
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
    const settings = fiesta.socialGallerySettings ?? ({} as SocialGallerySettings);
    const existing = settings.momentosActivos ?? [];
    const withActivated = [
      ...existing.filter(m => m.id !== momento.id),
      { ...momento, timestamp: new Date().toISOString() },
    ];
    await saveFiesta({
      ...fiesta,
      socialGallerySettings: { ...settings, momentosActivos: withActivated },
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function uploadDedicationAudio(
  fiestaId: string,
  formData: FormData
): Promise<{ success: boolean; audioUrl?: string; error?: string }> {
  try {
    const file = formData.get('file') as File | null;
    if (!fiestaId || !file || !(file instanceof File)) return { success: false, error: 'Faltan datos.' };
    const validationError = validateDedicationAudioFile(file);
    if (validationError) return { success: false, error: validationError };

    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado.' };
    if (fiesta.socialGallerySettings?.showDedications === false) {
      return { success: false, error: 'Las dedicatorias estan deshabilitadas para este evento.' };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const audioId = `audio_${crypto.randomUUID()}`;
    const extension = dedicationAudioExtension(file.type);
    const storagePath = `dedications-audio/${fiestaId}/${audioId}.${extension}`;
    const privateMode = fiesta.socialGallerySettings?.privateDedicationsMode === true;
    const url = await uploadToStorage(buffer, storagePath, file.type, !privateMode);
    return { success: true, audioUrl: privateMode ? storagePath : url };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al subir audio.' };
  }
}

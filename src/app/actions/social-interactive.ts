
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
import admin from 'firebase-admin';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import * as logger from '@/lib/logger';

// Firestore collection names
const POLLS_COLLECTION = 'social_polls';
const SONGS_COLLECTION = 'social_song_requests';
const DEDICATIONS_COLLECTION = 'social_dedications';

/** Returns the Firestore Admin instance; throws if Firebase is not configured. */
async function getDb(): Promise<FirebaseFirestore.Firestore> {
  const { dbAdmin } = await import('@/lib/firebase/server');
  if (!dbAdmin) throw new Error('Firestore no disponible.');
  return dbAdmin;
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
      .map(doc => doc.data() as SocialPoll)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    return snapshot.docs.map(doc => doc.data() as SocialPoll).find(p => p.active) ?? null;
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
    const db = await getDb();
    // Deactivate any currently active poll for this event.
    const activeSnap = await db
      .collection(POLLS_COLLECTION)
      .where('fiestaId', '==', fiestaId)
      .get();
    const deactivateBatch = db.batch();
    activeSnap.docs
      .filter(doc => (doc.data() as SocialPoll).active)
      .forEach(doc => deactivateBatch.update(doc.ref, { active: false }));
    await deactivateBatch.commit();

    const newPoll: SocialPoll = {
      id: `poll_${Date.now()}`,
      fiestaId,
      question,
      options: options.map((text, i) => ({ id: `opt_${i}`, text, votes: 0 })),
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
    const updatedPoll = await db.runTransaction(async (tx) => {
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
      .map(doc => doc.data() as SongRequest)
      .sort((a, b) => b.votes - a.votes);
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
    const db = await getDb();
    const newReq: SongRequest = {
      id: `song_${Date.now()}`,
      fiestaId,
      song,
      requestedBy,
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
    const db = await getDb();
    const snapshot = await db
      .collection(DEDICATIONS_COLLECTION)
      .where('fiestaId', '==', fiestaId)
      .get();
    return snapshot.docs
      .map(doc => doc.data() as Dedication)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch {
    return [];
  }
}

export async function addDedication(
  fiestaId: string,
  message: string,
  authorName: string
): Promise<{ success: boolean; dedication?: Dedication; error?: string }> {
  try {
    const db = await getDb();
    const newDed: Dedication = {
      id: `ded_${Date.now()}`,
      fiestaId,
      message,
      authorName,
      timestamp: new Date().toISOString(),
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
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
    const settings = fiesta.socialGallerySettings ?? ({} as SocialGallerySettings);
    const existing = settings.sorteoParticipantesRedes ?? [];
    const alreadyExists = existing.some(p => p.nombre.toLowerCase() === nombre.toLowerCase());
    if (alreadyExists) return { success: false, error: 'Ya estás registrado en el sorteo.' };
    const updated: typeof existing = [...existing, { nombre, timestamp: new Date().toISOString() }];
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
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
    const settings = fiesta.socialGallerySettings ?? ({} as SocialGallerySettings);
    const ganadores = [...(settings.sorteoGanadores ?? []), nombre];
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

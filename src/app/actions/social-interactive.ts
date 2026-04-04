
'use server';

import type { SocialPoll, SongRequest, Dedication, SorteoParticipant, FiestaMomento } from '@/types/social-gallery';
import type { SocialGallerySettings } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';

// File path helpers
const pollsFile = (fiestaId: string) => `social-interactive/${fiestaId}-polls.json`;
const songsFile = (fiestaId: string) => `social-interactive/${fiestaId}-songs.json`;
const dedicationsFile = (fiestaId: string) => `social-interactive/${fiestaId}-dedications.json`;

// ─────────────────────────── POLLS ───────────────────────────

export async function getPolls(fiestaId: string): Promise<SocialPoll[]> {
  return readData<SocialPoll[]>(pollsFile(fiestaId), []);
}

export async function getActivePoll(fiestaId: string): Promise<SocialPoll | null> {
  const polls = await getPolls(fiestaId);
  return polls.find(p => p.active) ?? null;
}

export async function createPoll(
  fiestaId: string,
  question: string,
  options: string[]
): Promise<{ success: boolean; poll?: SocialPoll; error?: string }> {
  try {
    const polls = await getPolls(fiestaId);
    // Deactivate any existing active poll
    const updated = polls.map(p => ({ ...p, active: false }));
    const newPoll: SocialPoll = {
      id: `poll_${Date.now()}`,
      fiestaId,
      question,
      options: options.map((text, i) => ({ id: `opt_${i}`, text, votes: 0 })),
      createdAt: new Date().toISOString(),
      active: true,
    };
    updated.push(newPoll);
    await writeData(pollsFile(fiestaId), updated);
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
    const polls = await getPolls(fiestaId);
    const idx = polls.findIndex(p => p.id === pollId);
    if (idx === -1) return { success: false, error: 'Encuesta no encontrada.' };
    const optIdx = polls[idx].options.findIndex(o => o.id === optionId);
    if (optIdx === -1) return { success: false, error: 'Opción no encontrada.' };
    polls[idx].options[optIdx].votes += 1;
    await writeData(pollsFile(fiestaId), polls);
    return { success: true, poll: polls[idx] };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function closePoll(fiestaId: string, pollId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const polls = await getPolls(fiestaId);
    const updated = polls.map(p => p.id === pollId ? { ...p, active: false } : p);
    await writeData(pollsFile(fiestaId), updated);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ─────────────────────────── SONG REQUESTS ───────────────────────────

export async function getSongRequests(fiestaId: string): Promise<SongRequest[]> {
  const all = await readData<SongRequest[]>(songsFile(fiestaId), []);
  return all.sort((a, b) => b.votes - a.votes);
}

export async function addSongRequest(
  fiestaId: string,
  song: string,
  requestedBy: string
): Promise<{ success: boolean; request?: SongRequest; error?: string }> {
  try {
    const requests = await readData<SongRequest[]>(songsFile(fiestaId), []);
    const newReq: SongRequest = {
      id: `song_${Date.now()}`,
      fiestaId,
      song,
      requestedBy,
      timestamp: new Date().toISOString(),
      played: false,
      votes: 1,
    };
    requests.push(newReq);
    await writeData(songsFile(fiestaId), requests);
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
    const requests = await readData<SongRequest[]>(songsFile(fiestaId), []);
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx === -1) return { success: false, error: 'Pedido no encontrado.' };
    requests[idx].votes += 1;
    await writeData(songsFile(fiestaId), requests);
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
    const requests = await readData<SongRequest[]>(songsFile(fiestaId), []);
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx === -1) return { success: false, error: 'Pedido no encontrado.' };
    requests[idx].played = true;
    await writeData(songsFile(fiestaId), requests);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ─────────────────────────── DEDICATIONS ───────────────────────────

export async function getDedications(fiestaId: string): Promise<Dedication[]> {
  return readData<Dedication[]>(dedicationsFile(fiestaId), []);
}

export async function addDedication(
  fiestaId: string,
  message: string,
  authorName: string
): Promise<{ success: boolean; dedication?: Dedication; error?: string }> {
  try {
    const dedications = await getDedications(fiestaId);
    const newDed: Dedication = {
      id: `ded_${Date.now()}`,
      fiestaId,
      message,
      authorName,
      timestamp: new Date().toISOString(),
    };
    dedications.push(newDed);
    await writeData(dedicationsFile(fiestaId), dedications);
    return { success: true, dedication: newDed };
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

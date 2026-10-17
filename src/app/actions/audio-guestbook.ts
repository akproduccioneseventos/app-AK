'use server';

import { readData, writeData } from '@/lib/data-service';

export interface AudioGuestbookEntry {
  id: string;
  fiestaId: string;
  autor: string;
  mesa?: string;
  audioBase64OrUrl: string;
  duracionSegundos: number;
  mensajeEscrito?: string;
  grabadoAt: string;
  escuchadoPorCliente?: boolean;
}

const AUDIO_GUESTBOOK_FILE = 'fiesta-audio-guestbook.json';

export async function getAudioGuestbookEntriesAction(fiestaId: string): Promise<{
  success: boolean;
  entries?: AudioGuestbookEntry[];
}> {
  try {
    const list = await readData<AudioGuestbookEntry[]>(AUDIO_GUESTBOOK_FILE, []);
    const filtered = list.filter((e) => e.fiestaId === fiestaId);
    return { success: true, entries: filtered };
  } catch {
    return { success: false, entries: [] };
  }
}

export async function saveAudioGuestbookEntryAction(params: {
  fiestaId: string;
  autor: string;
  mesa?: string;
  audioBase64OrUrl: string;
  duracionSegundos: number;
  mensajeEscrito?: string;
}): Promise<{ success: boolean; entry?: AudioGuestbookEntry; error?: string }> {
  try {
    const list = await readData<AudioGuestbookEntry[]>(AUDIO_GUESTBOOK_FILE, []);
    const nueva: AudioGuestbookEntry = {
      id: `audio_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      fiestaId: params.fiestaId,
      autor: (params.autor || 'Invitado anónimo').trim(),
      mesa: params.mesa?.trim(),
      audioBase64OrUrl: params.audioBase64OrUrl,
      duracionSegundos: Math.max(1, params.duracionSegundos || 10),
      mensajeEscrito: params.mensajeEscrito?.trim(),
      grabadoAt: new Date().toISOString(),
    };
    list.unshift(nueva);
    await writeData(AUDIO_GUESTBOOK_FILE, list);
    return { success: true, entry: nueva };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al guardar audio.' };
  }
}

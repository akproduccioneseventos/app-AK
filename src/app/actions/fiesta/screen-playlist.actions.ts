'use server';

import type { ScreenPlaylist, PlaylistItem } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';

export async function getScreenPlaylist(fiestaId: string): Promise<ScreenPlaylist | null> {
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return null;
  return fiesta.screenPlaylist ?? null;
}

export async function saveScreenPlaylist(fiestaId: string, playlist: ScreenPlaylist): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada' };
    const updated = { ...fiesta, screenPlaylist: playlist };
    await saveFiesta(updated);
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updatePlaylistItem(fiestaId: string, itemId: string, updates: Partial<PlaylistItem>): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada' };
    const playlist: ScreenPlaylist = fiesta.screenPlaylist ?? { items: [], loop: true, orientation: 'landscape', isPlaying: false, currentIndex: 0 };
    const idx = playlist.items.findIndex(i => i.id === itemId);
    if (idx === -1) return { success: false, error: 'Item no encontrado' };
    playlist.items[idx] = { ...playlist.items[idx], ...updates };
    const updated = { ...fiesta, screenPlaylist: playlist };
    await saveFiesta(updated);
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

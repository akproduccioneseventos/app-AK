'use server';

import path from 'path';
import { uploadToStorage } from '@/lib/firebase/storage';
import { getFiestaById, getFiestas, saveFiesta } from './fiesta.actions';
import type { ActiveGameData, ScreenMediaAsset, ScreenModeSettings, SocialGalleryBrand, SocialGallerySettings } from '@/types/fiesta';

/** Maximum allowed video upload size (bytes) — leaves headroom below the 20 MB Next.js bodySizeLimit */
const MAX_VIDEO_UPLOAD_BYTES = 18 * 1024 * 1024;
/** Maximum allowed image upload size (bytes) */
const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;

function normalizeSocialSettings(settings?: SocialGallerySettings): SocialGallerySettings {
  return {
    enabled: settings?.enabled ?? true,
    allowLikes: settings?.allowLikes ?? true,
    allowComments: settings?.allowComments ?? true,
    uploadsActive: settings?.uploadsActive ?? true,
    chatEnabled: settings?.chatEnabled ?? true,
    showPolls: settings?.showPolls ?? true,
    showSongRequests: settings?.showSongRequests ?? true,
    showDedications: settings?.showDedications ?? true,
    marketingTickerText: settings?.marketingTickerText ?? '',
    ledMarqueeText: settings?.ledMarqueeText ?? '',
    ...settings,
  };
}

function extensionFromMimeType(mimeType: string, fallbackExt: string) {
  if (mimeType.includes('mp4')) return '.mp4';
  if (mimeType.includes('webm')) return '.webm';
  if (mimeType.includes('ogg')) return '.ogg';
  if (mimeType.includes('quicktime')) return '.mov';
  if (mimeType.includes('png')) return '.png';
  if (mimeType.includes('webp')) return '.webp';
  if (mimeType.includes('gif')) return '.gif';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return '.jpg';
  return fallbackExt || '.bin';
}

function createScreenAssetId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `screen_asset_${crypto.randomUUID()}`;
  }
  return `screen_asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function patchScreenMode(
  fiestaId: string,
  patch: Partial<ScreenModeSettings>
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
    const currentMode = fiesta.socialGallerySettings?.screenMode;
    const updatedMode: ScreenModeSettings = {
      enabled: currentMode?.enabled ?? true,
      loop: currentMode?.loop ?? true,
      isPlaying: currentMode?.isPlaying ?? false,
      currentItemIndex: currentMode?.currentItemIndex ?? 0,
      playlist: currentMode?.playlist ?? [],
      ...currentMode,
      ...patch,
    };
    await saveFiesta({
      ...fiesta,
      socialGallerySettings: {
        ...normalizeSocialSettings(fiesta.socialGallerySettings),
        screenMode: updatedMode,
      },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al actualizar pantalla.' };
  }
}

/** Inicia la reproducción de la playlist en la pantalla gigante */
export async function playScreenPlaylist(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  return patchScreenMode(fiestaId, { isPlaying: true, startedAt: new Date().toISOString() });
}

/** Pausa la reproducción de la playlist en la pantalla gigante */
export async function pauseScreenPlaylist(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  return patchScreenMode(fiestaId, { isPlaying: false });
}

/** Avanza al siguiente ítem de la playlist */
export async function nextScreenItem(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
    const mode = fiesta.socialGallerySettings?.screenMode;
    const enabledItems = (mode?.playlist ?? []).filter(i => i.enabled);
    if (enabledItems.length === 0) return { success: false, error: 'No hay ítems en la playlist.' };
    const currentIndex = mode?.currentItemIndex ?? 0;
    const nextIndex = (currentIndex + 1) % enabledItems.length;
    return patchScreenMode(fiestaId, { currentItemIndex: nextIndex });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Retrocede al ítem anterior de la playlist */
export async function prevScreenItem(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
    const mode = fiesta.socialGallerySettings?.screenMode;
    const enabledItems = (mode?.playlist ?? []).filter(i => i.enabled);
    if (enabledItems.length === 0) return { success: false, error: 'No hay ítems en la playlist.' };
    const currentIndex = mode?.currentItemIndex ?? 0;
    const prevIndex = (currentIndex - 1 + enabledItems.length) % enabledItems.length;
    return patchScreenMode(fiestaId, { currentItemIndex: prevIndex });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Activa o desactiva el modo loop de la playlist */
export async function setScreenLoop(fiestaId: string, loop: boolean): Promise<{ success: boolean; error?: string }> {
  return patchScreenMode(fiestaId, { loop });
}

/** Actualiza el texto del cartel LED en la pantalla gigante */
export async function updateLedMessage(
  fiestaId: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
    await saveFiesta({
      ...fiesta,
      socialGallerySettings: {
        ...normalizeSocialSettings(fiesta.socialGallerySettings),
        ledMarqueeText: text,
      },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al actualizar mensaje LED.' };
  }
}

/** Registra un momento especial en vivo (aparece como overlay en la pantalla gigante) */
export async function triggerLiveMoment(
  fiestaId: string,
  moment: { id: string; nombre: string; emoji: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
    const existing = fiesta.socialGallerySettings?.momentosActivos ?? [];
    const newMoment = { ...moment, timestamp: new Date().toISOString() };
    await saveFiesta({
      ...fiesta,
      socialGallerySettings: {
        ...normalizeSocialSettings(fiesta.socialGallerySettings),
        momentosActivos: [...existing, newMoment],
      },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al registrar momento.' };
  }
}

/** Actualiza la información de marca (branding) de la pantalla gigante */
export async function updateScreenBrand(
  fiestaId: string,
  brand: SocialGalleryBrand
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
    await saveFiesta({
      ...fiesta,
      socialGallerySettings: {
        ...normalizeSocialSettings(fiesta.socialGallerySettings),
        brand,
      },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al actualizar marca.' };
  }
}

export async function uploadScreenMediaAsset(
  fiestaId: string,
  file: File
): Promise<{ success: boolean; asset?: ScreenMediaAsset; error?: string }> {
  try {
    if (!fiestaId || !file) return { success: false, error: 'Datos incompletos.' };
    // Explicit size check with a clear message (bodySizeLimit in next.config.js is 20MB)
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? MAX_VIDEO_UPLOAD_BYTES : MAX_IMAGE_UPLOAD_BYTES;
    if (file.size > maxSize) {
      return {
        success: false,
        error: `El archivo es demasiado grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Máximo permitido: ${(maxSize / 1024 / 1024).toFixed(0)} MB.`,
      };
    }

    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };

    const ext = extensionFromMimeType(file.type || '', path.extname(file.name));
    const id = createScreenAssetId();
    const storagePath = `screen-mode/${fiestaId}/${id}${ext}`;
    const bytes = await file.arrayBuffer();
    const url = await uploadToStorage(Buffer.from(bytes), storagePath, file.type || 'application/octet-stream', true);

    const asset: ScreenMediaAsset = {
      id,
      url,
      type: isVideo ? 'video' : 'image',
      sourceFiestaId: fiestaId,
      sourceFiestaNombre: fiesta.configuracion.nombreEvento,
      createdAt: new Date().toISOString(),
      title: file.name,
    };

    const nextLibrary = [...(fiesta.socialGallerySettings?.screenMediaLibrary ?? []), asset];
    await saveFiesta({
      ...fiesta,
      socialGallerySettings: {
        ...normalizeSocialSettings(fiesta.socialGallerySettings),
        screenMediaLibrary: nextLibrary,
      },
    });

    return { success: true, asset };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudo subir el medio.' };
  }
}

export async function getGlobalScreenMediaLibrary(): Promise<ScreenMediaAsset[]> {
  const fiestas = await getFiestas(false);
  const dedup = new Map<string, ScreenMediaAsset>();
  for (const fiesta of fiestas) {
    for (const asset of fiesta.socialGallerySettings?.screenMediaLibrary ?? []) {
      if (!dedup.has(asset.id)) dedup.set(asset.id, asset);
    }
  }
  return Array.from(dedup.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Lanza un juego en la pantalla gigante en tiempo real */
export async function launchGame(
  fiestaId: string,
  game: Omit<ActiveGameData, 'launchedAt'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
    const activeGame: ActiveGameData = { ...game, launchedAt: new Date().toISOString() };
    await saveFiesta({
      ...fiesta,
      socialGallerySettings: {
        ...normalizeSocialSettings(fiesta.socialGallerySettings),
        activeGame,
      },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al lanzar el juego.' };
  }
}

/** Detiene el juego activo y lo elimina de la pantalla gigante */
export async function clearActiveGame(
  fiestaId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
    const settings = normalizeSocialSettings(fiesta.socialGallerySettings);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { activeGame: _removed, ...settingsWithoutGame } = settings;
    await saveFiesta({ ...fiesta, socialGallerySettings: settingsWithoutGame });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al detener el juego.' };
  }
}

/** Lanza un sorteo y muestra el ganador en la pantalla gigante */
export async function triggerSorteoWinner(
  fiestaId: string,
  winner: string,
  premio?: string
): Promise<{ success: boolean; error?: string }> {
  const MAX_SORTEO_HISTORY = 50;
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
    const settings = normalizeSocialSettings(fiesta.socialGallerySettings);
    const previousWinners = settings.sorteoGanadores ?? [];
    // Keep only the last MAX_SORTEO_HISTORY winners to prevent unbounded growth
    const updatedWinners = [...previousWinners, winner].slice(-MAX_SORTEO_HISTORY);
    await saveFiesta({
      ...fiesta,
      socialGallerySettings: {
        ...settings,
        activeSorteoWinner: winner,
        activeSorteoTimestamp: new Date().toISOString(),
        sorteoGanadores: updatedWinners,
        ...(premio !== undefined ? { sorteoPremio: premio } : {}),
      },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al lanzar sorteo.' };
  }
}

/** Inicia la animación de la ruleta en la pantalla gigante (antes de revelar el ganador) */
export async function startSorteoSpinOnScreen(
  fiestaId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
    const settings = normalizeSocialSettings(fiesta.socialGallerySettings);
    await saveFiesta({
      ...fiesta,
      socialGallerySettings: {
        ...settings,
        sorteoSpinStartedAt: new Date().toISOString(),
        activeSorteoWinner: undefined,
      },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al iniciar animación.' };
  }
}

/** Registra un voto en una opción del juego activo */
export async function voteActiveGameOption(
  fiestaId: string,
  optionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
    const settings = normalizeSocialSettings(fiesta.socialGallerySettings);
    const activeGame = settings.activeGame;
    if (!activeGame) return { success: false, error: 'No hay juego activo.' };
    const updatedOptions = (activeGame.options ?? []).map(opt =>
      opt.id === optionId ? { ...opt, votes: (opt.votes ?? 0) + 1 } : opt
    );
    await saveFiesta({
      ...fiesta,
      socialGallerySettings: {
        ...settings,
        activeGame: { ...activeGame, options: updatedOptions },
      },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al votar.' };
  }
}

/** Actualiza la configuración del cartel LED (colores, habilitado) */
export async function updateLedConfig(
  fiestaId: string,
  config: { text?: string; enabled?: boolean; color?: string; bgColor?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
    const settings = normalizeSocialSettings(fiesta.socialGallerySettings);
    await saveFiesta({
      ...fiesta,
      socialGallerySettings: {
        ...settings,
        ...(config.text !== undefined ? { ledMarqueeText: config.text } : {}),
        ...(config.enabled !== undefined ? { ledMarqueeEnabled: config.enabled } : {}),
        ...(config.color !== undefined ? { ledMarqueeColor: config.color } : {}),
        ...(config.bgColor !== undefined ? { ledMarqueeBgColor: config.bgColor } : {}),
      },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al actualizar cartel LED.' };
  }
}

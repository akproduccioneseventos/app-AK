'use server';

import path from 'path';
import { randomInt } from 'crypto';
import { uploadToStorage } from '@/lib/firebase/storage';
import { getFiestaById, getFiestas, saveFiesta } from './fiesta.actions';
import type { ActiveGameData, ScreenMediaAsset, ScreenModeSettings, ScreenPlaylistItem, SocialGalleryBrand, SocialGallerySettings } from '@/types/fiesta';
import type { TriviaGame } from '@/lib/games/game-engine';
import { topTrivia } from '@/lib/games/juegos-en-vivo';
import admin from 'firebase-admin';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { enforceSocialInteractionRateLimit } from '@/lib/commercial/social-interaction-rate-limit';
import { requireAppSession, requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import { requireEventPermission } from '@/lib/auth/event-access';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import { sinBaseDisponible } from '@/lib/firebase/modo-local';
import { readData } from '@/lib/data-service';
import * as logger from '@/lib/logger';
import {
  calcularEstadisticasEnVivo,
  type GuestPresenceRecord,
  type LiveEventStats,
} from '@/lib/social-fiesta/estadisticas-en-vivo';

/** Maximum allowed video upload size (bytes) — leaves headroom below the 20 MB Next.js bodySizeLimit */
const MAX_VIDEO_UPLOAD_BYTES = 18 * 1024 * 1024;
/** Maximum allowed image upload size (bytes) */
const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
const PRESENCE_COLLECTION = 'social_guest_presence';

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
    privateDedicationsMode: settings?.privateDedicationsMode ?? false,
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

const DEFAULT_SCREEN_PLAYLIST: ScreenPlaylistItem[] = [
  { id: 'item_video', type: 'video', title: 'Video publicitario', durationSeconds: 20, enabled: true, layout: 'auto' },
  { id: 'item_mural', type: 'mural', title: 'Mural de fotos', durationSeconds: 30, enabled: true, layout: 'auto' },
  { id: 'item_audioritmico', type: 'audioritmico', title: 'Momento discoteca', durationSeconds: 25, enabled: false, layout: 'auto' },
  {
    id: 'item_redes',
    type: 'redes',
    title: 'Pantalla de redes',
    durationSeconds: 15,
    enabled: true,
    layout: 'auto',
    socialTemplate: {
      templateId: 'vip',
      showInstagram: true,
      showTikTok: true,
      showWhatsApp: true,
      showFacebook: false,
      ctaText: 'Seguinos y escaneá el QR',
    },
  },
];

type ScreenModePatch =
  | Partial<ScreenModeSettings>
  | ((currentMode: ScreenModeSettings | undefined) => Partial<ScreenModeSettings>);

async function patchScreenMode(
  fiestaId: string,
  patch: ScreenModePatch
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    const resultado = await actualizarFiesta(fiestaId, (fiesta) => {
      const currentMode = fiesta.socialGallerySettings?.screenMode;
      const patchValues = typeof patch === 'function' ? patch(currentMode) : patch;
      const updatedMode: ScreenModeSettings = {
        enabled: currentMode?.enabled ?? true,
        loop: currentMode?.loop ?? true,
        isPlaying: currentMode?.isPlaying ?? false,
        currentItemIndex: currentMode?.currentItemIndex ?? 0,
        playlist: currentMode?.playlist && currentMode.playlist.length > 0 ? currentMode.playlist : DEFAULT_SCREEN_PLAYLIST,
        ...currentMode,
        ...patchValues,
      };
      return {
        ...fiesta,
        socialGallerySettings: {
          ...normalizeSocialSettings(fiesta.socialGallerySettings),
          screenMode: updatedMode,
        },
      };
    });
    if (!resultado.success) {
      return { success: false, error: resultado.error || 'Error al actualizar pantalla.' };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al actualizar pantalla.' };
  }
}

/** Inicia la reproducción de la playlist en la pantalla gigante */
export async function playScreenPlaylist(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  return patchScreenMode(fiestaId, { isPlaying: true, startedAt: new Date().toISOString() });
}

/** Pausa la reproducción de la playlist en la pantalla gigante */
export async function pauseScreenPlaylist(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  return patchScreenMode(fiestaId, { isPlaying: false });
}

/** Avanza al siguiente ítem de la playlist */
export async function nextScreenItem(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  await requireEventPermission(fiestaId, PERMISOS.NOCHE);
  return patchScreenMode(fiestaId, (mode) => {
    const playlist = mode?.playlist && mode.playlist.length > 0 ? mode.playlist : DEFAULT_SCREEN_PLAYLIST;
    if (playlist.length === 0) return {};
    const current = mode?.currentItemIndex ?? 0;
    const next = (current + 1) % playlist.length;
    return { playlist, currentItemIndex: next, startedAt: new Date().toISOString() };
  });
}

/** Retrocede al ítem anterior de la playlist */
export async function prevScreenItem(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  await requireEventPermission(fiestaId, PERMISOS.NOCHE);
  return patchScreenMode(fiestaId, (mode) => {
    const playlist = mode?.playlist && mode.playlist.length > 0 ? mode.playlist : DEFAULT_SCREEN_PLAYLIST;
    if (playlist.length === 0) return {};
    const current = mode?.currentItemIndex ?? 0;
    const prev = (current - 1 + playlist.length) % playlist.length;
    return { playlist, currentItemIndex: prev, startedAt: new Date().toISOString() };
  });
}

/** Salta directamente a un ítem por su ID o tipo */
export async function goToScreenItem(fiestaId: string, itemId: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  return patchScreenMode(fiestaId, (mode) => {
    const playlist = mode?.playlist && mode.playlist.length > 0 ? mode.playlist : DEFAULT_SCREEN_PLAYLIST;
    const idx = playlist.findIndex((i) => i.id === itemId || i.type === itemId);
    if (idx === -1) {
      throw new Error('Ítem no encontrado en la playlist.');
    }
    return { playlist, currentItemIndex: idx, startedAt: new Date().toISOString() };
  });
}

/** Configura si la pantalla gigante debe ciclar en bucle continuo */
export async function setScreenLoop(fiestaId: string, loop: boolean): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  return patchScreenMode(fiestaId, { loop });
}

/** Actualiza el texto del cartel LED en la pantalla gigante */
export async function updateLedMessage(
  fiestaId: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    const resultado = await actualizarFiesta(fiestaId, (fiesta) => ({
      ...fiesta,
      socialGallerySettings: {
        ...normalizeSocialSettings(fiesta.socialGallerySettings),
        ledMarqueeText: text,
        ledMarqueeEnabled: text.trim().length > 0 ? true : (fiesta.socialGallerySettings?.ledMarqueeEnabled ?? true),
      },
    }));
    if (!resultado.success) {
      return { success: false, error: resultado.error || 'Error al actualizar mensaje LED.' };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al actualizar mensaje LED.' };
  }
}

/**
 * Obtiene el estado en vivo de la pantalla gigante para el control remoto desde celular.
 * Requiere permisos de noche (PERMISOS.NOCHE).
 */
export async function obtenerEstadoControlPantalla(fiestaId: string): Promise<{
  success: boolean;
  authorized?: boolean;
  error?: string;
  fiestaNombre?: string;
  isPlaying?: boolean;
  currentItemIndex?: number;
  currentItem?: { id: string; title: string; type: string };
  playlist?: ScreenPlaylistItem[];
  ledMarqueeText?: string;
  activeGame?: ActiveGameData | null;
  activeSorteoWinner?: string | null;
  sorteoSpinStartedAt?: string | null;
  sorteoCandidatos?: string[];
  triviaGame?: TriviaGame | null;
  triviaRanking?: { nombre: string; puntos: number }[];
}> {
  try {
    const fiesta = await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    const settings = normalizeSocialSettings(fiesta.socialGallerySettings);
    const mode = settings.screenMode;
    const playlist = mode?.playlist && mode.playlist.length > 0 ? mode.playlist : DEFAULT_SCREEN_PLAYLIST;
    const currentItemIndex = mode?.currentItemIndex ?? 0;
    const currentItem = playlist[currentItemIndex % playlist.length] || playlist[0];

    return {
      success: true,
      authorized: true,
      fiestaNombre: fiesta.configuracion?.nombreEvento || (fiesta as any).nombre || 'Fiesta',
      isPlaying: mode?.isPlaying ?? false,
      currentItemIndex,
      currentItem: currentItem ? { id: currentItem.id, title: currentItem.title, type: currentItem.type } : undefined,
      playlist,
      ledMarqueeText: settings.ledMarqueeText || '',
      activeGame: settings.activeGame || null,
      activeSorteoWinner: settings.activeSorteoWinner || null,
      sorteoSpinStartedAt: settings.sorteoSpinStartedAt || null,
      sorteoCandidatos: settings.sorteoCandidatos ?? [],
      triviaGame: fiesta.triviaGame || null,
      triviaRanking: topTrivia(fiesta),
    };
  } catch (error: any) {
    const msg = error.message || 'Error de acceso';
    return {
      success: false,
      authorized: false,
      error: msg.includes('permiso') || msg.includes('asignado') || msg.includes('sesión') || msg.includes('Sesion')
        ? 'Acceso no autorizado. Se requieren permisos de noche.'
        : msg,
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const verificarAccesoControlPantalla = obtenerEstadoControlPantalla;

/**
 * Calcula estadísticas en vivo reales de la fiesta para la consola del operador.
 * No inventa números: si no hay actividad devuelve 0 / null.
 */
export async function obtenerEstadisticasEnVivo(
  fiestaId: string,
): Promise<{ success: boolean; stats?: LiveEventStats; error?: string }> {
  try {
    const fiesta = await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    const { getSocialPosts } = await import('@/app/actions/social-gallery');
    const { getPolls, getSongRequests } = await import('@/app/actions/social-interactive');

    const presencesPromise = (async (): Promise<GuestPresenceRecord[]> => {
      if (sinBaseDisponible()) {
        return readData<GuestPresenceRecord[]>(`social-gallery/presences-${fiestaId}.json`, []);
      }
      const { dbAdmin } = await import('@/lib/firebase/server');
      if (!dbAdmin) return [];
      const snap = await dbAdmin
        .collection(PRESENCE_COLLECTION)
        .where('fiestaId', '==', fiestaId)
        .get();
      return snap.docs.map((doc: QueryDocumentSnapshot) => doc.data() as GuestPresenceRecord);
    })();

    const [postsRes, pollsRes, songsRes, presencesRes] = await Promise.allSettled([
      getSocialPosts(fiestaId),
      getPolls(fiestaId),
      getSongRequests(fiestaId),
      presencesPromise,
    ]);

    const stats = calcularEstadisticasEnVivo({
      invitados: fiesta.invitados,
      presences: presencesRes.status === 'fulfilled' ? presencesRes.value : [],
      posts: postsRes.status === 'fulfilled' ? postsRes.value : [],
      polls: pollsRes.status === 'fulfilled' ? pollsRes.value : [],
      songs: songsRes.status === 'fulfilled' ? songsRes.value : [],
      activeGame: fiesta.socialGallerySettings?.activeGame ?? null,
      triviaParticipants: fiesta.triviaGame?.participants ?? [],
    });

    return { success: true, stats };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'No se pudieron obtener las estadísticas en vivo.',
    };
  }
}

/** Registra un momento especial en vivo (aparece como overlay en la pantalla gigante) */
export async function triggerLiveMoment(
  fiestaId: string,
  moment: { id: string; nombre: string; emoji: string }
): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  try {
    const fiesta = await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    const existing = fiesta.socialGallerySettings?.momentosActivos ?? [];
    const newMoment = { ...moment, timestamp: new Date().toISOString() };
    const guardado = await saveFiesta({
      ...fiesta,
      socialGallerySettings: {
        ...normalizeSocialSettings(fiesta.socialGallerySettings),
        momentosActivos: [...existing, newMoment],
      },
    });
    if (!guardado.success) {
      return { success: false, error: guardado.error || 'Error al registrar momento.' };
    }
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
  await requireAppSession();
  try {
    const fiesta = await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    const guardado = await saveFiesta({
      ...fiesta,
      socialGallerySettings: {
        ...normalizeSocialSettings(fiesta.socialGallerySettings),
        brand,
      },
    });
    if (!guardado.success) {
      return { success: false, error: guardado.error || 'Error al actualizar marca.' };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al actualizar marca.' };
  }
}

export async function uploadScreenMediaAsset(
  formData: FormData
): Promise<{ success: boolean; asset?: ScreenMediaAsset; error?: string }> {
  try {
    const fiestaId = formData.get('fiestaId') as string | null;
    const file = formData.get('file') as File | null;
    if (!fiestaId || !file) return { success: false, error: 'Datos incompletos.' };
    const fiesta = await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    // Explicit size check with a clear message (bodySizeLimit in next.config.js is 20MB)
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? MAX_VIDEO_UPLOAD_BYTES : MAX_IMAGE_UPLOAD_BYTES;
    if (file.size > maxSize) {
      return {
        success: false,
        error: `El archivo es demasiado grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Máximo permitido: ${(maxSize / 1024 / 1024).toFixed(0)} MB.`,
      };
    }

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
    const guardado = await saveFiesta({
      ...fiesta,
      socialGallerySettings: {
        ...normalizeSocialSettings(fiesta.socialGallerySettings),
        screenMediaLibrary: nextLibrary,
      },
    });
    if (!guardado.success) {
      return { success: false, error: guardado.error || 'No se pudo guardar el archivo en la biblioteca de la pantalla.' };
    }

    return { success: true, asset };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudo subir el medio.' };
  }
}

export interface GlobalScreenMediaLibraryResult {
  assets: ScreenMediaAsset[];
  skippedFiestas: number;
  error?: string;
  codigoError?: string;
}

function generarRefBibliotecaMuro(): string {
  const tiempo = Date.now().toString(36).slice(-4).toUpperCase();
  const azar = Math.random().toString(36).slice(2, 4).toUpperCase();
  return `REF-MURO-LIB-${tiempo}${azar}`;
}

export async function getGlobalScreenMediaLibrary(): Promise<GlobalScreenMediaLibraryResult> {
  const permiso = await requirePermiso(PERMISOS.NOCHE);
  if (!permiso.ok) {
    return {
      assets: [],
      skippedFiestas: 0,
      error: permiso.error || 'Tu perfil no tiene permisos para consultar la biblioteca global.',
      codigoError: generarRefBibliotecaMuro(),
    };
  }
  try {
    const fiestas = await getFiestas(false);
    const dedup = new Map<string, ScreenMediaAsset>();
    let skippedFiestas = 0;

    for (const fiesta of Array.isArray(fiestas) ? fiestas : []) {
      try {
        if (!fiesta || typeof fiesta !== 'object') {
          skippedFiestas += 1;
          continue;
        }
        const rawLibrary = fiesta.socialGallerySettings?.screenMediaLibrary;
        if (rawLibrary === undefined || rawLibrary === null) continue;
        if (!Array.isArray(rawLibrary)) {
          skippedFiestas += 1;
          logger.warn('[screen-mode] Se omitió biblioteca de fiesta con formato inválido:', fiesta.id);
          continue;
        }
        for (const asset of rawLibrary) {
          if (!asset || typeof asset !== 'object') continue;
          if (typeof asset.id !== 'string' || !asset.id.trim()) continue;
          if (typeof asset.url !== 'string' || !asset.url.trim()) continue;
          if (!dedup.has(asset.id)) {
            dedup.set(asset.id, {
              ...asset,
              createdAt: typeof asset.createdAt === 'string' ? asset.createdAt : '',
            });
          }
        }
      } catch (fiestaErr) {
        skippedFiestas += 1;
        logger.warn('[screen-mode] Se omitió una fiesta al armar la biblioteca global:', fiesta?.id, fiestaErr);
      }
    }

    const assets = Array.from(dedup.values()).sort((a, b) =>
      (b.createdAt || '').localeCompare(a.createdAt || ''),
    );
    return { assets, skippedFiestas };
  } catch (err) {
    const codigoError = generarRefBibliotecaMuro();
    logger.error(`[screen-mode] (${codigoError}) Error al leer la biblioteca global de medios:`, err);
    return {
      assets: [],
      skippedFiestas: 0,
      error: 'No se pudo consultar la lista de fiestas para armar la biblioteca global.',
      codigoError,
    };
  }
}

/** Lanza un juego en la pantalla gigante en tiempo real */
export async function launchGame(
  fiestaId: string,
  game: Omit<ActiveGameData, 'launchedAt'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    if (game.type === 'trivia' && fiesta.triviaGame && !fiesta.triviaGame.confirmadaPorEquipo) {
      return { success: false, error: 'La trivia debe estar confirmada por el equipo antes de jugar.' };
    }
    // Una trivia lleva SU respuesta correcta (la elige el operador al lanzar) y nace sin revelar:
    // ese dato no sale hacia los celulares hasta que se revela (ver `ocultarRespuestaCorrecta`).
    if (game.type === 'trivia' && !(game.options || []).some((o) => o.id === game.correctOptionId)) {
      return { success: false, error: 'Elegí cuál es la respuesta correcta antes de lanzar la trivia.' };
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { isFinished: _f, respuestaRevelada: _r, topJugadores: _t, tableLeaderboard: _l, ...limpio } = game;
    const activeGame: ActiveGameData = {
      ...limpio,
      // `saveFiesta` mezcla campos y nunca borra: se pisan a mano los de la trivia anterior.
      ...(game.type === 'trivia' ? { respuestaRevelada: false, isFinished: false, topJugadores: [] } : {}),
      launchedAt: new Date().toISOString(),
    };
    const guardado = await saveFiesta({
      ...fiesta,
      socialGallerySettings: {
        ...normalizeSocialSettings(fiesta.socialGallerySettings),
        activeGame,
      },
    });
    if (!guardado.success) {
      return { success: false, error: guardado.error || 'Error al lanzar el juego.' };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al lanzar el juego.' };
  }
}

/** Detiene el juego activo y lo elimina de la pantalla gigante */
export async function clearActiveGame(
  fiestaId: string
): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  try {
    await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    // Use a direct Firestore update with FieldValue.delete() to explicitly remove the
    // activeGame nested field.  The generic saveFiesta path uses { merge: true } which
    // only adds/updates fields — it NEVER deletes existing ones, so the game would stay
    // visible on the screen even after pressing "Detener".
    const { dbAdmin } = await import('@/lib/firebase/server');
    if (dbAdmin) {
      await dbAdmin.collection('fiestas').doc(fiestaId).update({
        'socialGallerySettings.activeGame': admin.firestore.FieldValue.delete(),
      });
      return { success: true };
    }
    // Fallback for environments without Firestore (local JSON-only dev)
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
    const settings = normalizeSocialSettings(fiesta.socialGallerySettings);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { activeGame: _removed, ...settingsWithoutGame } = settings;
    const guardado = await saveFiesta({ ...fiesta, socialGallerySettings: settingsWithoutGame });
    if (!guardado.success) {
      return { success: false, error: guardado.error || 'Error al detener el juego.' };
    }
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
  await requireAppSession();
  const MAX_SORTEO_HISTORY = 50;
  try {
    const fiesta = await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    const settings = normalizeSocialSettings(fiesta.socialGallerySettings);
    const previousWinners = settings.sorteoGanadores ?? [];
    // Keep only the last MAX_SORTEO_HISTORY winners to prevent unbounded growth
    const updatedWinners = [...previousWinners, winner].slice(-MAX_SORTEO_HISTORY);
    const guardado = await saveFiesta({
      ...fiesta,
      socialGallerySettings: {
        ...settings,
        activeSorteoWinner: winner,
        activeSorteoTimestamp: new Date().toISOString(),
        sorteoGanadores: updatedWinners,
        ...(premio !== undefined ? { sorteoPremio: premio } : {}),
      },
    });
    if (!guardado.success) {
      return { success: false, error: guardado.error || 'Error al lanzar sorteo.' };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al lanzar sorteo.' };
  }
}

/** Inicia la animación de la ruleta en la pantalla gigante (antes de revelar el ganador) */
export async function startSorteoSpinOnScreen(
  fiestaId: string
): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  try {
    const fiesta = await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    const settings = normalizeSocialSettings(fiesta.socialGallerySettings);
    const guardado = await saveFiesta({
      ...fiesta,
      socialGallerySettings: {
        ...settings,
        sorteoSpinStartedAt: new Date().toISOString(),
        sorteoOnScreen: false,
        activeSorteoWinner: undefined,
      },
    });
    if (!guardado.success) {
      return { success: false, error: guardado.error || 'Error al iniciar animación.' };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al iniciar animación.' };
  }
}

/** Lanza un sorteo eligiendo el ganador en el servidor con crypto.randomInt */
export async function sortearGanadorEnServidor(
  fiestaId: string,
  opciones?: { premio?: string; candidatos?: string[] },
): Promise<{ success: boolean; winner?: string; error?: string }> {
  await requireAppSession();
  const MAX_SORTEO_HISTORY = 50;
  try {
    const fiesta = await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    const settings = normalizeSocialSettings(fiesta.socialGallerySettings);

    const normalizeCandidatos = (list?: string[]) =>
      Array.isArray(list)
        ? list.map((c) => c.trim()).filter(Boolean)
        : [];

    const fromInput = normalizeCandidatos(opciones?.candidatos);
    const fromSaved = normalizeCandidatos(settings.sorteoCandidatos);
    const pool = fromInput.length > 0 ? fromInput : fromSaved;

    if (pool.length === 0) {
      return {
        success: false,
        error: 'Cargá los participantes del sorteo primero.',
      };
    }

    const winner = pool[randomInt(0, pool.length)];
    const previousWinners = settings.sorteoGanadores ?? [];
    const updatedWinners = [...previousWinners, winner].slice(-MAX_SORTEO_HISTORY);

    const guardado = await saveFiesta({
      ...fiesta,
      socialGallerySettings: {
        ...settings,
        ...(fromInput.length > 0 ? { sorteoCandidatos: fromInput } : {}),
        activeSorteoWinner: winner,
        activeSorteoTimestamp: new Date().toISOString(),
        sorteoGanadores: updatedWinners,
        ...(opciones?.premio !== undefined ? { sorteoPremio: opciones.premio } : {}),
      },
    });
    if (!guardado.success) {
      return { success: false, error: guardado.error || 'Error al lanzar sorteo.' };
    }
    return { success: true, winner };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al lanzar sorteo.' };
  }
}

/** Transfiere la ruleta del sorteo a la pantalla gigante (modo estático, sin girar) */
export async function transferSorteoToScreen(
  fiestaId: string,
  candidatos?: string[],
): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  try {
    const fiesta = await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    const settings = normalizeSocialSettings(fiesta.socialGallerySettings);
    const cleanedCandidatos = Array.isArray(candidatos)
      ? candidatos.map((c) => c.trim()).filter(Boolean)
      : undefined;
    const guardado = await saveFiesta({
      ...fiesta,
      socialGallerySettings: {
        ...settings,
        ...(cleanedCandidatos !== undefined ? { sorteoCandidatos: cleanedCandidatos } : {}),
        sorteoOnScreen: true,
        activeSorteoWinner: undefined,
        sorteoSpinStartedAt: undefined,
      },
    });
    if (!guardado.success) {
      return { success: false, error: guardado.error || 'Error al transferir sorteo a pantalla.' };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al transferir sorteo a pantalla.' };
  }
}

/**
 * Registra un voto en una opción del juego activo.
 *
 * Como las encuestas (13/10/2026): antes el tope era 40 votos por minuto para TODA la fiesta desde
 * la misma red, y en el wifi del salón el voto 41 se rechazaba. Ahora cuenta un voto por teléfono
 * por juego lanzado (repetirlo no suma) y el tope de la red es alto.
 */
export async function voteActiveGameOption(
  fiestaId: string,
  optionId: string,
  dispositivoId?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const dispositivo = typeof dispositivoId === 'string' && /^[a-zA-Z0-9-]{8,64}$/.test(dispositivoId) ? dispositivoId : null;
    await enforcePublicRateLimit({
      scope: 'social-active-game-vote',
      identity: fiestaId,
      limit: 600,
      windowMs: 60_000,
    });
    if (dispositivo) {
      await enforcePublicRateLimit({
        scope: 'social-active-game-vote-telefono',
        identity: `${fiestaId}:${dispositivo}`,
        limit: 10,
        windowMs: 60_000,
        ignoreClientAddress: true,
      });
    }
    const { dbAdmin } = await import('@/lib/firebase/server');
    if (!dbAdmin) throw new Error('Base de datos no disponible.');
    const ref = dbAdmin.collection('fiestas').doc(fiestaId);
    await dbAdmin.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new Error('Fiesta no encontrada.');
      const stored = snapshot.data() as { socialGallerySettings?: SocialGallerySettings };
      const settings = normalizeSocialSettings(stored.socialGallerySettings);
      const activeGame = settings.activeGame;
      if (!activeGame) throw new Error('No hay juego activo.');
      if (!(activeGame.options ?? []).some((option) => option.id === optionId)) {
        throw new Error('Opción de juego no válida.');
      }
      // Un voto por teléfono en cada juego lanzado: si ya votó (o reintenta), no suma otra vez.
      const votoRef = dispositivo
        ? dbAdmin.collection('social_game_votes').doc(`${fiestaId}__${activeGame.launchedAt.replace(/[^0-9a-zA-Z]/g, '')}__${dispositivo}`)
        : null;
      const votoPrevio = votoRef ? await transaction.get(votoRef) : null;
      if (votoPrevio?.exists) return;
      const updatedOptions = (activeGame.options ?? []).map((option) =>
        option.id === optionId ? { ...option, votes: (option.votes ?? 0) + 1 } : option
      );
      transaction.update(ref, {
        'socialGallerySettings.activeGame': { ...activeGame, options: updatedOptions },
        _syncedAt: new Date().toISOString(),
      });
      if (votoRef) transaction.set(votoRef, { fiestaId, launchedAt: activeGame.launchedAt, optionId, createdAt: new Date().toISOString() });
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
  await requireAppSession();
  try {
    const fiesta = await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    const settings = normalizeSocialSettings(fiesta.socialGallerySettings);
    const guardado = await saveFiesta({
      ...fiesta,
      socialGallerySettings: {
        ...settings,
        ...(config.text !== undefined ? { ledMarqueeText: config.text } : {}),
        ...(config.enabled !== undefined ? { ledMarqueeEnabled: config.enabled } : {}),
        ...(config.color !== undefined ? { ledMarqueeColor: config.color } : {}),
        ...(config.bgColor !== undefined ? { ledMarqueeBgColor: config.bgColor } : {}),
      },
    });
    if (!guardado.success) {
      return { success: false, error: guardado.error || 'Error al actualizar cartel LED.' };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al actualizar cartel LED.' };
  }
}

/**
 * Registra que un invitado del muro social hizo clic en el botón de seguir en redes sociales.
 * Se guarda en `sorteoParticipantesRedes` para poder usar esos participantes en el sorteo.
 * Se ignoran los anónimos y las entradas duplicadas (mismo nombre + plataforma en la misma fiesta).
 */
export async function trackSocialFollowClick(
  fiestaId: string,
  authorName: string,
  platform: 'instagram' | 'facebook' | 'tiktok'
): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  if (!authorName || authorName.toLowerCase() === 'anónimo') {
    return { success: true }; // Silently ignore anonymous users
  }
  try {
    // Esta lista es la que despues entra al sorteo. Sin freno, alguien de afuera
    // podia cargarla con nombres inventados y quedarse con el premio: el control
    // de repetidos mira nombre + red, asi que cambiando el nombre pasaba igual.
    // El primer tope de este ayudante cuenta por fiesta y no depende del nombre,
    // asi que cambiarlo no lo esquiva.
    await enforceSocialInteractionRateLimit({
      scope: 'social-follow-click',
      fiestaId,
      participantIdentity: authorName,
      participantLimit: 3,
      eventLimit: 300,
      windowMs: 60 * 60 * 1000,
    });
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
    const settings = normalizeSocialSettings(fiesta.socialGallerySettings);
    const existing = settings.sorteoParticipantesRedes ?? [];
    // Avoid duplicates: same name + platform combo
    const alreadyRegistered = existing.some(
      p => p.nombre.toLowerCase() === authorName.toLowerCase() && p.platform === platform
    );
    if (alreadyRegistered) return { success: true };
    const updated = [
      ...existing,
      { nombre: authorName, timestamp: new Date().toISOString(), platform },
    ];
    const guardado = await saveFiesta({
      ...fiesta,
      socialGallerySettings: { ...settings, sorteoParticipantesRedes: updated },
    });
    if (!guardado.success) {
      return { success: false, error: guardado.error || 'Error al registrar seguidor.' };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al registrar seguidor.' };
  }
}

/**
 * Devuelve los nombres únicos (no anónimos) de invitados que interactuaron con el muro social
 * (subieron fotos, enviaron mensajes de chat, dedicatorias o pedidos de canciones).
 */
export async function getMuroParticipantesForSorteo(
  fiestaId: string
): Promise<{ success: boolean; participantes?: string[]; lecturaIncompleta?: boolean; error?: string }> {
  await requireAppSession();
  try {
    await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    // Import social actions lazily to avoid circular dependencies
    const { getSocialPosts, getChatMessages } = await import('@/app/actions/social-gallery');
    const { getDedications, getSongRequests } = await import('@/app/actions/social-interactive');

    let lecturaIncompleta = false;
    const [postsRes, dedicationsRes, songRequestsRes, chatMessagesRes] = await Promise.allSettled([
      getSocialPosts(fiestaId),
      getDedications(fiestaId),
      getSongRequests(fiestaId),
      getChatMessages(fiestaId),
    ]);

    const posts = postsRes.status === 'fulfilled' ? postsRes.value : (lecturaIncompleta = true, []);
    const dedications = dedicationsRes.status === 'fulfilled' ? dedicationsRes.value : (lecturaIncompleta = true, []);
    const songRequests = songRequestsRes.status === 'fulfilled' ? songRequestsRes.value : (lecturaIncompleta = true, []);
    const chatMessages = chatMessagesRes.status === 'fulfilled' ? chatMessagesRes.value : (lecturaIncompleta = true, []);

    const names = new Set<string>();
    const isAnon = (n: string) => !n || n.toLowerCase() === 'anónimo' || n.toLowerCase() === 'anonimo';

    for (const post of posts) {
      if (!isAnon(post.authorName)) names.add(post.authorName.trim());
    }
    for (const d of dedications) {
      if (!isAnon(d.authorName)) names.add(d.authorName.trim());
    }
    for (const s of songRequests) {
      if (!isAnon(s.requestedBy)) names.add(s.requestedBy.trim());
    }
    for (const c of chatMessages) {
      if (!isAnon(c.authorName)) names.add(c.authorName.trim());
    }

    return {
      success: true,
      participantes: Array.from(names).sort(),
      lecturaIncompleta: lecturaIncompleta || undefined,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al obtener participantes del muro.' };
  }
}

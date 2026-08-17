'use server';

import path from 'path';
import { getFiestaById, saveFiesta } from './fiesta.actions';
import { createSocialMediaPostFromUrlForStation } from '@/app/actions/social-gallery';
import { uploadToStorage } from '@/lib/firebase/storage';
import { checkImageSafety } from '@/lib/social-fiesta/content-safety-ai';
import { requireAppSession } from '@/lib/auth/require-session';
import {
  createEntertainmentAccessToken,
  hasEntertainmentGuestAccess,
} from '@/lib/auth/entertainment-token';
import {
  getEntertainmentStationConfig,
  getPublicEntertainmentEvent as buildPublicEntertainmentEvent,
  isEntertainmentModuleId,
  type EntertainmentModuleId,
} from '@/lib/entertainment/station-config';
import * as logger from '@/lib/logger';

const MAX_ENTERTAINMENT_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_ENTERTAINMENT_VIDEO_SIZE = 60 * 1024 * 1024;

const MODULE_MOMENT_TAGS: Record<string, string> = {
  fotocabina: 'Fotocabina',
  plataforma360: 'Plataforma 360',
  bogue: 'Bogue',
  espejoMagico: 'Espejo Magico',
  espejoMagicoFoto: 'Espejo Mágico Foto',
  espejoMagicoFirma: 'Espejo Mágico Firma',
  espejoMagicoIA: 'Espejo Mágico IA',
  totems: 'Tótems Interactivos',
  capsulaTiempo: 'Cápsula del Tiempo',
};
const VALID_ENTERTAINMENT_MODULE_IDS = new Set(Object.keys(MODULE_MOMENT_TAGS));

function normalizeEntertainmentData(data: any) {
  return {
    ...(data || {}),
    updatedAt: new Date().toISOString(),
  };
}

function getStoredEntertainment(fiesta: any) {
  return fiesta?.others?.entretenimiento || null;
}

export async function getEntretenimientoFiesta(fiestaId: string) {
  try {
    await requireAppSession();
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error('Fiesta no encontrada');

    return {
      success: true,
      fiesta,
      data: getStoredEntertainment(fiesta),
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudo cargar entretenimiento.' };
  }
}

export async function getPublicEntertainmentEvent(
  fiestaId: string,
  moduleId: string,
  accessToken?: string
) {
  try {
    if (!isEntertainmentModuleId(moduleId)) {
      return { success: false, error: 'Modulo de entretenimiento no valido.' };
    }
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado.' };
    if (!(await hasEntertainmentGuestAccess(fiestaId, moduleId, accessToken))) {
      return { success: false, error: 'Esta estación todavía no está habilitada. Pedile al equipo de AK que la active desde el panel de la fiesta.' };
    }
    const station = getEntertainmentStationConfig(fiesta, moduleId);
    if (!station.enabled) {
      return { success: false, error: 'Esta estacion no esta habilitada para el evento.' };
    }
    return {
      success: true,
      event: buildPublicEntertainmentEvent(fiesta, moduleId),
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudo cargar el evento.' };
  }
}

export async function getEntertainmentLaunchToken(
  fiestaId: string,
  moduleId: EntertainmentModuleId
) {
  try {
    await requireAppSession();
    if (!isEntertainmentModuleId(moduleId)) {
      return { success: false, error: 'Modulo de entretenimiento no valido.' };
    }
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado.' };
    return {
      success: true,
      guestToken: createEntertainmentAccessToken(fiestaId, moduleId, 'guest'),
      operatorToken: createEntertainmentAccessToken(fiestaId, moduleId, 'operator'),
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Sesion no autorizada.' };
  }
}

export async function saveEntretenimientoFiesta(fiestaId: string, entretenimiento: any) {
  try {
    await requireAppSession();
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error('Fiesta no encontrada');

    const nextEntertainment = normalizeEntertainmentData(entretenimiento);
    const updatedFiesta = {
      ...fiesta,
      others: {
        ...(fiesta.others || {}),
        entretenimiento: nextEntertainment,
      },
    };

    const result = await saveFiesta(updatedFiesta);
    if (!result.success) throw new Error(result.error || 'No se pudo guardar entretenimiento.');

    return { success: true, data: nextEntertainment };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudo guardar entretenimiento.' };
  }
}

export async function uploadEntretenimientoMedia(formData: FormData) {
  const fiestaId = String(formData.get('fiestaId') || '');
  const moduleId = String(formData.get('moduleId') || '');
  const caption = String(formData.get('caption') || '');
  const authorName = String(formData.get('authorName') || 'AK Producciones');
  const accessToken = String(formData.get('accessToken') || '');
  const file = formData.get('file') as File | null;

  if (!fiestaId || !moduleId || !file) {
    return { success: false, error: 'Faltan datos para subir el archivo.' };
  }

  if (!VALID_ENTERTAINMENT_MODULE_IDS.has(moduleId)) {
    return { success: false, error: 'El modulo de entretenimiento no es valido.' };
  }

  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    return { success: false, error: 'Solo se aceptan fotos o videos.' };
  }

  const maxUploadSize = file.type.startsWith('video/')
    ? MAX_ENTERTAINMENT_VIDEO_SIZE
    : MAX_ENTERTAINMENT_IMAGE_SIZE;
  if (file.size > maxUploadSize) {
    return {
      success: false,
      error: file.type.startsWith('video/')
        ? 'El video no puede superar 60MB.'
        : 'La imagen no puede superar 10MB.',
    };
  }

  try {
    if (!(await hasEntertainmentGuestAccess(fiestaId, moduleId, accessToken))) {
      return { success: false, error: 'Esta estación todavía no está habilitada. Pedile al equipo de AK que la active desde el panel de la fiesta.' };
    }
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error('Fiesta no encontrada');
    if (!isEntertainmentModuleId(moduleId)) {
      return { success: false, error: 'El modulo de entretenimiento no es valido.' };
    }
    const station = getEntertainmentStationConfig(fiesta, moduleId);
    if (!station.enabled) {
      return { success: false, error: 'Esta estacion fue desactivada.' };
    }

    const extension = path.extname(file.name || '') || (file.type.startsWith('video/') ? '.mp4' : '.jpg');
    const mediaId = `ent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const storagePath = `entertainment/${fiestaId}/${moduleId}/${mediaId}${extension}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const esVideo = file.type.startsWith('video/');

    /**
     * Todo lo que sale de una estacion va a la pantalla grande de la fiesta, asi
     * que antes se revisa. Hasta ahora no se revisaba nada: la fotocabina, el
     * espejo, la plataforma 360 y el boomerang publicaban directo.
     *
     * Las fotos pasan por el analisis automatico y se rechazan en el acto si dan
     * riesgo de contenido adulto o violento. Los videos no se pueden analizar
     * solos, y las fotos tampoco cuando el analisis no esta disponible: en esos
     * casos la publicacion queda esperando el visto bueno del equipo en vez de
     * salir a la pantalla.
     */
    let revisionManual = esVideo;
    if (!esVideo) {
      const seguridad = await checkImageSafety(buffer);
      if (!seguridad.safe) {
        return { success: false, error: 'La foto fue bloqueada por riesgo de contenido inapropiado.' };
      }
      if (seguridad.reason === 'error') revisionManual = true;
    }

    const guestId = (formData.get('guestId') as string) || undefined;
    const url = await uploadToStorage(buffer, storagePath, file.type, true);

    const socialPostResult = await createSocialMediaPostFromUrlForStation({
      fiestaId,
      mediaUrl: url,
      revisionManual,
      mediaType: esVideo ? 'video' : 'image',
      authorName,
      guestId,
      caption,
      source: 'entertainment',
      sourceModule: moduleId,
      momentTag: MODULE_MOMENT_TAGS[moduleId] || 'Entretenimiento',
    }, accessToken);

    const mediaItem = {
      id: mediaId,
      moduleId,
      fileName: file.name || `${mediaId}${extension}`,
      url,
      type: file.type.startsWith('video/') ? 'video' : 'image',
      caption,
      authorName,
      guestId,
      uploadedAt: new Date().toISOString(),
      publishTarget: 'muro-social',
      socialPostId: socialPostResult.post?.id,
      syncStatus: socialPostResult.success ? 'publicado' : 'pendiente',
    };

    const current = getStoredEntertainment(fiesta) || {};
    const modules = { ...(current.modules || {}) };
    const entertainmentModule = { ...(modules[moduleId] || {}) };
    entertainmentModule.media = [mediaItem, ...(entertainmentModule.media || [])];
    modules[moduleId] = entertainmentModule;

    const nextEntertainment = normalizeEntertainmentData({
      ...current,
      modules,
    });

    const result = await saveFiesta({
      ...fiesta,
      others: {
        ...(fiesta.others || {}),
        entretenimiento: nextEntertainment,
      },
    });

    if (!result.success) throw new Error(result.error || 'No se pudo guardar la captura.');

    return { success: true, media: mediaItem, data: nextEntertainment };
  } catch (error: any) {
    logger.error('[entretenimiento] upload failed', error);
    return { success: false, error: error.message || 'No se pudo subir el archivo.' };
  }
}

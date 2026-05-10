'use server';

import path from 'path';
import { getFiestaById, saveFiesta } from './fiesta.actions';
import { createSocialMediaPostFromUrl } from '@/app/actions/social-gallery';
import { uploadToStorage } from '@/lib/firebase/storage';
import * as logger from '@/lib/logger';

const MAX_ENTERTAINMENT_UPLOAD_SIZE = 20 * 1024 * 1024;

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

export async function saveEntretenimientoFiesta(fiestaId: string, entretenimiento: any) {
  try {
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
  const file = formData.get('file') as File | null;

  if (!fiestaId || !moduleId || !file) {
    return { success: false, error: 'Faltan datos para subir el archivo.' };
  }

  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    return { success: false, error: 'Solo se aceptan fotos o videos.' };
  }

  if (file.size > MAX_ENTERTAINMENT_UPLOAD_SIZE) {
    return { success: false, error: 'El archivo no puede superar 20MB.' };
  }

  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error('Fiesta no encontrada');

    const extension = path.extname(file.name || '') || (file.type.startsWith('video/') ? '.mp4' : '.jpg');
    const mediaId = `ent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const storagePath = `entertainment/${fiestaId}/${moduleId}/${mediaId}${extension}`;
    const bytes = await file.arrayBuffer();
    const url = await uploadToStorage(Buffer.from(bytes), storagePath, file.type, true);

    const socialPostResult = await createSocialMediaPostFromUrl({
      fiestaId,
      mediaUrl: url,
      mediaType: file.type.startsWith('video/') ? 'video' : 'image',
      authorName,
      caption,
      source: 'entertainment',
      sourceModule: moduleId,
      momentTag: moduleId === 'plataforma360' ? 'Plataforma 360' : 'Fotocabina',
    });

    const mediaItem = {
      id: mediaId,
      moduleId,
      fileName: file.name || `${mediaId}${extension}`,
      url,
      type: file.type.startsWith('video/') ? 'video' : 'image',
      caption,
      authorName,
      uploadedAt: new Date().toISOString(),
      publishTarget: 'muro-social',
      socialPostId: socialPostResult.post?.id,
      syncStatus: socialPostResult.success ? 'publicado' : 'pendiente',
    };

    const current = getStoredEntertainment(fiesta) || {};
    const modules = { ...(current.modules || {}) };
    const module = { ...(modules[moduleId] || {}) };
    module.media = [mediaItem, ...(module.media || [])];
    modules[moduleId] = module;

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

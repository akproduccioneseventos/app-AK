
'use server';

import path from 'path';
import type { VideoVidaData } from '@/types/fiesta';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { uploadToStorage, deleteFromStorage } from '@/lib/firebase/storage';
import admin from 'firebase-admin';

const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
  'presupuestador-ak-producciones.firebasestorage.app';

const VIDEO_VIDA_STORAGE_PREFIX = 'video-vida-photos';

/** Default signed URL validity: 7 days */
const SIGNED_URL_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export async function updateVideoVidaSettings(
    videoVidaData: VideoVidaData
  ): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaActual();
    const updatedFiesta = {
      ...fiesta,
      videoVida: videoVidaData,
    };
    const result = await saveFiesta(updatedFiesta);
    if (!result.success) throw new Error(result.error);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


export async function saveLifeStoryVideoPhoto(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  const file = formData.get('file') as File | null;
  const fiestaId = formData.get('fiestaId') as string | null;
  const photoNumberStr = formData.get('photoNumber') as string | null;

  if (!file || !fiestaId || !photoNumberStr) {
    return { success: false, error: 'Datos incompletos para guardar la foto.' };
  }

  const photoNumber = parseInt(photoNumberStr, 10);
  if (isNaN(photoNumber) || photoNumber < 1 || photoNumber > 50) {
    return { success: false, error: 'Número de foto inválido.' };
  }

  try {
    const fileExtension = path.extname(file.name);
    const formattedNumber = String(photoNumber).padStart(2, '0');
    const newFilename = `${formattedNumber}${fileExtension}`;
    const storagePath = `${VIDEO_VIDA_STORAGE_PREFIX}/${fiestaId}/${newFilename}`;

    const bytes = await file.arrayBuffer();
    const publicUrl = await uploadToStorage(
      Buffer.from(bytes),
      storagePath,
      file.type || 'image/jpeg',
      true
    );

    // Mark photos as uploaded in fiesta data
    const fiesta = await getFiestaActual();
    if (fiesta && fiesta.videoVida && !fiesta.videoVida.photosUploaded) {
      await updateVideoVidaSettings({ ...fiesta.videoVida, photosUploaded: true });
    }

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error('Error uploading life story photo:', error);
    return { success: false, error: 'Error al subir el archivo: ' + error.message };
  }
}

export async function getLifeStoryVideoPhotos(fiestaId: string): Promise<string[]> {
  try {
    if (!admin.apps.length) return [];
    const bucket = admin.storage().bucket(STORAGE_BUCKET);
    const prefix = `${VIDEO_VIDA_STORAGE_PREFIX}/${fiestaId}/`;
    const [files] = await bucket.getFiles({ prefix });
    if (!files.length) return [];

    const expiry = new Date(Date.now() + SIGNED_URL_EXPIRY_MS);
    const urlPromises = files.map(async (file) => {
      // If the file is public, return public URL; otherwise signed
      try {
        const [metadata] = await file.getMetadata();
        if (metadata?.acl?.some?.((a: any) => a.entity === 'allUsers')) {
          return `https://storage.googleapis.com/${STORAGE_BUCKET}/${file.name}`;
        }
      } catch { /* ignore */ }
      const [signedUrl] = await file.getSignedUrl({ action: 'read', expires: expiry });
      return signedUrl;
    });

    const urls = await Promise.all(urlPromises);
    // Sort by filename (preserves numeric order like 01.jpg, 02.jpg …)
    return urls.sort((a, b) => {
      const nameA = a.split('/').pop()?.split('?')[0] ?? '';
      const nameB = b.split('/').pop()?.split('?')[0] ?? '';
      return nameA.localeCompare(nameB, undefined, { numeric: true });
    });
  } catch {
    return [];
  }
}

export async function deleteAllVideoVidaPhotos(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!admin.apps.length) return { success: true };
    const bucket = admin.storage().bucket(STORAGE_BUCKET);
    const prefix = `${VIDEO_VIDA_STORAGE_PREFIX}/${fiestaId}/`;
    const [files] = await bucket.getFiles({ prefix });
    await Promise.all(files.map(file => file.delete().catch(() => { /* ignore */ })));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

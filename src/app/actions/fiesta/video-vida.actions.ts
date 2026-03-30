
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { FiestaEnPlanificacion, VideoVidaData } from '@/types/fiesta';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { saveFiesta } from '@/app/actions/fiesta/fiesta.actions';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const VIDEO_VIDA_DIR = path.join(DATA_DIR, 'video-vida-photos');

async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

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
    await ensureDirectoryExists(VIDEO_VIDA_DIR);
    const eventAssetDir = path.join(VIDEO_VIDA_DIR, fiestaId);
    await fs.mkdir(eventAssetDir, { recursive: true });

    const fileExtension = path.extname(file.name);
    const formattedNumber = String(photoNumber).padStart(2, '0');
    const newFilename = `${formattedNumber}${fileExtension}`;
    const filePath = path.join(eventAssetDir, newFilename);

    const bytes = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(bytes));

    const publicUrl = `/api/video-vida-photos/${fiestaId}/${newFilename}`;
    
    // Also update fiesta to mark that photos have been uploaded
    const fiesta = await getFiestaActual();
    if(fiesta && fiesta.videoVida) {
        if (!fiesta.videoVida.photosUploaded) {
            await updateVideoVidaSettings({...fiesta.videoVida, photosUploaded: true});
        }
    }
    
    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error('Error uploading life story photo:', error);
    return { success: false, error: 'Error al subir el archivo: ' + error.message };
  }
}

export async function getLifeStoryVideoPhotos(fiestaId: string): Promise<string[]> {
    const eventAssetDir = path.join(VIDEO_VIDA_DIR, fiestaId);
    try {
        await fs.access(eventAssetDir);
        const filenames = await fs.readdir(eventAssetDir);
        return filenames
            .sort((a,b) => a.localeCompare(b, undefined, { numeric: true }))
            .map(name => `/api/video-vida-photos/${fiestaId}/${name}`);
    } catch {
        return []; // Directory doesn't exist, so no photos
    }
}

export async function deleteAllVideoVidaPhotos(fiestaId: string): Promise<{ success: boolean; error?: string }> {
    const eventAssetDir = path.join(VIDEO_VIDA_DIR, fiestaId);
    try {
        await fs.rm(eventAssetDir, { recursive: true, force: true });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

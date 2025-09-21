
'use server';

import { updateVideoVidaSettings } from './fiesta/video-vida.actions';
import fs from 'fs/promises';
import path from 'path';

const VIDEO_VIDA_DIR_NAME = 'life-story-videos';
const dataDirectory = path.join(process.cwd(), 'src', 'data');
const videoVidaDirectoryPath = path.join(dataDirectory, VIDEO_VIDA_DIR_NAME);
const MAX_VIDEO_VIDA_PHOTOS = 50;

async function ensureVideoVidaDirectoryExists() {
  try { await fs.access(videoVidaDirectoryPath); } catch { await fs.mkdir(videoVidaDirectoryPath, { recursive: true }); }
}
ensureVideoVidaDirectoryExists();

export async function saveLifeStoryVideoPhotos(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const fiestaId = formData.get('fiestaId') as string;
  const files = formData.getAll('photos') as File[];
  const songSuggestion = formData.get('songSuggestion') as string | undefined;
  const customText = formData.get('customText') as string | undefined;

  if (!fiestaId) return { success: false, error: "ID de la fiesta no proporcionado." };
  if (files.length === 0) return { success: false, error: "No se subieron fotos." };
  if (files.length > MAX_VIDEO_VIDA_PHOTOS) return { success: false, error: `Se ha alcanzado el límite de ${MAX_VIDEO_VIDA_PHOTOS} fotos para el video.` };

  const eventPhotoDirPath = path.join(videoVidaDirectoryPath, fiestaId);

  try {
    await fs.mkdir(eventPhotoDirPath, { recursive: true });
    
    const existingFiles = await fs.readdir(eventPhotoDirPath);
    for (const file of existingFiles) {
        await fs.unlink(path.join(eventPhotoDirPath, file));
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExtension = path.extname(file.name);
      const newFilename = `${String(i + 1).padStart(2, '0')}${fileExtension}`;
      const filePath = path.join(eventPhotoDirPath, newFilename);
      
      const bytes = await file.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(bytes));
    }
    
    await updateVideoVidaSettings({
        photosUploaded: true,
        uploadDate: new Date().toISOString(),
        songSuggestion: songSuggestion,
        customText: customText,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error desconocido al guardar las fotos." };
  }
}

export async function getLifeStoryVideoPhotos(fiestaId: string): Promise<string[]> {
  const eventPhotoDirPath = path.join(videoVidaDirectoryPath, fiestaId);
  try {
    await fs.access(eventPhotoDirPath);
    const filenames = await fs.readdir(eventPhotoDirPath);
    return filenames.sort((a, b) => {
        const numA = parseInt(a.split('.')[0], 10);
        const numB = parseInt(b.split('.')[0], 10);
        return numA - numB;
    });
  } catch {
    return [];
  }
}

export async function getPhotoFilePathsForZip(fiestaId: string): Promise<{ path: string, name: string }[]> {
    const eventPhotoDirPath = path.join(videoVidaDirectoryPath, fiestaId);
    try {
        await fs.access(eventPhotoDirPath);
        const filenames = await fs.readdir(eventPhotoDirPath);
        return filenames.map(name => ({
            path: path.join(eventPhotoDirPath, name),
            name: name
        }));
    } catch {
        return [];
    }
}

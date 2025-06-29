
'use server';

import { getFiestaActual, updateVideoVidaSettings } from './fiesta-actual';
import fs from 'fs/promises';
import path from 'path';

const VIDEO_VIDA_DIR_NAME = 'life-story-videos';
const dataDirectory = path.join(process.cwd(), 'src', 'data');
const videoVidaDirectoryPath = path.join(dataDirectory, VIDEO_VIDA_DIR_NAME);

async function ensureVideoVidaDirectoryExists() {
  try {
    await fs.access(videoVidaDirectoryPath);
  } catch {
    await fs.mkdir(videoVidaDirectoryPath, { recursive: true });
  }
}
ensureVideoVidaDirectoryExists();


export async function saveLifeStoryVideoPhotos(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const fiestaId = formData.get('fiestaId') as string;
  const files = formData.getAll('photos') as File[];

  if (!fiestaId) {
    return { success: false, error: "ID de la fiesta no proporcionado." };
  }
  if (files.length === 0) {
    return { success: false, error: "No se subieron fotos." };
  }

  const eventPhotoDirPath = path.join(videoVidaDirectoryPath, fiestaId);

  try {
    await fs.mkdir(eventPhotoDirPath, { recursive: true });

    // Delete existing files to ensure a clean slate
    const existingFiles = await fs.readdir(eventPhotoDirPath);
    for (const file of existingFiles) {
        await fs.unlink(path.join(eventPhotoDirPath, file));
    }

    // Save new files with numeric order
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExtension = path.extname(file.name);
      const newFilename = `${String(i + 1).padStart(2, '0')}${fileExtension}`;
      const filePath = path.join(eventPhotoDirPath, newFilename);
      
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await fs.writeFile(filePath, buffer);
    }
    
    // Update fiesta data
    await updateVideoVidaSettings({
        photosUploaded: true,
        uploadDate: new Date().toISOString()
    });

    return { success: true };

  } catch (error: any) {
    console.error("Error saving life story video photos:", error);
    return { success: false, error: error.message || "Error desconocido al guardar las fotos." };
  }
}

export async function getLifeStoryVideoPhotos(fiestaId: string): Promise<string[]> {
  const eventPhotoDirPath = path.join(videoVidaDirectoryPath, fiestaId);
  try {
    await fs.access(eventPhotoDirPath);
    const filenames = await fs.readdir(eventPhotoDirPath);
    // Sort numerically based on filename (e.g., 01.jpg, 02.jpg, 10.jpg)
    return filenames.sort((a, b) => {
        const numA = parseInt(a.split('.')[0], 10);
        const numB = parseInt(b.split('.')[0], 10);
        return numA - numB;
    });
  } catch {
    return []; // Return empty array if directory doesn't exist
  }
}

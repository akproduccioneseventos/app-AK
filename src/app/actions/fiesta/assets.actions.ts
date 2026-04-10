'use server';

import fs from 'fs/promises';
import path from 'path';
import { uploadToStorage } from '@/lib/firebase/storage';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const ASSETS_DIR = path.join(DATA_DIR, 'public-page-assets');

async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

export async function uploadPublicPageAsset(
  fiestaId: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!file) {
    return { success: false, error: 'No se proporcionó ningún archivo.' };
  }

  try {
    const fileExtension = path.extname(file.name);
    const uniqueFilename = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${fileExtension}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Try Firebase Storage first (public: shown on public event landing pages)
    const storageUrl = await uploadToStorage(
      buffer,
      `public-page-assets/${fiestaId}/${uniqueFilename}`,
      file.type || 'application/octet-stream',
      true
    );
    if (storageUrl) {
      return { success: true, url: storageUrl };
    }

    // Fallback: local filesystem (development / no Firebase credentials)
    const eventAssetDir = path.join(ASSETS_DIR, fiestaId);
    await ensureDirectoryExists(eventAssetDir);
    const filePath = path.join(eventAssetDir, uniqueFilename);
    await fs.writeFile(filePath, buffer);

    return { success: true, url: `/api/public-page-assets/${fiestaId}/${uniqueFilename}` };
  } catch (error: any) {
    console.error('Error uploading asset:', error);
    return { success: false, error: 'Error al subir el archivo: ' + error.message };
  }
}

'use server';

import { readData, writeData } from '@/lib/data-service';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const ASSETS_DIR = path.join(DATA_DIR, 'public-page-assets');

async function ensureDirectoryExists() {
  try {
    await fs.access(ASSETS_DIR);
  } catch {
    await fs.mkdir(ASSETS_DIR, { recursive: true });
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
    await ensureDirectoryExists();

    const eventAssetDir = path.join(ASSETS_DIR, fiestaId);
    await fs.mkdir(eventAssetDir, { recursive: true });
    
    const fileExtension = path.extname(file.name);
    const uniqueFilename = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${fileExtension}`;
    const filePath = path.join(eventAssetDir, uniqueFilename);
    
    const bytes = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(bytes));

    const publicUrl = `/api/public-page-assets/${fiestaId}/${uniqueFilename}`;
    
    return { success: true, url: publicUrl };

  } catch (error: any) {
    console.error('Error uploading asset:', error);
    return { success: false, error: 'Error al subir el archivo: ' + error.message };
  }
}

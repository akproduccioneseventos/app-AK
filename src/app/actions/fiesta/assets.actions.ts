'use server';

import { uploadToStorage } from '@/lib/firebase/storage';
import path from 'path';

export async function uploadPublicPageAsset(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  const folder = (formData.get('folder') || formData.get('fiestaId')) as string;
  const file = formData.get('file') as File | null;

  if (!folder) {
    return { success: false, error: 'No se proporcionó la carpeta de destino.' };
  }

  if (!file) {
    return { success: false, error: 'No se proporcionó ningún archivo.' };
  }

  try {
    const fileExtension = path.extname(file.name);
    const uniqueFilename = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${fileExtension}`;
    const storagePath = `public-page-assets/${folder}/${uniqueFilename}`;

    const bytes = await file.arrayBuffer();
    const publicUrl = await uploadToStorage(Buffer.from(bytes), storagePath, file.type || 'application/octet-stream', true);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error('Error uploading asset:', error);
    return { success: false, error: 'Error al subir el archivo: ' + error.message };
  }
}

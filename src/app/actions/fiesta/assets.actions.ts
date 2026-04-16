'use server';

import { uploadToStorage } from '@/lib/firebase/storage';
import path from 'path';

export async function uploadPublicPageAsset(
  fiestaIdOrFormData: string | FormData,
  fileArg?: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  let fiestaId = '';
  let file: File | null = null;

  if (fiestaIdOrFormData instanceof FormData) {
    const fiestaIdValue = fiestaIdOrFormData.get('fiestaId');
    const fileValue = fiestaIdOrFormData.get('file');
    fiestaId = typeof fiestaIdValue === 'string' ? fiestaIdValue : '';
    file = fileValue instanceof File ? fileValue : null;
  } else {
    fiestaId = fiestaIdOrFormData;
    file = fileArg ?? null;
  }

  if (!fiestaId?.trim()) {
    return { success: false, error: 'Falta el identificador de carpeta.' };
  }

  if (!file) {
    return { success: false, error: 'No se proporcionó ningún archivo.' };
  }

  try {
    const fileExtension = path.extname(file.name);
    const uniqueFilename = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${fileExtension}`;
    const storagePath = `public-page-assets/${fiestaId}/${uniqueFilename}`;

    const bytes = await file.arrayBuffer();
    const publicUrl = await uploadToStorage(Buffer.from(bytes), storagePath, file.type || 'application/octet-stream', true);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error('Error uploading asset:', error);
    return { success: false, error: 'Error al subir el archivo: ' + error.message };
  }
}

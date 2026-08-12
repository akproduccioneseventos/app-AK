'use server';

import { uploadToStorage } from '@/lib/firebase/storage';
import { requireAppSession } from '@/lib/auth/require-session';
import path from 'path';

/**
 * Sube una imagen o un archivo al depósito de la empresa y devuelve su dirección
 * pública.
 *
 * Pide sesión del equipo: todas las pantallas que la usan son internas (fichas
 * del personal, editor de la invitación, galería, editor de la portada). Sin la
 * guarda, cualquiera de afuera podía dejar archivos en el depósito de la empresa
 * y quedaban publicados con una dirección nuestra.
 */
export async function uploadPublicPageAsset(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  await requireAppSession();

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

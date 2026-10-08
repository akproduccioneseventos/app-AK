'use server';

import { uploadToStorage } from '@/lib/firebase/storage';
import { hasAppSession } from '@/lib/auth/require-session';
import { verifyPortalSession } from '@/lib/security/portal-session';
import path from 'path';

const TOPE_PORTAL_BYTES = 10 * 1024 * 1024;

/**
 * Sube una imagen o un archivo al depósito de la empresa y devuelve su dirección
 * pública.
 *
 * Pide sesión del equipo: todas las pantallas que la usan son internas (fichas
 * del personal, editor de la invitación, galería, editor de la portada). Sin la
 * guarda, cualquiera de afuera podía dejar archivos en el depósito de la empresa
 * y quedaban publicados con una dirección nuestra.
 *
 * Excepción: el cliente sube sus ideas al moodboard desde su portal. Con la sesión
 * del portal sólo puede subir una IMAGEN, de hasta 10 MB, y SÓLO a la carpeta de su
 * propia fiesta: la sesión de la fiesta A no sirve para la carpeta de la fiesta B.
 */
export async function uploadPublicPageAsset(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  const folder = (formData.get('folder') || formData.get('fiestaId')) as string;
  const file = formData.get('file') as File | null;

  if (!(await hasAppSession())) {
    // Sin sesión del equipo: sólo pasa el cliente de ESA fiesta, con una imagen.
    const folderTexto = typeof folder === 'string' ? folder : '';
    const esDelCliente = !!folderTexto && (await verifyPortalSession(folderTexto));
    if (!esDelCliente) throw new Error('Sesion no autorizada.');
    if (file) {
      if (!String(file.type || '').startsWith('image/')) {
        return { success: false, error: 'Desde el portal sólo se pueden subir imágenes.' };
      }
      if (file.size > TOPE_PORTAL_BYTES) {
        return { success: false, error: 'La imagen pesa más de 10 MB. Probá con una más liviana.' };
      }
    }
  }

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

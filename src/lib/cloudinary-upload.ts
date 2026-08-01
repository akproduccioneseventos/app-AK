/**
 * Cloudinary Integration for AK Producciones
 * 
 * Permite subir fotos pesadas del muro social directamente a Cloudinary
 * ahorrando espacio en Firestore/Storage y optimizando la entrega con IA.
 */

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
}

/**
 * Sube una imagen en base64 o Blob a Cloudinary usando el upload preset sin firmar.
 * Ideal para el portal de invitados donde no queremos exponer secrets.
 */
export async function uploadToCloudinary(file: File | string, presetName = 'ak_social_wall'): Promise<CloudinaryUploadResponse> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    console.warn('[Cloudinary] Falta configurar NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME. Simulando subida...');
    // Simulación de éxito si no hay credenciales (fallback para desarrollo)
    return {
      secure_url: typeof file === 'string' && file.startsWith('http') ? file : 'https://picsum.photos/800/1200',
      public_id: `simulated_${Date.now()}`,
      width: 800,
      height: 1200,
      format: 'jpg'
    };
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', presetName);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const error = await res.text();
    console.error('[Cloudinary] Falló la subida:', error);
    throw new Error('No se pudo subir la foto a Cloudinary');
  }

  return await res.json();
}

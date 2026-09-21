/**
 * Publicador oficial de YouTube Data API v3 (Shorts y Videos).
 * Gratuito de por vida con cuota estándar de Google Cloud Console.
 */

import * as logger from '@/lib/logger';

export interface YouTubePublishParams {
  accessToken: string;
  videoUrl: string;
  title: string;
  description: string;
  tags?: string[];
  privacyStatus?: 'public' | 'unlisted' | 'private';
  maxSizeBytes?: number;
}

export interface YouTubePublishResult {
  success: boolean;
  videoId?: string;
  error?: string;
}

const DEFAULT_MAX_SIZE_BYTES = 150 * 1024 * 1024; // 150MB máximo para proteger memoria del servidor

export async function publishToYouTube(
  params: YouTubePublishParams
): Promise<YouTubePublishResult> {
  const {
    accessToken,
    videoUrl,
    title,
    description,
    tags = ['shorts', 'fiestas', 'eventos', 'AKProducciones'],
    privacyStatus = 'public',
    maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  } = params;

  if (!accessToken) {
    return { success: false, error: 'Falta el Access Token de Google/YouTube.' };
  }

  if (!videoUrl) {
    return { success: false, error: 'Se requiere una URL o archivo de video para subir a YouTube.' };
  }

  try {
    logger.info('[YouTubePublisher] Descargando video para subida resumable...');

    // 1. Descarga del contenido del video para verificar tamaño y preparar bytes
    const videoDownloadRes = await fetch(videoUrl);
    if (!videoDownloadRes.ok) {
      return {
        success: false,
        error: `No se pudo descargar el video origen: HTTP ${videoDownloadRes.status}`,
      };
    }

    const videoContentType = videoDownloadRes.headers.get('content-type') || 'video/mp4';
    const arrayBuffer = await videoDownloadRes.arrayBuffer();
    const videoBuffer = Buffer.from(arrayBuffer);

    if (videoBuffer.length === 0) {
      return { success: false, error: 'El archivo de video descargado está vacío.' };
    }

    if (videoBuffer.length > maxSizeBytes) {
      const mbSize = (videoBuffer.length / (1024 * 1024)).toFixed(1);
      const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
      return {
        success: false,
        error: `El video es demasiado pesado (${mbSize}MB, superando el límite seguro de ${maxMb}MB para evitar sobrecarga de memoria en el servidor).`,
      };
    }

    logger.info(`[YouTubePublisher] Video listo (${(videoBuffer.length / (1024 * 1024)).toFixed(2)}MB). Iniciando sesión resumable...`);

    const metadata = {
      snippet: {
        title: title.slice(0, 100),
        description: `${description}\n\n#Shorts #AKProducciones`,
        tags,
        categoryId: '24', // Entertainment
      },
      status: {
        privacyStatus,
        selfDeclaredMadeForKids: false,
      },
    };

    // 2. Paso 1: Iniciar subida resumable en YouTube Data API
    const initResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': videoContentType,
          'X-Upload-Content-Length': videoBuffer.length.toString(),
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!initResponse.ok) {
      let initErrorMsg = `Error HTTP ${initResponse.status} al iniciar subida`;
      try {
        const errJson = await initResponse.json();
        if (errJson.error?.message) initErrorMsg = errJson.error.message;
      } catch {}
      return { success: false, error: initErrorMsg };
    }

    const uploadUrl = initResponse.headers.get('location');
    if (!uploadUrl) {
      return { success: false, error: 'YouTube no devolvió la URL de subida resumable (falta cabecera Location).' };
    }

    logger.info('[YouTubePublisher] Subiendo bytes del video al endpoint de subida...');

    // 3. Paso 2: Subir los bytes del video a la dirección Location obtenida
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': videoContentType,
        'Content-Length': videoBuffer.length.toString(),
      },
      body: videoBuffer,
    });

    const data = await uploadResponse.json().catch(() => null);

    if (!uploadResponse.ok || !data || !data.id) {
      const errMsg = data?.error?.message || `Error HTTP ${uploadResponse.status} en la transferencia del video.`;
      logger.warn('[YouTubePublisher] Falló la subida de bytes:', errMsg);
      return { success: false, error: errMsg };
    }

    const videoId = data.id;
    logger.info('[YouTubePublisher] Video subido exitosamente a YouTube:', videoId);
    return { success: true, videoId };
  } catch (err: any) {
    logger.error('[YouTubePublisher] Excepción durante la subida:', err);
    return { success: false, error: err.message || 'Error de conexión con YouTube' };
  }
}


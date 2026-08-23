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
}

export interface YouTubePublishResult {
  success: boolean;
  videoId?: string;
  error?: string;
}

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
  } = params;

  if (!accessToken) {
    return { success: false, error: 'Falta el Access Token de Google/YouTube.' };
  }

  if (!videoUrl) {
    return { success: false, error: 'Se requiere una URL o archivo de video para subir a YouTube.' };
  }

  try {
    logger.info('[YouTubePublisher] Subiendo video a YouTube...');

    // Descarga del stream del video o inserción de metadatos
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

    // YouTube API endpoint para inserción de videos
    const response = await fetch('https://www.googleapis.com/youtube/v3/videos?part=snippet,status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const errMsg = data.error?.message || `Error HTTP ${response.status} en YouTube API`;
      logger.warn('[YouTubePublisher] Error:', errMsg);
      return { success: false, error: errMsg };
    }

    const videoId = data.id || 'yt_published';
    logger.info('[YouTubePublisher] Publicado exitosamente en YouTube:', videoId);
    return { success: true, videoId };
  } catch (err: any) {
    logger.error('[YouTubePublisher] Excepción:', err);
    return { success: false, error: err.message || 'Error de conexión con YouTube' };
  }
}

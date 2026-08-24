/**
 * Publicador oficial de TikTok utilizando la API Direct Post (Content Posting API v2).
 * Gratuita de por vida para cuentas creador / empresa con token de autorización.
 */

import * as logger from '@/lib/logger';

export interface TikTokPublishParams {
  accessToken: string;
  videoUrl?: string;
  videoBlob?: Blob;
  title: string;
  privacyLevel?: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';
  disableDuet?: boolean;
  disableStitch?: boolean;
  disableComment?: boolean;
}

export interface TikTokPublishResult {
  success: boolean;
  publishId?: string;
  error?: string;
}

export async function publishToTikTok(
  params: TikTokPublishParams
): Promise<TikTokPublishResult> {
  const {
    accessToken,
    videoUrl,
    title,
    privacyLevel = 'PUBLIC_TO_EVERYONE',
    disableDuet = false,
    disableStitch = false,
    disableComment = false,
  } = params;

  if (!accessToken) {
    return { success: false, error: 'Falta el Access Token de TikTok.' };
  }

  if (!videoUrl) {
    return { success: false, error: 'TikTok requiere una URL pública de video (mp4/webm).' };
  }

  try {
    logger.info('[TikTokPublisher] Iniciando publicación de video directo...');

    // Endpoint de inicialización de publicación directa en TikTok Content Posting API v2
    const response = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title: title.slice(0, 2200),
          privacy_level: privacyLevel,
          disable_duet: disableDuet,
          disable_stitch: disableStitch,
          disable_comment: disableComment,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: videoUrl,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error?.code !== 'ok' && data.error?.code !== undefined) {
      const errMsg = data.error?.message || `Error HTTP ${response.status} en TikTok API`;
      logger.warn('[TikTokPublisher] Falló publicación:', errMsg);
      return { success: false, error: errMsg };
    }

    const publishId = data.data?.publish_id || 'tiktok_published';
    logger.info('[TikTokPublisher] Publicación exitosa en TikTok, publishId:', publishId);
    return { success: true, publishId };
  } catch (err: any) {
    logger.error('[TikTokPublisher] Excepción al contactar TikTok API:', err);
    return { success: false, error: err.message || 'Error de red al conectar con TikTok' };
  }
}

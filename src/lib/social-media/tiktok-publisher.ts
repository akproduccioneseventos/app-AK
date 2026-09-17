/**
 * Publicador oficial de TikTok utilizando la API Direct Post (Content Posting API v2).
 * Gratuita de por vida para cuentas creador / empresa con token de autorización.
 */

import * as logger from '@/lib/logger';

export type TikTokPublishStatus = 'PUBLISH_COMPLETE' | 'FAILED' | 'PROCESSING' | 'UNKNOWN';

export interface TikTokPublishParams {
  accessToken: string;
  videoUrl?: string;
  videoBlob?: Blob;
  title: string;
  privacyLevel?: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';
  disableDuet?: boolean;
  disableStitch?: boolean;
  disableComment?: boolean;
  maxPollAttempts?: number;
  pollIntervalMs?: number;
}

export interface TikTokPublishResult {
  success: boolean;
  publishId?: string;
  status?: TikTokPublishStatus;
  message?: string;
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
    maxPollAttempts = 5,
    pollIntervalMs = 2000,
  } = params;

  if (!accessToken) {
    return { success: false, status: 'FAILED', error: 'Falta el Access Token de TikTok.' };
  }

  if (!videoUrl) {
    return { success: false, status: 'FAILED', error: 'TikTok requiere una URL pública de video (mp4/webm).' };
  }

  try {
    logger.info('[TikTokPublisher] Iniciando publicación de video directo en TikTok API v2...');

    // 1. Endpoint de inicialización de publicación directa
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

    if (!response.ok || (data.error?.code !== 'ok' && data.error?.code !== undefined && data.error?.code !== 0)) {
      const errMsg = data.error?.message || `Error HTTP ${response.status} en TikTok API`;
      logger.warn('[TikTokPublisher] Falló inicialización:', errMsg);
      return { success: false, status: 'FAILED', error: errMsg };
    }

    const publishId = data.data?.publish_id;
    if (!publishId) {
      return { success: false, status: 'FAILED', error: 'TikTok no devolvió el publish_id de la publicación.' };
    }

    logger.info('[TikTokPublisher] Publicación iniciada, publishId:', publishId);

    // 2. Sondeo de verificación de estado real (publish/status/fetch)
    for (let attempt = 1; attempt <= maxPollAttempts; attempt++) {
      if (pollIntervalMs > 0 && attempt > 1) {
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      }

      try {
        const statusRes = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ publish_id: publishId }),
        });

        if (!statusRes.ok) {
          logger.warn(`[TikTokPublisher] Intento ${attempt}: HTTP ${statusRes.status} al consultar estado.`);
          continue;
        }

        const statusData = await statusRes.json();
        const postStatus = statusData.data?.status;

        logger.info(`[TikTokPublisher] Intento ${attempt}/${maxPollAttempts} - Estado TikTok:`, postStatus);

        if (postStatus === 'PUBLISH_COMPLETE') {
          return {
            success: true,
            status: 'PUBLISH_COMPLETE',
            publishId,
          };
        }

        if (postStatus === 'FAILED') {
          const failReason = statusData.data?.fail_reason || 'TikTok rechazó la publicación del video.';
          logger.warn('[TikTokPublisher] Publicación fallida en TikTok:', failReason);
          return {
            success: false,
            status: 'FAILED',
            publishId,
            error: failReason,
          };
        }
      } catch (pollErr: any) {
        logger.warn(`[TikTokPublisher] Error en intento ${attempt} de verificación:`, pollErr.message);
      }
    }

    // Si se agotaron los intentos y aún no terminó el procesamiento
    logger.info('[TikTokPublisher] Tiempo de espera agotado. El video sigue procesándose en TikTok.');
    return {
      success: true,
      status: 'PROCESSING',
      publishId,
      message: 'Se envió a TikTok, falta que termine de procesarlo',
    };
  } catch (err: any) {
    logger.error('[TikTokPublisher] Excepción al contactar TikTok API:', err);
    return { success: false, status: 'FAILED', error: err.message || 'Error de red al conectar con TikTok' };
  }
}


/**
 * Publicador oficial de Threads API (Meta).
 * Gratuito de por vida.
 */

import * as logger from '@/lib/logger';

export interface ThreadsPublishParams {
  accessToken: string;
  threadsUserId: string;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface ThreadsPublishResult {
  success: boolean;
  threadId?: string;
  error?: string;
}

export async function publishToThreads(
  params: ThreadsPublishParams
): Promise<ThreadsPublishResult> {
  const { accessToken, threadsUserId, text, imageUrl, videoUrl } = params;

  if (!accessToken || !threadsUserId) {
    return { success: false, error: 'Falta el Access Token de Threads o el Threads User ID.' };
  }

  try {
    logger.info('[ThreadsPublisher] Creando contenedor de Thread en Meta...');

    // Paso 1: Crear contenedor de medios / texto
    const containerParams = new URLSearchParams({
      access_token: accessToken,
      media_type: videoUrl ? 'VIDEO' : imageUrl ? 'IMAGE' : 'TEXT',
      text: text.slice(0, 500),
    });

    if (imageUrl && !videoUrl) containerParams.set('image_url', imageUrl);
    if (videoUrl) containerParams.set('video_url', videoUrl);

    const containerRes = await fetch(
      `https://graph.threads.net/v1.0/${threadsUserId}/threads?${containerParams.toString()}`,
      { method: 'POST' }
    );
    const containerData = await containerRes.json();

    if (!containerRes.ok || !containerData.id) {
      const errMsg = containerData.error?.message || 'Error al crear contenedor de Threads';
      logger.warn('[ThreadsPublisher] Falló contenedor:', errMsg);
      return { success: false, error: errMsg };
    }

    const containerId = containerData.id;

    // Paso 2: Publicar el contenedor
    const publishParams = new URLSearchParams({
      access_token: accessToken,
      creation_id: containerId,
    });

    const publishRes = await fetch(
      `https://graph.threads.net/v1.0/${threadsUserId}/threads_publish?${publishParams.toString()}`,
      { method: 'POST' }
    );
    const publishData = await publishRes.json();

    if (!publishRes.ok || !publishData.id) {
      const errMsg = publishData.error?.message || 'Error al publicar contenedor en Threads';
      logger.warn('[ThreadsPublisher] Falló publicación:', errMsg);
      return { success: false, error: errMsg };
    }

    logger.info('[ThreadsPublisher] Publicado en Threads con éxito:', publishData.id);
    return { success: true, threadId: publishData.id };
  } catch (err: any) {
    logger.error('[ThreadsPublisher] Excepción:', err);
    return { success: false, error: err.message || 'Error de conexión con Threads API' };
  }
}

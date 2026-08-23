/**
 * Publicador oficial de X (Twitter) API v2.
 * Gratuito (Free Tier de Twitter Developer para 1500 tweets/mes).
 */

import * as logger from '@/lib/logger';

export interface XPublishParams {
  bearerToken?: string;
  accessToken?: string;
  text: string;
}

export interface XPublishResult {
  success: boolean;
  tweetId?: string;
  error?: string;
}

export async function publishToX(params: XPublishParams): Promise<XPublishResult> {
  const { bearerToken, accessToken, text } = params;
  const token = accessToken || bearerToken;

  if (!token) {
    return { success: false, error: 'Falta el Token de acceso de X (Twitter).' };
  }

  try {
    logger.info('[XPublisher] Publicando tweet en X...');

    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.slice(0, 280),
      }),
    });

    const data = await response.json();

    if (!response.ok || data.errors) {
      const errMsg = data.errors?.[0]?.message || data.detail || `Error HTTP ${response.status} en X API`;
      logger.warn('[XPublisher] Error:', errMsg);
      return { success: false, error: errMsg };
    }

    const tweetId = data.data?.id || 'x_tweet_published';
    logger.info('[XPublisher] Tweet publicado con éxito:', tweetId);
    return { success: true, tweetId };
  } catch (err: any) {
    logger.error('[XPublisher] Excepción:', err);
    return { success: false, error: err.message || 'Error de conexión con X API' };
  }
}

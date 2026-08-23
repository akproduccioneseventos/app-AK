/**
 * Publicador oficial de Google Business Profile (Local Posts / Novedades en Google Maps).
 * Gratuito de por vida.
 */

import * as logger from '@/lib/logger';

export interface GoogleBusinessPublishParams {
  accessToken: string;
  accountLocationId: string; // accounts/{accountId}/locations/{locationId}
  summary: string;
  callToActionUrl?: string;
  imageUrl?: string;
}

export interface GoogleBusinessPublishResult {
  success: boolean;
  postName?: string;
  error?: string;
}

export async function publishToGoogleBusiness(
  params: GoogleBusinessPublishParams
): Promise<GoogleBusinessPublishResult> {
  const { accessToken, accountLocationId, summary, callToActionUrl, imageUrl } = params;

  if (!accessToken || !accountLocationId) {
    return { success: false, error: 'Faltan credenciales de Google Business (Token o Location ID).' };
  }

  try {
    logger.info('[GoogleBusinessPublisher] Creando novedad local en Google...');

    const postPayload: Record<string, any> = {
      languageCode: 'es',
      summary: summary.slice(0, 1500),
      topicType: 'STANDARD',
    };

    if (callToActionUrl) {
      postPayload.callToAction = {
        actionType: 'LEARN_MORE',
        url: callToActionUrl,
      };
    }

    if (imageUrl) {
      postPayload.media = [
        {
          mediaFormat: 'PHOTO',
          sourceUrl: imageUrl,
        },
      ];
    }

    const endpoint = `https://mybusiness.googleapis.com/v4/${accountLocationId}/localPosts`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postPayload),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const errMsg = data.error?.message || `Error HTTP ${response.status} en Google Business API`;
      logger.warn('[GoogleBusinessPublisher] Error:', errMsg);
      return { success: false, error: errMsg };
    }

    const postName = data.name || 'google_post_published';
    logger.info('[GoogleBusinessPublisher] Novedad creada en Google con éxito:', postName);
    return { success: true, postName };
  } catch (err: any) {
    logger.error('[GoogleBusinessPublisher] Excepción:', err);
    return { success: false, error: err.message || 'Error de conexión con Google Business' };
  }
}

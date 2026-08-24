/**
 * Publicador oficial de Pinterest API v5.
 * Gratuito de por vida para cuentas comerciales de Pinterest.
 */

import * as logger from '@/lib/logger';

export interface PinterestPublishParams {
  accessToken: string;
  boardId: string;
  title: string;
  description: string;
  link?: string;
  imageUrl?: string;
}

export interface PinterestPublishResult {
  success: boolean;
  pinId?: string;
  error?: string;
}

export async function publishToPinterest(
  params: PinterestPublishParams
): Promise<PinterestPublishResult> {
  const { accessToken, boardId, title, description, link, imageUrl } = params;

  if (!accessToken || !boardId) {
    return { success: false, error: 'Falta el Access Token de Pinterest o el ID del Tablero (Board ID).' };
  }

  if (!imageUrl) {
    return { success: false, error: 'Pinterest requiere una URL de imagen obligatoria.' };
  }

  try {
    logger.info('[PinterestPublisher] Creando Pin en Pinterest...');

    const payload: Record<string, any> = {
      board_id: boardId,
      title: title.slice(0, 100),
      description: description.slice(0, 500),
      media_source: {
        source_type: 'image_url',
        url: imageUrl,
      },
    };

    if (link) {
      payload.link = link;
    }

    const response = await fetch('https://api.pinterest.com/v5/pins', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.code) {
      const errMsg = data.message || `Error HTTP ${response.status} en Pinterest API`;
      logger.warn('[PinterestPublisher] Error:', errMsg);
      return { success: false, error: errMsg };
    }

    const pinId = data.id || 'pinterest_pin_published';
    logger.info('[PinterestPublisher] Pin creado con éxito:', pinId);
    return { success: true, pinId };
  } catch (err: any) {
    logger.error('[PinterestPublisher] Excepción:', err);
    return { success: false, error: err.message || 'Error de conexión con Pinterest' };
  }
}

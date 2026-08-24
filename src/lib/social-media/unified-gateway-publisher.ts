/**
 * Publicador a través de Pasarela / Webhook Unificado (Camino B).
 * Permite que tu app envíe el posteo con 1 solo POST a un flujo de n8n,
 * Make, Upload-Post, Postiz o cualquier servidor intermedio si el usuario lo configura.
 */

import * as logger from '@/lib/logger';
import type { SocialPost } from '@/types/social-media';
import type { PlatformName } from '@/types/presencia-digital';

export interface UnifiedGatewayPayload {
  webhookUrl: string;
  apiKey?: string;
  post: SocialPost;
  targetPlatforms: PlatformName[];
}

export interface UnifiedGatewayResult {
  success: boolean;
  publishedTo?: string[];
  error?: string;
}

export async function publishToUnifiedGateway(
  params: UnifiedGatewayPayload
): Promise<UnifiedGatewayResult> {
  const { webhookUrl, apiKey, post, targetPlatforms } = params;

  if (!webhookUrl) {
    return { success: false, error: 'Falta la URL del Webhook / Pasarela Unificada.' };
  }

  try {
    logger.info('[UnifiedGateway] Enviando posteo a webhook unificado...', webhookUrl);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['X-API-Key'] = apiKey;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event: 'social_post_publish',
        post: {
          id: post.id,
          text: post.text,
          mediaUrl: post.mediaUrl,
          mediaType: post.mediaType,
          link: post.link,
          publishDate: post.publishDate,
        },
        targetPlatforms,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const textError = await response.text().catch(() => '');
      return {
        success: false,
        error: `El servidor unificado respondió con error HTTP ${response.status}: ${textError}`,
      };
    }

    const data = await response.json().catch(() => ({}));
    const publishedTo = data.publishedTo || targetPlatforms;

    logger.info('[UnifiedGateway] Publicación por pasarela exitosa:', publishedTo);
    return { success: true, publishedTo };
  } catch (err: any) {
    logger.error('[UnifiedGateway] Excepción al contactar pasarela:', err);
    return { success: false, error: err.message || 'Error de conexión con el Webhook unificado' };
  }
}

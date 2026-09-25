/**
 * Gestión de Reseñas de Google Business Profile (Lectura y Respuestas con IA).
 * Orden 86 — Bloque 4.
 */

import * as logger from '@/lib/logger';

export interface GoogleBusinessReview {
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | number | string;
  comment?: string;
  createTime: string;
  updateTime?: string;
  reviewReply?: {
    comment: string;
    updateTime?: string;
  };
  borradorSugerido?: string;
}

export interface GoogleReviewsResult {
  success: boolean;
  reviews: GoogleBusinessReview[];
  averageRating?: number;
  totalReviewCount?: number;
  error?: string;
  errorCriollo?: string;
}

export interface PublishReplyResult {
  success: boolean;
  reply?: {
    comment: string;
    updateTime: string;
  };
  error?: string;
  errorCriollo?: string;
}

/**
 * Genera un borrador cordial en criollo, sin prometer plazos ni precios
 * (decisión del dueño del 27 de agosto).
 */
export function generarBorradorRespuesta(review: {
  reviewerName?: string;
  comment?: string;
  starRating?: string | number;
}): string {
  const nombre = review.reviewerName ? ` ${review.reviewerName}` : '';
  const comentario = (review.comment || '').toLowerCase();
  const estrellas = typeof review.starRating === 'number'
    ? review.starRating
    : review.starRating === 'FIVE' ? 5
    : review.starRating === 'FOUR' ? 4
    : review.starRating === 'THREE' ? 3
    : review.starRating === 'TWO' ? 2
    : 1;

  if (estrellas >= 4) {
    if (comentario.includes('foto') || comentario.includes('cabina') || comentario.includes('touchpix')) {
      return `¡Muchas gracias${nombre} por tu reseña y por confiar en AK Producciones! 🎉 Nos alegra pila que hayan disfrutado tanto de las fotos y los recuerdos de la fiesta. ¡Un abrazo grande de todo el equipo!`;
    }
    if (comentario.includes('musica') || comentario.includes('dj') || comentario.includes('pista')) {
      return `¡Qué genio${nombre}! Muchísimas gracias por tus palabras. Nos encanta ver la pista llena y la gente disfrutando al máximo. ¡Gracias por elegir a AK Producciones! 🎶`;
    }
    return `¡Muchísimas gracias${nombre} por compartir tu experiencia con nosotros! Nos alegra un montón haber sido parte de un festejo tan especial. ¡Siempre a las órdenes en AK Producciones! 🙌✨`;
  }

  // Reseña neutral o con observaciones
  return `¡Hola${nombre}! Muchas gracias por dejarnos tu comentario sobre el servicio de AK Producciones. Valoramos mucho tu opinión para seguir mejorando la experiencia de cada evento. Quedamos a las órdenes para conversar cuando quieras.`;
}

/**
 * Lee las reseñas de la ubicación en Google Business Profile.
 */
export async function getGoogleBusinessReviews(params: {
  accessToken: string;
  accountLocationId: string;
}): Promise<GoogleReviewsResult> {
  const { accessToken, accountLocationId } = params;

  if (!accessToken || !accountLocationId) {
    return {
      success: false,
      reviews: [],
      errorCriollo: 'Google no tiene habilitado el acceso a las reseñas con esta cuenta conectada. Verificá los permisos de Google Business en Ajustes.',
      error: 'Faltan credenciales de Google Business (Token o Location ID).',
    };
  }

  try {
    const endpoint = `https://mybusiness.googleapis.com/v4/${accountLocationId}/reviews`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const status = response.status;
      let errorCriollo = 'No se pudieron consultar las reseñas de Google Business en este momento.';
      if (status === 403 || status === 401 || data.error?.status === 'PERMISSION_DENIED') {
        errorCriollo = 'Google no da acceso a las reseñas con la cuenta conectada. Verificá que la cuenta de Google tenga permisos de administración en el perfil del negocio.';
      }
      logger.warn('[GoogleBusinessResenas] Error al leer reseñas:', data.error || status);
      return {
        success: false,
        reviews: [],
        errorCriollo,
        error: data.error?.message || `HTTP ${status}`,
      };
    }

    const rawReviews = (data.reviews || []) as any[];
    const reviews: GoogleBusinessReview[] = rawReviews.map((r) => {
      const reviewId = r.reviewId || (r.name ? r.name.split('/').pop() : '');
      const reviewerName = r.reviewer?.displayName || 'Invitado/Cliente';
      const borrador = !r.reviewReply
        ? generarBorradorRespuesta({
            reviewerName,
            comment: r.comment,
            starRating: r.starRating,
          })
        : undefined;

      return {
        reviewId,
        reviewer: {
          displayName: reviewerName,
          profilePhotoUrl: r.reviewer?.profilePhotoUrl,
        },
        starRating: r.starRating,
        comment: r.comment || '',
        createTime: r.createTime || new Date().toISOString(),
        updateTime: r.updateTime,
        reviewReply: r.reviewReply,
        borradorSugerido: borrador,
      };
    });

    return {
      success: true,
      reviews,
      averageRating: data.averageRating,
      totalReviewCount: data.totalReviewCount ?? reviews.length,
    };
  } catch (err: any) {
    logger.error('[GoogleBusinessResenas] Excepción al leer reseñas:', err);
    return {
      success: false,
      reviews: [],
      errorCriollo: 'Hubo un error de conexión con los servidores de Google.',
      error: err.message || 'Error de red',
    };
  }
}

/**
 * Publica una respuesta a una reseña en Google Business Profile.
 */
export async function replyToGoogleBusinessReview(params: {
  accessToken: string;
  accountLocationId: string;
  reviewId: string;
  comment: string;
}): Promise<PublishReplyResult> {
  const { accessToken, accountLocationId, reviewId, comment } = params;

  if (!accessToken || !accountLocationId || !reviewId || !comment.trim()) {
    return {
      success: false,
      errorCriollo: 'Faltan datos obligatorios para enviar la respuesta a Google.',
      error: 'Parámetros incompletos.',
    };
  }

  try {
    const endpoint = `https://mybusiness.googleapis.com/v4/${accountLocationId}/reviews/${reviewId}/reply`;
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment: comment.trim() }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const status = response.status;
      let errorCriollo = 'Google rechazó la publicación de la respuesta.';
      if (status === 403 || status === 401) {
        errorCriollo = 'Google no da permisos para responder reseñas con la cuenta conectada.';
      }
      logger.warn('[GoogleBusinessResenas] Error al responder reseña:', data.error || status);
      return {
        success: false,
        errorCriollo,
        error: data.error?.message || `HTTP ${status}`,
      };
    }

    return {
      success: true,
      reply: {
        comment: data.comment || comment.trim(),
        updateTime: data.updateTime || new Date().toISOString(),
      },
    };
  } catch (err: any) {
    logger.error('[GoogleBusinessResenas] Excepción al responder reseña:', err);
    return {
      success: false,
      errorCriollo: 'No se pudo conectar con Google para publicar la respuesta.',
      error: err.message || 'Error de conexión',
    };
  }
}

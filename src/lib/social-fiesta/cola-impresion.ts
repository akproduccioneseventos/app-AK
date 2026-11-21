import type { SocialGalleryPost } from '@/types/social-gallery';
import { esAprobadoParaMostrar } from '@/lib/social-fiesta/visibilidad';
import { puedeImprimir } from '@/lib/social-fiesta/limite-de-impresion';

export interface MobilePrintRequest {
  id: string;
  fiestaId: string;
  postId: string;
  imageUrl: string;
  authorName: string;
  requestedBy: string;
  guestId?: string;
  ticketNumber: number;
  status: 'queued' | 'ready' | 'printed';
  createdAt: string;
  updatedAt?: string;
}

export function isPrintableImagePost(post: SocialGalleryPost): boolean {
  if (!esAprobadoParaMostrar(post)) return false;
  const isVideo =
    post.mediaType === 'video' || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(post.imageUrl || '');
  return !isVideo && Boolean(post.imageUrl);
}

export function evaluateMobilePrintLimit(
  post: SocialGalleryPost,
  existingRequests: MobilePrintRequest[],
  maxImpresionesPorPersona: number = 2,
): { allowed: boolean; reason?: string } {
  if (!isPrintableImagePost(post)) {
    return {
      allowed: false,
      reason: 'Solo se pueden imprimir fotos aprobadas.',
    };
  }

  const countedAsPosts: SocialGalleryPost[] = existingRequests.map((req) => ({
    id: req.postId,
    fiestaId: req.fiestaId,
    imageUrl: req.imageUrl,
    authorName: req.requestedBy || req.authorName,
    ...(req.guestId ? { guestId: req.guestId } : {}),
    timestamp: req.createdAt,
    likes: 0,
    comments: [],
  }));

  if (!puedeImprimir(post, countedAsPosts, maxImpresionesPorPersona)) {
    return {
      allowed: false,
      reason: `Ya alcanzaste el límite de ${maxImpresionesPorPersona} impresiones por persona.`,
    };
  }

  return { allowed: true };
}

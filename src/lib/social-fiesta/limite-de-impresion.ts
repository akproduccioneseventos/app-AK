import type { SocialGalleryPost } from '@/types/social-gallery';

/**
 * Orden 94 — Bloque 3: Límite de impresión por invitado.
 *
 * Función pura que evalúa si una foto de la galería puede imprimirse según el límite
 * configurado para el evento.
 *
 * - limite <= 0 (o falsy): sin límite (devuelve true).
 * - Cuenta cuántas fotos del mismo invitado ya fueron impresas.
 * - Prioriza post.guestId para contar; si no tiene guestId, cuenta por post.authorName.
 */
export function puedeImprimir(
  post: SocialGalleryPost,
  impresos: SocialGalleryPost[],
  limite: number = 2
): boolean {
  if (typeof limite !== 'number' || limite <= 0) {
    return true;
  }

  const guestId = post.guestId?.trim();
  const authorName = (post.authorName || '').trim().toLowerCase();

  const cantidadImpresos = impresos.filter((p) => {
    // Si ambos tienen guestId, comparamos por guestId
    if (guestId && p.guestId?.trim()) {
      return p.guestId.trim() === guestId;
    }
    // Si alguno no tiene guestId, comparamos por authorName
    const pAuthorName = (p.authorName || '').trim().toLowerCase();
    return authorName && pAuthorName && authorName === pAuthorName;
  }).length;

  return cantidadImpresos < limite;
}

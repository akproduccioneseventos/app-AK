export const GUESTBOOK_MAX_SECONDS = 30;
export const GUESTBOOK_MAX_BYTES = 25 * 1024 * 1024;

export interface GuestbookMessage {
  id: string;
  fiestaId: string;
  authorName: string;
  mediaType: 'audio' | 'video';
  mediaUrl: string;
  message?: string;
  durationSeconds?: number;
  /** Siempre privado para el cliente (portal y álbum final); nunca al muro público. */
  visibility: 'client_only';
  createdAt: string;
}

export function isGuestbookMessageClientOnly(msg: Pick<GuestbookMessage, 'visibility'>): boolean {
  return msg.visibility === 'client_only';
}

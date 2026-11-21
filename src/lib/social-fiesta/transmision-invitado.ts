export const LIVE_STREAM_STUN_URL = 'stun:stun.l.google.com:19302';
export const LIVE_STREAM_CONNECT_TIMEOUT_MS = 10_000;
export const LIVE_STREAM_MAX_DURATION_SECONDS = 60;
export const LIVE_STREAM_FALLBACK_CLIP_SECONDS = 15;

export type LiveStreamStatus = 'pending' | 'accepted' | 'live' | 'rejected' | 'ended';

export interface LiveStreamRequest {
  id: string;
  fiestaId: string;
  guestKey: string;
  authorName: string;
  status: LiveStreamStatus;
  offerSdp?: string;
  answerSdp?: string;
  callerCandidates?: string[];
  calleeCandidates?: string[];
  createdAt: string;
  acceptedAt?: string;
  endedAt?: string;
  maxDurationSeconds: number;
}

/**
 * La cámara de un invitado NUNCA sale en la pantalla gigante sin aceptación del operador,
 * y caduca automáticamente a los 60 segundos (o si fue cortada/rechazada).
 */
export function shouldDisplayLiveStreamOnScreen(
  request: LiveStreamRequest | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!request) return false;
  if (request.status !== 'accepted' && request.status !== 'live') return false;
  if (!request.acceptedAt) return false;
  const acceptedMs = Date.parse(request.acceptedAt);
  if (!Number.isFinite(acceptedMs)) return false;
  const maxMs = (request.maxDurationSeconds || LIVE_STREAM_MAX_DURATION_SECONDS) * 1000;
  return nowMs - acceptedMs <= maxMs;
}

export interface BlockedSocialGuest {
  id: string;
  fiestaId: string;
  authorName?: string;
  normalizedAuthorName?: string;
  guestId?: string;
  dispositivoId?: string;
  reason?: string;
  blockedAt: string;
  blockedBy?: string;
}

export function normalizeBlockedAuthorName(name?: string | null): string {
  return (name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

export function isUploaderBlocked(
  blockedList: BlockedSocialGuest[],
  uploader: { guestId?: string; dispositivoId?: string; authorName?: string },
): BlockedSocialGuest | null {
  if (!blockedList.length) return null;
  const guestId = uploader.guestId?.trim();
  const dispositivoId = uploader.dispositivoId?.trim();
  const normName = normalizeBlockedAuthorName(uploader.authorName);

  for (const entry of blockedList) {
    if (guestId && entry.guestId && entry.guestId.trim() === guestId) {
      return entry;
    }
    if (dispositivoId && entry.dispositivoId && entry.dispositivoId.trim() === dispositivoId) {
      return entry;
    }
    const entryNorm = entry.normalizedAuthorName || normalizeBlockedAuthorName(entry.authorName);
    if (
      normName &&
      normName !== 'invitado' &&
      normName !== 'anonimo' &&
      entryNorm &&
      entryNorm === normName
    ) {
      return entry;
    }
  }
  return null;
}

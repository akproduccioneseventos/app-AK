/**
 * Shared helper to detect if a salon/lugar name refers to Club Uruguay.
 * Centralizes the detection logic used across multiple files.
 */

export const CLUB_URUGUAY_KEYWORDS = [
  'club uruguay',
  'cluburuguay',
  'club_uruguay',
  'club-uruguay',
] as const;

/**
 * Returns true if the given salon/place name corresponds to Club Uruguay.
 */
export function isClubUruguay(nombre?: string): boolean {
  if (!nombre) return false;
  const normalized = nombre
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[_-]/g, ' ');
  return CLUB_URUGUAY_KEYWORDS.some((kw) =>
    normalized.includes(kw.replace(/[_-]/g, ' '))
  );
}

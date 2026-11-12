import crypto from 'node:crypto';

/**
 * Compara dos claves o secretos en tiempo constante para evitar ataques de temporización (timing attacks).
 * Si alguna de las claves falta o es vacía, retorna false.
 * Calcula el hash SHA-256 de ambas entradas y las compara con crypto.timingSafeEqual.
 */
export function clavesIguales(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  if (!a || !b || typeof a !== 'string' || typeof b !== 'string' || a.length === 0 || b.length === 0) {
    return false;
  }

  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();

  return crypto.timingSafeEqual(hashA, hashB);
}

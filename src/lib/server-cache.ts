/**
 * @fileOverview Lightweight server-side in-memory cache with TTL.
 *
 * This module reduces redundant Firebase/Firestore reads by caching
 * frequently accessed data for a configurable TTL (default 30 seconds).
 * Helps lower the error rate from excessive Firestore reads.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// Global cache map (persists across requests within the same Node.js process)
const cache = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS = 30_000; // 30 seconds

/**
 * Get a value from the cache. Returns undefined if not found or expired.
 */
export function cacheGet<T>(key: string): T | undefined {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.data;
}

/**
 * Set a value in the cache with optional TTL in milliseconds.
 */
export function cacheSet<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/**
 * Invalidate (delete) a specific cache key.
 */
export function cacheInvalidate(key: string): void {
  cache.delete(key);
}

/**
 * Invalidate all cache entries whose keys start with a given prefix.
 */
export function cacheInvalidatePrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Fetch a value from cache or compute it if missing/expired.
 *
 * @example
 * const data = await cachedFetch('servicios', () => getServiciosEmpresa(), 60_000);
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached !== undefined) return cached;

  const data = await fetcher();
  cacheSet(key, data, ttlMs);
  return data;
}

/**
 * Clear all cache entries (useful for testing or forced refresh).
 */
export function cacheClear(): void {
  cache.clear();
}

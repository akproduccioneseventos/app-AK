'use client';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL_MS = 60_000; // 1 minute

const cacheStore: Record<string, CacheEntry<unknown>> = {};

export function getCached<T>(key: string): T | null {
  const entry = cacheStore[key] as CacheEntry<T> | undefined;
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  return null;
}

export function setCached<T>(key: string, data: T): void {
  cacheStore[key] = { data, timestamp: Date.now() };
}

export function invalidateCache(key?: string): void {
  if (key) {
    delete cacheStore[key];
  } else {
    Object.keys(cacheStore).forEach(k => delete cacheStore[k]);
  }
}
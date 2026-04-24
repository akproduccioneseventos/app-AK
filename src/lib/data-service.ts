/**
 * @fileOverview A centralized service for reading and writing data.
 * Firestore is the single source of truth for all environments.
 */
'use server';

import { syncToFirestore, readFromFirestore } from './firebase-sync';
import * as logger from './logger';

// Files that should NOT trigger an auto-backup (to avoid infinite loops)
const BACKUP_EXCLUDED_FILES = new Set([
  '_backup-snapshots.json',
]);

async function readLocalJsonFallback<T>(normalizedFilePath: string): Promise<T | null> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const localCandidates = [
      path.join(process.cwd(), 'data', normalizedFilePath),
      path.join(process.cwd(), 'src', 'data', normalizedFilePath),
    ];
    for (const localPath of localCandidates) {
      try {
        const raw = await fs.readFile(localPath, 'utf-8');
        const parsed = JSON.parse(raw);
        logger.warn(`[readData] ⚠️ FALLBACK JSON usado para "${normalizedFilePath}" — Firestore vacío o no disponible.`);
        return parsed as T;
      } catch {
        // try next candidate
      }
    }
  } catch {
    // local filesystem fallback unavailable
  }
  return null;
}

/**
 * Reads data from Firestore. Returns defaultValue if not found or on error.
 */
export async function readData<T>(filePath: string, defaultValue: T): Promise<T> {
  // Guard against path traversal and absolute paths (mirrors writeData protection).
  if (filePath.includes('..') || filePath.startsWith('/')) {
    throw new Error('Invalid data file path');
  }
  const normalizedFilePath = filePath.replace(/\\/g, '/');
  try {
    const data = await readFromFirestore(normalizedFilePath);
    if (data !== null && data !== undefined) {
      if (Array.isArray(defaultValue) && !Array.isArray(data)) return defaultValue;
      return data as T;
    }
    const fallbackData = await readLocalJsonFallback<T>(normalizedFilePath);
    if (fallbackData !== null) {
      return fallbackData;
    }
  } catch (e) {
    logger.error(`[readData] Error leyendo ${normalizedFilePath} desde Firestore:`, e);
    const fallbackData = await readLocalJsonFallback<T>(normalizedFilePath);
    if (fallbackData !== null) {
      return fallbackData;
    }
  }
  return defaultValue;
}

/**
 * Writes data to Firestore. Throws on failure.
 */
export async function writeData<T>(
  filePath: string,
  data: T,
  sortFn?: (a: any, b: any) => number
): Promise<void> {
  // Guard against path traversal and absolute paths to prevent unintended access.
  if (filePath.includes('..') || filePath.startsWith('/')) {
    throw new Error('Invalid data file path');
  }

  const normalizedFilePath = filePath.replace(/\\/g, '/');
  let dataToWrite: T = data;
  if (Array.isArray(data) && sortFn) {
    dataToWrite = [...data].sort(sortFn) as unknown as T;
  }
  try {
    await syncToFirestore(normalizedFilePath, dataToWrite);
  } catch (err) {
    logger.error(`[writeData] Error escribiendo ${filePath} en Firestore:`, err);
    throw new Error(`Error al guardar datos en Firestore: ${err instanceof Error ? err.message : err}`);
  }

  // Trigger auto-backup in the background (fire-and-forget, non-blocking)
  // Skip for backup-related files to avoid infinite loops
  if (!BACKUP_EXCLUDED_FILES.has(normalizedFilePath)) {
    import('@/app/actions/backup')
      .then(({ triggerAutoBackup }) => triggerAutoBackup())
      .catch((err) => logger.warn('[writeData] Auto-backup trigger failed silently:', err));
  }
}

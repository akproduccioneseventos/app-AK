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

/**
 * Reads data from Firestore. Returns defaultValue if not found or on error.
 */
export async function readData<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const data = await readFromFirestore(filePath);
    if (data !== null && data !== undefined) {
      if (Array.isArray(defaultValue) && !Array.isArray(data)) return defaultValue;
      return data as T;
    }
  } catch (e) {
    logger.error(`[readData] Error leyendo ${filePath} desde Firestore:`, e);
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
  const normalizedFilePath = filePath.replace(/\\/g, '/');
  let dataToWrite: T = data;
  if (Array.isArray(data) && sortFn) {
    dataToWrite = [...data].sort(sortFn) as unknown as T;
  }
  try {
    await syncToFirestore(normalizedFilePath, dataToWrite);
  } catch (err) {
    logger.error(`[writeData] Error escribiendo ${filePath} en Firestore:`, err);
    throw new Error(`Error al guardar datos: ${err instanceof Error ? err.message : err}`);
  }

  // Trigger auto-backup in the background (fire-and-forget, non-blocking)
  // Skip for backup-related files to avoid infinite loops
  if (!BACKUP_EXCLUDED_FILES.has(normalizedFilePath)) {
    import('@/app/actions/backup')
      .then(({ triggerAutoBackup }) => triggerAutoBackup())
      .catch((err) => logger.warn('[writeData] Auto-backup trigger failed silently:', err));
  }
}

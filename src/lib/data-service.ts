/**
 * @fileOverview A centralized service for reading and writing data files.
 * Enhanced with automatic internal backup triggers, in-memory cache, and
 * guarded Firebase sync (only when credentials are configured).
 */
'use server';

import fs from 'fs/promises';
import path from 'path';
import * as logger from './logger';
import { cacheGet, cacheSet, cacheInvalidate } from './server-cache';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');

/**
 * Returns true only when real Firebase credentials are present or explicitly enabled.
 * Prevents the dual-write noise when Firebase is not configured for this environment.
 */
function isFirebaseConfigured(): boolean {
  if (process.env.USE_FIREBASE_DATA === 'true') return true;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return true;
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) return true;
  return false;
}

/**
 * Ensures a file exists at the given path. If not, it creates it with default content.
 */
async function ensureFile(filePath: string, defaultContent: string = '[]'): Promise<void> {
  try {
    await fs.access(path.dirname(filePath));
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
  }
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, defaultContent, 'utf-8');
  }
}

/**
 * Reads and parses a JSON file.
 * Uses in-memory cache to reduce redundant disk and Firestore reads.
 */
export async function readData<T>(filePath: string, defaultValue: T): Promise<T> {
  // Check in-memory cache first
  const cached = cacheGet<T>(`read:${filePath}`);
  if (cached !== undefined) return cached;

  const absolutePath = path.join(DATA_DIR, filePath);
  await ensureFile(absolutePath, JSON.stringify(defaultValue, null, 2));
  try {
    const fileContent = await fs.readFile(absolutePath, 'utf-8');
    if (fileContent && fileContent.trim()) {
      const localData = JSON.parse(fileContent) as T;
      // Guard: if the default is an array but parsed data is not, treat as empty default
      if (Array.isArray(defaultValue) && !Array.isArray(localData)) {
        if (isFirebaseConfigured()) {
          try {
            const { readFromFirestore } = await import('./firebase-sync');
            const firestoreData = await readFromFirestore(filePath);
            if (Array.isArray(firestoreData)) {
              // Cache write failure is intentional: filesystem may be read-only in serverless environments.
              await fs.writeFile(absolutePath, JSON.stringify(firestoreData, null, 2), 'utf-8').catch(() => {});
              cacheSet(`read:${filePath}`, firestoreData as T);
              return firestoreData as T;
            }
          } catch { /* Firestore unavailable */ }
        }
        cacheSet(`read:${filePath}`, defaultValue);
        return defaultValue;
      }
      // If local data matches default and Firebase is configured, try Firestore as read-through fallback
      if (isFirebaseConfigured() && JSON.stringify(localData) === JSON.stringify(defaultValue)) {
        try {
          const { readFromFirestore } = await import('./firebase-sync');
          const firestoreData = await readFromFirestore(filePath);
          if (firestoreData !== null && firestoreData !== undefined) {
            // For array defaults, only accept array data from Firestore
            if (Array.isArray(defaultValue) && !Array.isArray(firestoreData)) {
              cacheSet(`read:${filePath}`, defaultValue);
              return defaultValue;
            }
            // Cache locally for subsequent reads. Failure is intentional: filesystem may be read-only in serverless environments.
            await fs.writeFile(absolutePath, JSON.stringify(firestoreData, null, 2), 'utf-8').catch(() => {});
            cacheSet(`read:${filePath}`, firestoreData as T);
            return firestoreData as T;
          }
        } catch { /* Firestore unavailable, use local */ }
      }
      cacheSet(`read:${filePath}`, localData);
      return localData;
    }
    cacheSet(`read:${filePath}`, defaultValue);
    return defaultValue;
  } catch (error) {
    logger.error(`Error reading ${absolutePath}, returning default.`);
    return defaultValue;
  }
}

/**
 * Writes data to a JSON file and triggers an automatic backup if needed.
 * Invalidates the in-memory cache for the written file.
 */
export async function writeData<T>(
  filePath: string,
  data: T,
  sortFn?: (a: any, b: any) => number
): Promise<void> {
  // Invalidate cache immediately on write
  cacheInvalidate(`read:${filePath}`);

  // Sanitize filePath: must be a relative path that stays within DATA_DIR
  const normalizedFilePath = path.normalize(filePath);
  if (normalizedFilePath.startsWith('..') || path.isAbsolute(normalizedFilePath)) {
    throw new Error(`Invalid data file path: ${filePath}`);
  }

  const absolutePath = path.join(DATA_DIR, normalizedFilePath);
  await ensureFile(absolutePath);

  // Fase 2: best-effort backup of existing file before overwriting
  try {
    const resolvedPath = path.resolve(absolutePath);
    const resolvedDataDir = path.resolve(DATA_DIR);

    // Path traversal guard: ensure file is inside DATA_DIR
    if (
      resolvedPath === resolvedDataDir ||
      resolvedPath.startsWith(resolvedDataDir + path.sep)
    ) {
      await fs.access(resolvedPath);

      const backupDir = path.join(DATA_DIR, '_backups');
      await fs.mkdir(backupDir, { recursive: true });

      const timestamp = new Date()
        .toISOString()
        .replace(/:/g, '-')
        .replace(/\./g, '-')
        .replace(/Z$/, '');

      const baseName = normalizedFilePath
        .replace(/[/\\]/g, '_')
        .replace(/\.json$/, '');
      const backupName = `${baseName}__${timestamp}.json`;

      await fs.copyFile(resolvedPath, path.join(backupDir, backupName));
    }
  } catch {
    // No existing file to back up, or backup failed — proceed without interrupting write
  }

  let dataToWrite = data;
  if (Array.isArray(dataToWrite) && sortFn) {
    dataToWrite.sort(sortFn);
  }
  
  await fs.writeFile(absolutePath, JSON.stringify(dataToWrite, null, 2), 'utf-8');

  // TRIGGER AUTO-BACKUP LOGIC
  // Avoid circular dependency by importing here
  try {
    const { triggerAutoBackup } = await import('@/app/actions/backup');
    // We don't await this to keep the UI fast
    triggerAutoBackup().catch(err => logger.error("Background auto-backup failed:", String(err)));
  } catch {
    // Backup module not available — proceed without error
  }

  // DUAL-WRITE: Only attempt Firestore sync when Firebase is actually configured.
  // Avoids constant ⚠️ warning spam in environments without Firebase credentials.
  if (!isFirebaseConfigured()) return;

  try {
    const { syncToFirestore } = await import('./firebase-sync');
    syncToFirestore(filePath, dataToWrite)
      .then(() => {
        logger.info(`📝 [Dual-Write] "${filePath}" — JSON ✅ + Firebase ✅`);
      })
      .catch(err => {
        logger.warn(`⚠️ [Dual-Write] "${filePath}" — JSON ✅ guardado correctamente | Firebase ❌ falló.`);
        logger.warn(`   Detalle Firebase: ${err instanceof Error ? err.message : err}`);
      });
  } catch {
    // Firebase sync module not available, skip silently
  }
}

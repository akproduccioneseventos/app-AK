/**
 * @fileOverview A centralized service for reading and writing data files.
 * Enhanced with automatic internal backup triggers.
 */
'use server';

import fs from 'fs/promises';
import path from 'path';
import * as logger from './logger';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const LAST_AUTO_BACKUP_FILE = path.join(DATA_DIR, 'last-auto-backup.txt');

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
 * In production (Vercel), tries Firestore FIRST before falling back to local JSON.
 * In development, uses local JSON first with Firestore as fallback for empty/default data.
 */
export async function readData<T>(filePath: string, defaultValue: T): Promise<T> {
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

  // In production: try Firestore FIRST as the primary source of truth
  if (isProduction) {
    try {
      const { readFromFirestore } = await import('./firebase-sync');
      const firestoreData = await readFromFirestore(filePath);
      if (firestoreData !== null && firestoreData !== undefined) {
        if (Array.isArray(defaultValue) && !Array.isArray(firestoreData)) {
          // Type mismatch — fall through to local JSON
        } else {
          return firestoreData as T;
        }
      }
    } catch { /* Firestore unavailable in production — fall through to local JSON */ }
  }

  const absolutePath = path.join(DATA_DIR, filePath);
  await ensureFile(absolutePath, JSON.stringify(defaultValue, null, 2));
  try {
    const fileContent = await fs.readFile(absolutePath, 'utf-8');
    if (fileContent && fileContent.trim()) {
      const localData = JSON.parse(fileContent) as T;
      // Guard: if the default is an array but parsed data is not, treat as empty default
      if (Array.isArray(defaultValue) && !Array.isArray(localData)) {
        try {
          const { readFromFirestore } = await import('./firebase-sync');
          const firestoreData = await readFromFirestore(filePath);
          if (Array.isArray(firestoreData)) {
            // Cache write failure is intentional: filesystem may be read-only in serverless environments.
            await fs.writeFile(absolutePath, JSON.stringify(firestoreData, null, 2), 'utf-8').catch(() => {});
            return firestoreData as T;
          }
        } catch { /* Firestore unavailable */ }
        return defaultValue;
      }
      // In development: if local data matches default, try Firestore as a read-through fallback
      if (!isProduction && JSON.stringify(localData) === JSON.stringify(defaultValue)) {
        try {
          const { readFromFirestore } = await import('./firebase-sync');
          const firestoreData = await readFromFirestore(filePath);
          if (firestoreData !== null && firestoreData !== undefined) {
            // For array defaults, only accept array data from Firestore
            if (Array.isArray(defaultValue) && !Array.isArray(firestoreData)) {
              return defaultValue;
            }
            // Cache locally for subsequent reads. Failure is intentional: filesystem may be read-only in serverless environments.
            await fs.writeFile(absolutePath, JSON.stringify(firestoreData, null, 2), 'utf-8').catch(() => {});
            return firestoreData as T;
          }
        } catch { /* Firestore unavailable, use local */ }
      }
      return localData;
    }
    return defaultValue;
  } catch (error) {
    logger.error(`Error reading ${absolutePath}, returning default.`);
    return defaultValue;
  }
}

/**
 * Writes data to a JSON file and triggers an automatic backup if needed.
 * In production (Vercel / serverless), writes ONLY to Firestore to avoid
 * relying on the ephemeral local filesystem.
 */
export async function writeData<T>(
  filePath: string,
  data: T,
  sortFn?: (a: any, b: any) => number
): Promise<void> {
  // Sanitize filePath: must be a relative path that stays within DATA_DIR
  const normalizedFilePath = path.normalize(filePath);
  if (normalizedFilePath.startsWith('..') || path.isAbsolute(normalizedFilePath)) {
    throw new Error(`Invalid data file path: ${filePath}`);
  }

  let dataToWrite = data;
  if (Array.isArray(dataToWrite) && sortFn) {
    (dataToWrite as any[]).sort(sortFn);
  }

  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

  if (isProduction) {
    // In production: write ONLY to Firestore — skip local filesystem entirely.
    // The ephemeral filesystem on Vercel/Cloud Run cannot be used as a data store.
    try {
      const { syncToFirestore } = await import('./firebase-sync');
      await syncToFirestore(filePath, dataToWrite).catch(err => {
        logger.error(`❌ [Firestore Write] "${filePath}" failed. Data may be lost. Detail: ${err instanceof Error ? err.message : err}`);
        throw err; // Re-throw so callers know the write failed
      });
    } catch (err) {
      // If Firestore isn't available in production we still attempt the local write
      // as a last resort so the request doesn't silently drop data.
      logger.warn(`⚠️ [Production] Firestore write failed for "${filePath}". Attempting emergency local write.`);
      const absolutePath = path.join(DATA_DIR, normalizedFilePath);
      await ensureFile(absolutePath);
      await fs.writeFile(absolutePath, JSON.stringify(dataToWrite, null, 2), 'utf-8').catch(() => {});
    }
    return;
  }

  // Development mode: write to local filesystem + sync to Firestore (dual-write)
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

  await fs.writeFile(absolutePath, JSON.stringify(dataToWrite, null, 2), 'utf-8');

  // TRIGGER AUTO-BACKUP LOGIC
  // Avoid circular dependency by importing here
  const { triggerAutoBackup } = await import('@/app/actions/backup');
  
  // We don't await this to keep the UI fast
  triggerAutoBackup().catch(err => logger.error("Background auto-backup failed:", err));

  // FIRESTORE SYNC: fire-and-forget in development to keep local iteration fast.
  try {
    const { syncToFirestore } = await import('./firebase-sync');
    syncToFirestore(filePath, dataToWrite)
      .then(() => {
        if (process.env.NODE_ENV === 'development') {
          logger.info(`📝 [Dual-Write] "${filePath}" — JSON ✅ + Firebase ✅`);
        }
      })
      .catch(err => {
        logger.warn(`⚠️ [Dual-Write] "${filePath}" — JSON ✅ guardado correctamente | Firebase ❌ falló.`);
        logger.warn(`   Tus datos están SEGUROS en el archivo JSON local.`);
        logger.warn(`   Detalle Firebase: ${err instanceof Error ? err.message : err}`);
      });
  } catch {
    // Firebase sync module not available, skip silently
  }
}

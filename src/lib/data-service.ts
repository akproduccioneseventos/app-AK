/**
 * @fileOverview A centralized service for reading and writing data.
 * Firestore is the single source of truth for all environments.
 */
'use server';

import { syncToFirestore, readFromFirestore } from './firebase-sync';
import { readGenericJsonFile, syncGenericJsonFile } from './generic-json-store';
import { isSafeTopLevelJsonFile } from './backup/backup-registry';
import * as logger from './logger';

const BACKUP_EXCLUDED_FILES = new Set(['_backup-snapshots.json']);

export interface WriteDataOptions {
  skipAutoBackup?: boolean;
}

function shouldUseLocalJsonOnly(): boolean {
  return process.env.AK_USE_LOCAL_JSON_ONLY === 'true';
}

async function scheduleAutoBackupAfterWrite(normalizedFilePath: string, options?: WriteDataOptions): Promise<void> {
  if (options?.skipAutoBackup || BACKUP_EXCLUDED_FILES.has(normalizedFilePath)) return;

  const backupTask = Promise.all([
    import('@/app/actions/backup'),
    import('./backup/internal-token'),
  ])
    .then(([{ triggerAutoBackup }, { AUTO_BACKUP_INTERNAL_TOKEN }]) =>
      triggerAutoBackup(AUTO_BACKUP_INTERNAL_TOKEN)
    )
    .catch((err) => logger.warn('[data-service] Auto-backup trigger failed:', err));

  try {
    const nextServer = (await import('next/server')) as any;
    if (typeof nextServer.after === 'function') {
      nextServer.after(backupTask);
      return;
    }
  } catch (error) {
    logger.warn('[data-service] Post-response context unavailable for auto-backup:', error);
  }

  void backupTask;
}

async function readLocalJsonFallback<T>(normalizedFilePath: string): Promise<T | null> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const localCandidates = [path.join(process.cwd(), 'data', normalizedFilePath), path.join(process.cwd(), 'src', 'data', normalizedFilePath)];
    for (const localPath of localCandidates) {
      try {
        const raw = await fs.readFile(localPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!logger.isBuildTime()) {
          logger.warn(`[readData] FALLBACK JSON usado para "${normalizedFilePath}"; Firestore vacio o no disponible.`);
        }
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

async function writeLocalJsonFallback<T>(normalizedFilePath: string, data: T): Promise<void> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const localCandidates = [
      path.join(process.cwd(), 'data', normalizedFilePath),
      path.join(process.cwd(), 'src', 'data', normalizedFilePath)
    ];
    for (const localPath of localCandidates) {
      try {
        await fs.mkdir(path.dirname(localPath), { recursive: true });
        await fs.writeFile(localPath, JSON.stringify(data, null, 2), 'utf-8');
      } catch {
        // ignore write error for this candidate, try others
      }
    }
  } catch (e) {
    logger.error(`[writeLocalJsonFallback] Error escribiendo copia local de "${normalizedFilePath}":`, e);
  }
}

export async function readData<T>(filePath: string, defaultValue: T): Promise<T> {
  if (filePath.includes('..') || filePath.startsWith('/')) throw new Error('Invalid data file path');
  const normalizedFilePath = filePath.replace(/\\/g, '/');

  if (shouldUseLocalJsonOnly()) {
    const fallbackData = await readLocalJsonFallback<T>(normalizedFilePath);
    return fallbackData ?? defaultValue;
  }

  try {
    const data = await readFromFirestore(normalizedFilePath);
    if (data !== null && data !== undefined) {
      if (Array.isArray(defaultValue) && !Array.isArray(data)) return defaultValue;
      return data as T;
    }
    const genericData = await readGenericJsonFile(normalizedFilePath);
    if (genericData !== null && genericData !== undefined) {
      if (Array.isArray(defaultValue) && !Array.isArray(genericData)) return defaultValue;
      return genericData as T;
    }
    const fallbackData = await readLocalJsonFallback<T>(normalizedFilePath);
    if (fallbackData !== null) return fallbackData;
  } catch (e) {
    if (!logger.isBuildTime() || !logger.isDefaultCredentialError(e)) {
      logger.error(`[readData] Error leyendo ${normalizedFilePath} desde Firestore:`, logger.compactError(e));
    }
    const genericData = await readGenericJsonFile(normalizedFilePath);
    if (genericData !== null && genericData !== undefined) {
      if (Array.isArray(defaultValue) && !Array.isArray(genericData)) return defaultValue;
      return genericData as T;
    }
    const fallbackData = await readLocalJsonFallback<T>(normalizedFilePath);
    if (fallbackData !== null) return fallbackData;
  }
  return defaultValue;
}

export async function writeData<T>(
  filePath: string,
  data: T,
  sortFn?: (a: any, b: any) => number,
  options?: WriteDataOptions,
): Promise<void> {
  if (filePath.includes('..') || filePath.startsWith('/')) throw new Error('Invalid data file path');

  const normalizedFilePath = filePath.replace(/\\/g, '/');
  let dataToWrite: T = data;
  if (Array.isArray(data) && sortFn) dataToWrite = [...data].sort(sortFn) as unknown as T;

  const isLocalOnly = shouldUseLocalJsonOnly();

  if (isLocalOnly) {
    await writeLocalJsonFallback(normalizedFilePath, dataToWrite);
    return;
  }

  try {
    const { isFirebaseAvailable } = await import('./firebase/server');
    if (isFirebaseAvailable()) {
      await syncToFirestore(normalizedFilePath, dataToWrite);
      if (isSafeTopLevelJsonFile(normalizedFilePath)) {
        const persisted = await readFromFirestore(normalizedFilePath);
        if (persisted === null || persisted === undefined) {
          await syncGenericJsonFile(normalizedFilePath, dataToWrite);
        }
      }
    } else {
      logger.warn(`[writeData] Firestore no disponible. Escribiendo copia local de respaldo para "${normalizedFilePath}".`);
    }
    await writeLocalJsonFallback(normalizedFilePath, dataToWrite);
  } catch (err) {
    logger.error(`[writeData] Error escribiendo ${filePath} en Firestore:`, err);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Error al guardar datos en Firestore: ${err instanceof Error ? err.message : err}`);
    } else {
      await writeLocalJsonFallback(normalizedFilePath, dataToWrite);
    }
  }

  await scheduleAutoBackupAfterWrite(normalizedFilePath, options);
}

function deepMerge(target: any, source: any): any {
  if (Array.isArray(target) && Array.isArray(source)) {
    const merged = [...target];
    source.forEach((sourceItem, index) => {
      if (sourceItem && typeof sourceItem === 'object' && 'id' in sourceItem && sourceItem.id) {
        const targetIndex = merged.findIndex(item => item && typeof item === 'object' && 'id' in item && item.id === sourceItem.id);
        if (targetIndex > -1) {
          merged[targetIndex] = deepMerge(merged[targetIndex], sourceItem);
        } else {
          merged.push(sourceItem);
        }
      } else if (index < merged.length) {
        merged[index] = deepMerge(merged[index], sourceItem);
      } else {
        merged.push(sourceItem);
      }
    });
    return merged;
  }
  if (target && typeof target === 'object' && source && typeof source === 'object') {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (key in target) {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
  return source;
}

export async function updateDataPartial<T extends Record<string, any>>(
  filePath: string,
  partialData: Partial<T>,
  options?: WriteDataOptions,
): Promise<void> {
  if (filePath.includes('..') || filePath.startsWith('/')) throw new Error('Invalid data file path');

  const normalizedFilePath = filePath.replace(/\\/g, '/');

  const isLocalOnly = shouldUseLocalJsonOnly();
  if (isLocalOnly) {
    const existing = await readLocalJsonFallback<T>(normalizedFilePath) || {} as T;
    const merged = deepMerge(existing, partialData);
    await writeLocalJsonFallback(normalizedFilePath, merged);
    return;
  }

  try {
    const { isFirebaseAvailable } = await import('./firebase/server');
    if (isFirebaseAvailable()) {
      await syncToFirestore(normalizedFilePath, partialData);
      if (isSafeTopLevelJsonFile(normalizedFilePath)) {
        const existing = await readGenericJsonFile(normalizedFilePath) as Record<string, any> || {};
        const merged = deepMerge(existing, partialData);
        await syncGenericJsonFile(normalizedFilePath, merged);
        await writeLocalJsonFallback(normalizedFilePath, merged);
      } else {
        const existing = await readLocalJsonFallback<T>(normalizedFilePath) || {} as T;
        const merged = deepMerge(existing, partialData);
        await writeLocalJsonFallback(normalizedFilePath, merged);
      }
    } else {
      logger.warn(`[updateDataPartial] Firestore no disponible. Escribiendo copia local de respaldo para "${normalizedFilePath}".`);
      const existing = await readLocalJsonFallback<T>(normalizedFilePath) || {} as T;
      const merged = deepMerge(existing, partialData);
      await writeLocalJsonFallback(normalizedFilePath, merged);
    }
  } catch (err) {
    logger.error(`[updateDataPartial] Error actualizando ${filePath} en Firestore:`, err);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Error al actualizar datos en Firestore: ${err instanceof Error ? err.message : err}`);
    } else {
      const existing = await readLocalJsonFallback<T>(normalizedFilePath) || {} as T;
      const merged = deepMerge(existing, partialData);
      await writeLocalJsonFallback(normalizedFilePath, merged);
    }
  }

  await scheduleAutoBackupAfterWrite(normalizedFilePath, options);
}

/**
 * @fileOverview A centralized service for reading and writing data files.
 * Enhanced with automatic internal backup triggers.
 */
'use server';

import fs from 'fs/promises';
import path from 'path';

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
 */
export async function readData<T>(filePath: string, defaultValue: T): Promise<T> {
  const absolutePath = path.join(DATA_DIR, filePath);
  await ensureFile(absolutePath, JSON.stringify(defaultValue, null, 2));
  try {
    const fileContent = await fs.readFile(absolutePath, 'utf-8');
    if (fileContent && fileContent.trim()) {
      const localData = JSON.parse(fileContent) as T;
      // If local data matches default, try Firestore as a read-through fallback
      if (JSON.stringify(localData) === JSON.stringify(defaultValue)) {
        try {
          const { readFromFirestore } = await import('./firebase-sync');
          const firestoreData = await readFromFirestore(filePath);
          if (firestoreData !== null && firestoreData !== undefined) {
            // Cache locally for subsequent reads
            await fs.writeFile(absolutePath, JSON.stringify(firestoreData, null, 2), 'utf-8');
            return firestoreData as T;
          }
        } catch { /* Firestore unavailable, use local */ }
      }
      return localData;
    }
    return defaultValue;
  } catch (error) {
    console.error(`Error reading ${absolutePath}, returning default.`);
    return defaultValue;
  }
}

/**
 * Writes data to a JSON file and triggers an automatic backup if needed.
 */
export async function writeData<T>(
  filePath: string,
  data: T,
  sortFn?: (a: any, b: any) => number
): Promise<void> {
  const absolutePath = path.join(DATA_DIR, filePath);
  await ensureFile(absolutePath);
  
  let dataToWrite = data;
  if (Array.isArray(dataToWrite) && sortFn) {
    dataToWrite.sort(sortFn);
  }
  
  await fs.writeFile(absolutePath, JSON.stringify(dataToWrite, null, 2), 'utf-8');

  // TRIGGER AUTO-BACKUP LOGIC
  // Avoid circular dependency by importing here
  const { triggerAutoBackup } = await import('@/app/actions/backup');
  
  // We don't await this to keep the UI fast
  triggerAutoBackup().catch(err => console.error("Background auto-backup failed:", err));

  // DUAL-WRITE: Always attempt Firestore sync; fail silently if unavailable
  try {
    const { syncToFirestore } = await import('./firebase-sync');
    syncToFirestore(filePath, dataToWrite)
      .then(() => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`📝 [Dual-Write] "${filePath}" — JSON ✅ + Firebase ✅`);
        }
      })
      .catch(err => {
        console.warn(`⚠️ [Dual-Write] "${filePath}" — JSON ✅ guardado correctamente | Firebase ❌ falló.`);
        console.warn(`   Tus datos están SEGUROS en el archivo JSON local.`);
        console.warn(`   Detalle Firebase: ${err instanceof Error ? err.message : err}`);
      });
  } catch {
    // Firebase sync module not available, skip silently
  }
}

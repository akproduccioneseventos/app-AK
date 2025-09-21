
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { RestorePoint } from '@/types/fiesta';

const DATA_DIR = path.resolve(process.cwd(), 'src', 'data');
const BACKUPS_DIR_NAME = 'backups';
const BACKUPS_DIR = path.join(DATA_DIR, BACKUPS_DIR_NAME);

async function ensureBackupsDirectoryExists() {
  try {
    await fs.access(BACKUPS_DIR);
  } catch {
    await fs.mkdir(BACKUPS_DIR, { recursive: true });
  }
}

export async function getRestorePoints(): Promise<RestorePoint[]> {
  await ensureBackupsDirectoryExists();
  try {
    const entries = await fs.readdir(BACKUPS_DIR, { withFileTypes: true });
    const backupFolders = entries
      .filter(entry => entry.isDirectory() && entry.name.startsWith('backup-'))
      .map(entry => {
        const timestampIso = entry.name.replace('backup-', '').replace(/[_\.]/g, ':');
        let date = new Date(timestampIso);
        
        if (isNaN(date.getTime())) return null;

        return {
          name: entry.name,
          timestamp: date.toISOString(),
          displayDate: date.toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'medium' }),
        };
      })
      .filter((p): p is RestorePoint => p !== null);

    return backupFolders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error("Error getting restore points:", error);
    return [];
  }
}

export async function createRestorePoint(): Promise<{ success: boolean; error?: string; point?: RestorePoint }> {
  await ensureBackupsDirectoryExists();
  const timestamp = new Date().toISOString().replace(/:/g, '_').replace(/\..+/, '');
  const backupFolderName = `backup-${timestamp}`;
  const backupFolderPath = path.join(BACKUPS_DIR, backupFolderName);

  try {
    await fs.mkdir(backupFolderPath, { recursive: true });
    const entries = await fs.readdir(DATA_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === BACKUPS_DIR_NAME) continue;

      const sourcePath = path.join(DATA_DIR, entry.name);
      const destPath = path.join(backupFolderPath, entry.name);
      await fs.cp(sourcePath, destPath, { recursive: true });
    }
    
    const allPoints = await getRestorePoints();
    const newPoint = allPoints.find(p => p.name === backupFolderName);

    return { success: true, point: newPoint };
  } catch (error: any) {
    await fs.rm(backupFolderPath, { recursive: true, force: true }).catch(() => {});
    return { success: false, error: error.message || "Unknown error creating restore point." };
  }
}

export async function restoreFromPoint(backupFolderName: string): Promise<{ success: boolean; error?: string }> {
  const safeFolderName = path.basename(backupFolderName);
  if (safeFolderName !== backupFolderName) return { success: false, error: 'Invalid backup name.' };
  
  const backupFolderPath = path.resolve(BACKUPS_DIR, safeFolderName);
  if (!backupFolderPath.startsWith(BACKUPS_DIR)) return { success: false, error: 'Access denied.' };

  try {
    await fs.access(backupFolderPath);

    const dataEntries = await fs.readdir(DATA_DIR, { withFileTypes: true });
    for (const entry of dataEntries) {
      if (entry.name !== BACKUPS_DIR_NAME) {
        await fs.rm(path.join(DATA_DIR, entry.name), { recursive: true, force: true });
      }
    }

    const backupEntries = await fs.readdir(backupFolderPath, { withFileTypes: true });
    for (const entry of backupEntries) {
      const sourcePath = path.join(backupFolderPath, entry.name);
      const destPath = path.join(DATA_DIR, entry.name);
      await fs.cp(sourcePath, destPath, { recursive: true });
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || `Failed to restore from ${backupFolderName}` };
  }
}

export async function deleteRestorePoint(backupFolderName: string): Promise<{ success: boolean; error?: string }> {
   const safeFolderName = path.basename(backupFolderName);
   if (safeFolderName !== backupFolderName) return { success: false, error: 'Invalid backup name.' };
  
  const backupFolderPath = path.resolve(BACKUPS_DIR, safeFolderName);
  if (!backupFolderPath.startsWith(path.resolve(BACKUPS_DIR))) return { success: false, error: 'Access denied.' };

  try {
    await fs.access(backupFolderPath);
    await fs.rm(backupFolderPath, { recursive: true, force: true });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || `Failed to delete ${backupFolderName}` };
  }
}

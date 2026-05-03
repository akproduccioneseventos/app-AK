'use server';

import { readData, writeData } from '@/lib/data-service';
import { BACKUP_COLLECTIONS, getBackupValueCount, isRestorableDataFile } from '@/lib/backup/backup-registry';

const SNAPSHOTS_FILE = '_backup-snapshots.json';
const MAX_SNAPSHOTS = 15;

interface SnapshotEntry {
  name: string;
  timestamp: string;
  isAuto: boolean;
  data: Record<string, any>;
}

export interface RestorePoint {
  name: string;
  timestamp: string;
  displayDate: string;
  isAuto: boolean;
  collections: number;
}

export interface RestoreSummaryItem {
  file: string;
  count: number;
}

function getDisplayDate(timestamp: string, isAuto: boolean) {
  return `${isAuto ? 'AUTO: ' : 'MANUAL: '}${new Date(timestamp).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'medium' })}`;
}

export async function getRestorePoints(): Promise<RestorePoint[]> {
  const snapshots = await readData<SnapshotEntry[]>(SNAPSHOTS_FILE, []);
  return snapshots
    .map((snapshot) => ({ name: snapshot.name, timestamp: snapshot.timestamp, isAuto: Boolean(snapshot.isAuto), collections: Object.keys(snapshot.data || {}).length, displayDate: getDisplayDate(snapshot.timestamp, Boolean(snapshot.isAuto)) }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function createRestorePoint(isAuto: boolean = false): Promise<{ success: boolean; error?: string; point?: RestorePoint }> {
  try {
    const timestamp = new Date().toISOString();
    const name = `backup-${isAuto ? 'AUTO-' : ''}${timestamp.replace(/[:.]/g, '_').replace(/\..+/, '')}`;
    const data: Record<string, any> = {};

    for (const collection of BACKUP_COLLECTIONS) {
      try {
        data[collection.file] = await readData(collection.file, collection.defaultValue);
      } catch (error) {
        console.warn(`[Backup] No se pudo leer ${collection.file} para snapshot`, error);
      }
    }

    const existing = await readData<SnapshotEntry[]>(SNAPSHOTS_FILE, []);
    const updated: SnapshotEntry[] = [{ name, timestamp, isAuto, data }, ...existing].slice(0, MAX_SNAPSHOTS);
    await writeData(SNAPSHOTS_FILE, updated);

    return { success: true, point: { name, timestamp, isAuto, collections: Object.keys(data).length, displayDate: getDisplayDate(timestamp, isAuto) } };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error al crear el punto de restauracion.' };
  }
}

export async function restoreFromPoint(pointName: string): Promise<{ success: boolean; error?: string; summary?: RestoreSummaryItem[] }> {
  try {
    const snapshots = await readData<SnapshotEntry[]>(SNAPSHOTS_FILE, []);
    const snapshot = snapshots.find((entry) => entry.name === pointName);
    if (!snapshot) return { success: false, error: 'Punto de restauracion no encontrado.' };

    const summary: RestoreSummaryItem[] = [];
    for (const [file, value] of Object.entries(snapshot.data || {})) {
      if (!isRestorableDataFile(file)) continue;
      await writeData(file, value);
      summary.push({ file: file.replace('.json', ''), count: getBackupValueCount(value) });
    }

    return { success: true, summary };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error al restaurar.' };
  }
}

export async function deleteRestorePoint(pointName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const snapshots = await readData<SnapshotEntry[]>(SNAPSHOTS_FILE, []);
    const updated = snapshots.filter((entry) => entry.name !== pointName);
    await writeData(SNAPSHOTS_FILE, updated);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error al eliminar.' };
  }
}

export async function triggerAutoBackup(): Promise<void> {
  try {
    const snapshots = await readData<SnapshotEntry[]>(SNAPSHOTS_FILE, []);
    const lastAuto = snapshots.find((entry) => entry.isAuto);
    if (lastAuto) {
      const diffMinutes = (Date.now() - new Date(lastAuto.timestamp).getTime()) / (1000 * 60);
      if (diffMinutes < 30) return;
    }
    await createRestorePoint(true);
  } catch (error) {
    console.error('AutoBackup failed', error);
  }
}

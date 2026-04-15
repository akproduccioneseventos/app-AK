'use server';

import { readData, writeData } from '@/lib/data-service';
import fs from 'fs/promises';
import path from 'path';

const SNAPSHOTS_FILE = '_backup-snapshots.json';
const MAX_SNAPSHOTS = 15;
const CRITICAL_COLLECTIONS = new Set([
  'servicios-empresa.json',
  'armado-rapido-config.json',
  'activos-fijos.json',
  'proveedores.json',
  'empleados.json',
  'menus-catering.json',
]);

const ALL_COLLECTIONS = [
  { file: 'presupuestos.json', defaultValue: [] },
  { file: 'customers.json', defaultValue: [] },
  { file: 'servicios-empresa.json', defaultValue: [] },
  { file: 'activos-fijos.json', defaultValue: [] },
  { file: 'menus-catering.json', defaultValue: [] },
  { file: 'insumos.json', defaultValue: [] },
  { file: 'fiestas.json', defaultValue: [] },
  { file: 'invoices.json', defaultValue: [] },
  { file: 'empleados.json', defaultValue: [] },
  { file: 'proveedores.json', defaultValue: [] },
  { file: 'crm-leads.json', defaultValue: [] },
  { file: 'crm-stages.json', defaultValue: [] },
  { file: 'crm-meetings.json', defaultValue: [] },
  { file: 'notifications.json', defaultValue: [] },
  { file: 'scheduled-messages.json', defaultValue: [] },
  { file: 'app-settings.json', defaultValue: {} },
  { file: 'company-info.json', defaultValue: {} },
  { file: 'contract-settings.json', defaultValue: {} },
  { file: 'whatsapp-settings.json', defaultValue: {} },
  { file: 'whatsapp-templates.json', defaultValue: {} },
  { file: 'feature-flags.json', defaultValue: [] },
  { file: 'galeria-publica.json', defaultValue: [] },
  { file: 'menus.json', defaultValue: [] },
  { file: 'coupons.json', defaultValue: [] },
  { file: 'ai-assistant-settings.json', defaultValue: {} },
  { file: 'armado-rapido-config.json', defaultValue: {} },
  { file: 'budget-display-settings.json', defaultValue: {} },
  { file: 'social-connections.json', defaultValue: [] },
  { file: 'accesos-personal.json', defaultValue: [] },
  { file: 'invoice-template-settings.json', defaultValue: {} },
  { file: 'automatizaciones-alertas.json', defaultValue: [] },
  { file: 'playbooks.json', defaultValue: [] },
  { file: 'recursos-multi-evento.json', defaultValue: [] },
];

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
  return `${isAuto ? '🤖 AUTO: ' : '👤 MANUAL: '}${new Date(timestamp).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'medium' })}`;
}

function getCollectionCount(value: any): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') return Object.keys(value).length || 1;
  return value == null ? 0 : 1;
}

function isCollectionEmpty(value: any): boolean {
  if (Array.isArray(value)) return value.length === 0;
  if (value && typeof value === 'object') return Object.keys(value).length === 0;
  return value == null;
}

async function readDataFromRepoFile<T>(fileName: string, defaultValue: T): Promise<T> {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', fileName);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(fileContent);

    if (Array.isArray(defaultValue) && !Array.isArray(parsed)) return defaultValue;
    if (!Array.isArray(defaultValue) && (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))) return defaultValue;

    return parsed as T;
  } catch (error) {
    console.warn(`[Backup] No se pudo leer fallback local para ${fileName}`, error);
    return defaultValue;
  }
}

export async function getRestorePoints(): Promise<RestorePoint[]> {
  const snapshots = await readData<SnapshotEntry[]>(SNAPSHOTS_FILE, []);
  return snapshots
    .map((snapshot) => ({
      name: snapshot.name,
      timestamp: snapshot.timestamp,
      isAuto: Boolean(snapshot.isAuto),
      collections: Object.keys(snapshot.data || {}).length,
      displayDate: getDisplayDate(snapshot.timestamp, Boolean(snapshot.isAuto)),
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function createRestorePoint(isAuto: boolean = false): Promise<{ success: boolean; error?: string; point?: RestorePoint }> {
  try {
    const timestamp = new Date().toISOString();
    const name = `backup-${isAuto ? 'AUTO-' : ''}${timestamp.replace(/[:.]/g, '_').replace(/\..+/, '')}`;
    const data: Record<string, any> = {};

    for (const collection of ALL_COLLECTIONS) {
      try {
        const persistedData = await readData(collection.file, collection.defaultValue);

        if (CRITICAL_COLLECTIONS.has(collection.file) && isCollectionEmpty(persistedData)) {
          const localData = await readDataFromRepoFile(collection.file, collection.defaultValue);
          if (isCollectionEmpty(localData)) {
            console.warn(`[Backup] Colección crítica vacía en Firestore y también vacía en fallback local: ${collection.file}`);
            // Mantener persistedData preserva el comportamiento actual del snapshot aun sin fallback disponible.
          }
          data[collection.file] = isCollectionEmpty(localData) ? persistedData : localData;
          continue;
        }

        data[collection.file] = persistedData;
      } catch (error) {
        console.warn(`[Backup] No se pudo leer ${collection.file} para snapshot`, error);
        continue;
      }
    }

    const existing = await readData<SnapshotEntry[]>(SNAPSHOTS_FILE, []);
    const updated: SnapshotEntry[] = [{ name, timestamp, isAuto, data }, ...existing].slice(0, MAX_SNAPSHOTS);

    await writeData(SNAPSHOTS_FILE, updated);

    return {
      success: true,
      point: {
        name,
        timestamp,
        isAuto,
        collections: Object.keys(data).length,
        displayDate: getDisplayDate(timestamp, isAuto),
      },
    };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error al crear el punto de restauración.' };
  }
}

export async function restoreFromPoint(pointName: string): Promise<{ success: boolean; error?: string; summary?: RestoreSummaryItem[] }> {
  try {
    const snapshots = await readData<SnapshotEntry[]>(SNAPSHOTS_FILE, []);
    const snapshot = snapshots.find((entry) => entry.name === pointName);
    if (!snapshot) {
      return { success: false, error: 'Punto de restauración no encontrado.' };
    }

    const summary: RestoreSummaryItem[] = [];
    for (const [file, value] of Object.entries(snapshot.data || {})) {
      await writeData(file, value);
      summary.push({
        file: file.replace('.json', ''),
        count: getCollectionCount(value),
      });
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

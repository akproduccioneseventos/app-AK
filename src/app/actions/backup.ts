'use server';

import type { Firestore } from 'firebase-admin/firestore';
import { readData, writeData } from '@/lib/data-service';
import { BACKUP_COLLECTIONS, getBackupValueCount, isRestorableDataFile } from '@/lib/backup/backup-registry';
import { decodeSnapshotValue, encodeSnapshotValue, type EncodedSnapshotChunk } from '@/lib/backup/snapshot-codec';
import { requireAppSession } from '@/lib/auth/require-session';
import { AUTO_BACKUP_INTERNAL_TOKEN } from '@/lib/backup/internal-token';

const LEGACY_SNAPSHOTS_FILE = '_backup-snapshots.json';
const SNAPSHOTS_COLLECTION = 'backup_snapshots_v2';
const AUTO_BACKUP_STATE_COLLECTION = 'backup_system';
const AUTO_BACKUP_STATE_DOCUMENT = 'auto_backup';
const MAX_SNAPSHOTS = 15;
const FIRESTORE_BATCH_SIZE = 400;
const AUTO_BACKUP_INTERVAL_MS = 30 * 60 * 1000;
const AUTO_BACKUP_LEASE_MS = 5 * 60 * 1000;

interface LegacySnapshotEntry {
  name: string;
  timestamp: string;
  isAuto: boolean;
  data: Record<string, any>;
}

interface SnapshotFileManifest {
  file: string;
  fileIndex: number;
  chunks: number;
  count: number;
}

interface SnapshotManifest {
  name: string;
  timestamp: string;
  isAuto: boolean;
  status: 'complete';
  version: 2;
  collections: number;
  files: SnapshotFileManifest[];
}

interface StoredSnapshotChunk {
  fileIndex: number;
  chunkIndex: number;
  content: string;
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

let autoBackupPromise: Promise<void> | null = null;

function getDisplayDate(timestamp: string, isAuto: boolean) {
  return `${isAuto ? 'AUTO: ' : 'MANUAL: '}${new Date(timestamp).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'medium' })}`;
}

function toRestorePoint(snapshot: Pick<SnapshotManifest, 'name' | 'timestamp' | 'isAuto' | 'collections'>): RestorePoint {
  return {
    name: snapshot.name,
    timestamp: snapshot.timestamp,
    isAuto: Boolean(snapshot.isAuto),
    collections: snapshot.collections,
    displayDate: getDisplayDate(snapshot.timestamp, Boolean(snapshot.isAuto)),
  };
}

async function getBackupDb(): Promise<Firestore> {
  const { dbAdmin } = await import('@/lib/firebase/server');
  if (!dbAdmin) {
    throw new Error('Firebase no esta disponible para crear el respaldo.');
  }
  return dbAdmin as Firestore;
}

async function listV2Manifests(db: Firestore): Promise<SnapshotManifest[]> {
  const snapshot = await db.collection(SNAPSHOTS_COLLECTION).get();
  return snapshot.docs
    .map((doc) => doc.data() as Partial<SnapshotManifest>)
    .filter((item): item is SnapshotManifest => (
      item.status === 'complete'
      && item.version === 2
      && typeof item.name === 'string'
      && typeof item.timestamp === 'string'
      && Array.isArray(item.files)
    ))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

async function commitWrites(
  db: Firestore,
  writes: Array<{ ref: FirebaseFirestore.DocumentReference; data: Record<string, unknown> }>,
) {
  for (let offset = 0; offset < writes.length; offset += FIRESTORE_BATCH_SIZE) {
    const batch = db.batch();
    writes.slice(offset, offset + FIRESTORE_BATCH_SIZE).forEach(({ ref, data }) => {
      batch.set(ref, data);
    });
    await batch.commit();
  }
}

async function deleteV2Snapshot(db: Firestore, pointName: string): Promise<void> {
  const manifestRef = db.collection(SNAPSHOTS_COLLECTION).doc(pointName);
  const chunks = await manifestRef.collection('chunks').get();
  const refs = chunks.docs.map((doc) => doc.ref);

  for (let offset = 0; offset < refs.length; offset += FIRESTORE_BATCH_SIZE) {
    const batch = db.batch();
    refs.slice(offset, offset + FIRESTORE_BATCH_SIZE).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  await manifestRef.delete();
}

async function pruneV2Snapshots(db: Firestore): Promise<void> {
  const manifests = await listV2Manifests(db);
  for (const expired of manifests.slice(MAX_SNAPSHOTS)) {
    await deleteV2Snapshot(db, expired.name);
  }
}

async function readAllBackupData(): Promise<Array<{ file: string; value: any }>> {
  const results = await Promise.all(BACKUP_COLLECTIONS.map(async (collection) => {
    try {
      return {
        ok: true as const,
        file: collection.file,
        value: await readData(collection.file, collection.defaultValue),
      };
    } catch (error) {
      console.warn(`[Backup] No se pudo leer ${collection.file} para snapshot`, error);
      return { ok: false as const, file: collection.file };
    }
  }));

  return results
    .filter((result): result is Extract<(typeof results)[number], { ok: true }> => result.ok)
    .map(({ file, value }) => ({ file, value }));
}

async function readV2Snapshot(
  db: Firestore,
  pointName: string,
): Promise<{ manifest: SnapshotManifest; data: Record<string, any> } | null> {
  const manifestRef = db.collection(SNAPSHOTS_COLLECTION).doc(pointName);
  const manifestDocument = await manifestRef.get();
  if (!manifestDocument.exists) return null;

  const manifest = manifestDocument.data() as SnapshotManifest;
  if (manifest.status !== 'complete' || manifest.version !== 2 || !Array.isArray(manifest.files)) {
    throw new Error('El punto de restauracion esta incompleto.');
  }

  const chunkDocuments = await manifestRef.collection('chunks').get();
  const chunksByFile = new Map<number, EncodedSnapshotChunk[]>();

  chunkDocuments.docs.forEach((document) => {
    const chunk = document.data() as StoredSnapshotChunk;
    const current = chunksByFile.get(chunk.fileIndex) ?? [];
    current.push({ index: chunk.chunkIndex, content: chunk.content });
    chunksByFile.set(chunk.fileIndex, current);
  });

  const data: Record<string, any> = {};
  for (const fileManifest of manifest.files) {
    const chunks = chunksByFile.get(fileManifest.fileIndex) ?? [];
    if (chunks.length !== fileManifest.chunks) {
      throw new Error(`El respaldo de ${fileManifest.file} esta incompleto.`);
    }
    data[fileManifest.file] = decodeSnapshotValue(chunks);
  }

  return { manifest, data };
}

async function acquireAutoBackupLease(db: Firestore): Promise<boolean> {
  const stateRef = db.collection(AUTO_BACKUP_STATE_COLLECTION).doc(AUTO_BACKUP_STATE_DOCUMENT);
  const now = Date.now();

  return db.runTransaction(async (transaction) => {
    const document = await transaction.get(stateRef);
    const state = document.data() as { lastCompletedAtMs?: number; leaseUntilMs?: number } | undefined;
    const lastCompletedAtMs = Number(state?.lastCompletedAtMs || 0);
    const leaseUntilMs = Number(state?.leaseUntilMs || 0);

    if (now - lastCompletedAtMs < AUTO_BACKUP_INTERVAL_MS || leaseUntilMs > now) {
      return false;
    }

    transaction.set(stateRef, {
      leaseUntilMs: now + AUTO_BACKUP_LEASE_MS,
      startedAt: new Date(now).toISOString(),
    }, { merge: true });
    return true;
  });
}

async function finishAutoBackupLease(db: Firestore, error?: unknown): Promise<void> {
  const now = Date.now();
  await db.collection(AUTO_BACKUP_STATE_COLLECTION).doc(AUTO_BACKUP_STATE_DOCUMENT).set({
    leaseUntilMs: 0,
    ...(error
      ? { lastError: error instanceof Error ? error.message : String(error), failedAt: new Date(now).toISOString() }
      : { lastCompletedAtMs: now, lastCompletedAt: new Date(now).toISOString(), lastError: null }),
  }, { merge: true });
}

export async function getRestorePoints(): Promise<RestorePoint[]> {
  await requireAppSession();
  const [legacySnapshots, db] = await Promise.all([
    readData<LegacySnapshotEntry[]>(LEGACY_SNAPSHOTS_FILE, []),
    getBackupDb(),
  ]);
  const v2Manifests = await listV2Manifests(db);

  const points = [
    ...v2Manifests.map(toRestorePoint),
    ...legacySnapshots.map((snapshot) => toRestorePoint({
      name: snapshot.name,
      timestamp: snapshot.timestamp,
      isAuto: Boolean(snapshot.isAuto),
      collections: Object.keys(snapshot.data || {}).length,
    })),
  ];

  return Array.from(new Map(points.map((point) => [point.name, point])).values())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, MAX_SNAPSHOTS);
}

async function createRestorePointInternal(isAuto: boolean): Promise<{ success: boolean; error?: string; point?: RestorePoint }> {
  let db: Firestore | null = null;
  let name = '';

  try {
    db = await getBackupDb();
    const timestamp = new Date().toISOString();
    name = `backup-${isAuto ? 'AUTO-' : ''}${timestamp.replace(/[:.]/g, '_')}`;
    const manifestRef = db.collection(SNAPSHOTS_COLLECTION).doc(name);
    const backupData = await readAllBackupData();
    const files: SnapshotFileManifest[] = [];
    const writes: Array<{ ref: FirebaseFirestore.DocumentReference; data: Record<string, unknown> }> = [];

    backupData.forEach(({ file, value }, fileIndex) => {
      const chunks = encodeSnapshotValue(value);
      files.push({
        file,
        fileIndex,
        chunks: chunks.length,
        count: getBackupValueCount(value),
      });

      chunks.forEach((chunk) => {
        const chunkId = `${String(fileIndex).padStart(3, '0')}-${String(chunk.index).padStart(4, '0')}`;
        writes.push({
          ref: manifestRef.collection('chunks').doc(chunkId),
          data: {
            fileIndex,
            chunkIndex: chunk.index,
            content: chunk.content,
          },
        });
      });
    });

    await commitWrites(db, writes);

    const manifest: SnapshotManifest = {
      name,
      timestamp,
      isAuto,
      status: 'complete',
      version: 2,
      collections: files.length,
      files,
    };
    await manifestRef.set(manifest);
    await pruneV2Snapshots(db);

    return { success: true, point: toRestorePoint(manifest) };
  } catch (error: any) {
    if (db && name) {
      await deleteV2Snapshot(db, name).catch(() => {});
    }
    return { success: false, error: error?.message || 'Error al crear el punto de restauracion.' };
  }
}

export async function createRestorePoint(): Promise<{ success: boolean; error?: string; point?: RestorePoint }> {
  await requireAppSession();
  return createRestorePointInternal(false);
}

export async function restoreFromPoint(pointName: string): Promise<{ success: boolean; error?: string; summary?: RestoreSummaryItem[] }> {
  await requireAppSession();
  try {
    const db = await getBackupDb();
    const v2Snapshot = await readV2Snapshot(db, pointName);
    let data: Record<string, any> | undefined = v2Snapshot?.data;

    if (!data) {
      const legacySnapshots = await readData<LegacySnapshotEntry[]>(LEGACY_SNAPSHOTS_FILE, []);
      data = legacySnapshots.find((entry) => entry.name === pointName)?.data;
    }

    if (!data) return { success: false, error: 'Punto de restauracion no encontrado.' };

    const summary: RestoreSummaryItem[] = [];
    for (const [file, value] of Object.entries(data)) {
      if (!isRestorableDataFile(file)) continue;
      await writeData(file, value, undefined, { skipAutoBackup: true });
      summary.push({ file: file.replace('.json', ''), count: getBackupValueCount(value) });
    }

    return { success: true, summary };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error al restaurar.' };
  }
}

export async function deleteRestorePoint(pointName: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  try {
    const db = await getBackupDb();
    const v2Document = await db.collection(SNAPSHOTS_COLLECTION).doc(pointName).get();
    if (v2Document.exists) {
      await deleteV2Snapshot(db, pointName);
      return { success: true };
    }

    const legacySnapshots = await readData<LegacySnapshotEntry[]>(LEGACY_SNAPSHOTS_FILE, []);
    const updated = legacySnapshots.filter((entry) => entry.name !== pointName);
    await writeData(LEGACY_SNAPSHOTS_FILE, updated, undefined, { skipAutoBackup: true });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error al eliminar.' };
  }
}

async function runAutoBackup(): Promise<void> {
  const db = await getBackupDb();
  const acquired = await acquireAutoBackupLease(db);
  if (!acquired) return;

  try {
    const result = await createRestorePointInternal(true);
    if (!result.success) {
      throw new Error(result.error || 'No se pudo crear el respaldo automatico.');
    }
    await finishAutoBackupLease(db);
  } catch (error) {
    await finishAutoBackupLease(db, error).catch(() => {});
    throw error;
  }
}

export async function triggerAutoBackup(internalToken?: symbol): Promise<void> {
  if (internalToken !== AUTO_BACKUP_INTERNAL_TOKEN) {
    throw new Error('Activacion de respaldo no autorizada.');
  }
  if (autoBackupPromise) return autoBackupPromise;

  autoBackupPromise = runAutoBackup()
    .catch((error) => {
      console.error('AutoBackup failed', error);
    })
    .finally(() => {
      autoBackupPromise = null;
    });

  return autoBackupPromise;
}

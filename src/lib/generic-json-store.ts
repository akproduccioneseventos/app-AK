'use server';

import * as logger from './logger';
import { isSafeTopLevelJsonFile } from './backup/backup-registry';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

const GENERIC_JSON_COLLECTION = 'json_documents';

function getGenericDocId(filePath: string): string {
  return encodeURIComponent(filePath.replace(/\\/g, '/'));
}

function unwrapGenericDocument(data: Record<string, any> | undefined): any | null {
  if (!data) return null;
  if (Array.isArray(data._arrayData)) return data._arrayData;
  if (Object.prototype.hasOwnProperty.call(data, '_data')) return data._data;
  if (Object.prototype.hasOwnProperty.call(data, '_value')) return data._value;

  const { _filePath, _syncedAt, ...rest } = data;
  return rest;
}

async function queryWithTimeout<T>(promise: Promise<T>, timeoutMs = 2500): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timeout de consulta a base de datos superado (${timeoutMs}ms)`));
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function getDbAdmin() {
  const { dbAdmin } = await import('./firebase/server');
  if (!dbAdmin) throw new Error('[Generic JSON Store] Firebase no disponible.');
  return dbAdmin;
}

export async function syncGenericJsonFile(filePath: string, data: any): Promise<void> {
  const normalizedPath = filePath.replace(/\\/g, '/');
  if (!isSafeTopLevelJsonFile(normalizedPath)) return;
  if (logger.shouldSkipFirestoreDuringBuild()) return;

  const db = await getDbAdmin();
  const docId = getGenericDocId(normalizedPath);

  if (Array.isArray(data)) {
    await queryWithTimeout(db.collection(GENERIC_JSON_COLLECTION).doc(docId).set({ _filePath: normalizedPath, _arrayData: data, _syncedAt: new Date().toISOString() }), 3000);
    return;
  }

  if (data && typeof data === 'object') {
    await queryWithTimeout(db.collection(GENERIC_JSON_COLLECTION).doc(docId).set({ _filePath: normalizedPath, _data: data, _syncedAt: new Date().toISOString() }), 3000);
    return;
  }

  await queryWithTimeout(db.collection(GENERIC_JSON_COLLECTION).doc(docId).set({ _filePath: normalizedPath, _value: data, _syncedAt: new Date().toISOString() }), 3000);
}

export async function readGenericJsonFile(filePath: string): Promise<any | null> {
  const normalizedPath = filePath.replace(/\\/g, '/');
  if (!isSafeTopLevelJsonFile(normalizedPath)) return null;
  if (logger.shouldSkipFirestoreDuringBuild()) return null;

  try {
    const db = await getDbAdmin();
    const doc = await queryWithTimeout(db.collection(GENERIC_JSON_COLLECTION).doc(getGenericDocId(normalizedPath)).get(), 2500);
    if (!doc.exists) return null;
    return unwrapGenericDocument(doc.data());
  } catch (error) {
    if (!logger.isBuildTime() || !logger.isDefaultCredentialError(error)) {
      logger.warn(`[Generic JSON Store] No se pudo leer "${normalizedPath}":`, logger.compactError(error));
    }
    return null;
  }
}

export async function listGenericJsonDocuments(): Promise<Record<string, any>> {
  if (logger.shouldSkipFirestoreDuringBuild()) return {};

  try {
    const db = await getDbAdmin();
    const snapshot = await queryWithTimeout(db.collection(GENERIC_JSON_COLLECTION).get(), 3000);
    if (snapshot.empty) return {};

    const result: Record<string, any> = {};
    snapshot.docs.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      const filePath = typeof data._filePath === 'string' ? data._filePath : decodeURIComponent(doc.id);
      if (!isSafeTopLevelJsonFile(filePath)) return;
      result[filePath] = unwrapGenericDocument(data);
    });
    return result;
  } catch (error) {
    if (!logger.isBuildTime() || !logger.isDefaultCredentialError(error)) {
      logger.warn('[Generic JSON Store] No se pudieron listar documentos genericos:', logger.compactError(error));
    }
    return {};
  }
}

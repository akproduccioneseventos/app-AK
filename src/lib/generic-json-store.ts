'use server';

import * as logger from './logger';
import { isSafeTopLevelJsonFile } from './backup/backup-registry';
import { AsyncMutex } from './mutex';
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
    await db.collection(GENERIC_JSON_COLLECTION).doc(docId).set({ _filePath: normalizedPath, _arrayData: data, _syncedAt: new Date().toISOString() });
    return;
  }

  if (data && typeof data === 'object') {
    await db.collection(GENERIC_JSON_COLLECTION).doc(docId).set({ _filePath: normalizedPath, _data: data, _syncedAt: new Date().toISOString() });
    return;
  }

  await db.collection(GENERIC_JSON_COLLECTION).doc(docId).set({ _filePath: normalizedPath, _value: data, _syncedAt: new Date().toISOString() });
}

/**
 * CAMBIAR UNA LISTA GUARDADA COMO UN SOLO DOCUMENTO, SIN PISAR A OTRO.
 *
 * Estas listas (por ejemplo, los recibos de sueldo) viven enteras en un documento. Leerla,
 * cambiarla y guardarla en tres pasos perdia el cambio de otro servidor que guardo en el
 * medio. Aca se lee y se guarda adentro de una transaccion: si otro la cambio, la base
 * repite `cambiar` con la lista nueva. `cambiar` devuelve null para no guardar nada.
 */
export async function mutateGenericJsonArray<T>(
  filePath: string,
  cambiar: (lista: T[]) => T[] | null,
): Promise<T[] | null> {
  const normalizedPath = filePath.replace(/\\/g, '/');
  if (!isSafeTopLevelJsonFile(normalizedPath)) throw new Error(`Archivo no permitido: ${normalizedPath}`);
  const db = await getDbAdmin();
  const ref = db.collection(GENERIC_JSON_COLLECTION).doc(getGenericDocId(normalizedPath));
  let resultado: T[] | null = null;
  await db.runTransaction(async (transaction) => {
    resultado = null;
    const snapshot = await transaction.get(ref);
    const actual = snapshot.exists ? unwrapGenericDocument(snapshot.data()) : [];
    const nueva = cambiar(Array.isArray(actual) ? (actual as T[]) : []);
    if (!nueva) return;
    transaction.set(ref, { _filePath: normalizedPath, _arrayData: nueva, _syncedAt: new Date().toISOString() });
    resultado = nueva;
  });
  return resultado;
}

/**
 * Como `mutateGenericJsonArray`, pero `cambiar` recibe la transaccion y puede leer y
 * escribir OTROS documentos adentro de la misma operacion. O pasa todo, o no pasa nada.
 *
 * Lo pidio Codex el 25 de septiembre de 2026 para la barra: vaciar la lista de botellas por
 * devolver y devolverlas eran dos pasos; un reinicio en el medio perdia la devolucion.
 * `cambiar` tiene que hacer TODAS sus lecturas antes de cualquier escritura (regla de la base).
 */
export async function mutateGenericJsonArrayConTransaccion<T>(
  filePath: string,
  cambiar: (
    lista: T[],
    transaction: FirebaseFirestore.Transaction,
    db: FirebaseFirestore.Firestore,
  ) => Promise<T[] | null>,
): Promise<T[] | null> {
  const normalizedPath = filePath.replace(/\\/g, '/');
  if (!isSafeTopLevelJsonFile(normalizedPath)) throw new Error(`Archivo no permitido: ${normalizedPath}`);
  const db = await getDbAdmin();
  const ref = db.collection(GENERIC_JSON_COLLECTION).doc(getGenericDocId(normalizedPath));
  let resultado: T[] | null = null;
  await db.runTransaction(async (transaction) => {
    resultado = null;
    const snapshot = await transaction.get(ref);
    const actual = snapshot.exists ? unwrapGenericDocument(snapshot.data()) : [];
    const nueva = await cambiar(Array.isArray(actual) ? (actual as T[]) : [], transaction, db);
    if (!nueva) return;
    transaction.set(ref, { _filePath: normalizedPath, _arrayData: nueva, _syncedAt: new Date().toISOString() });
    resultado = nueva;
  });
  return resultado;
}

/**
 * CAMBIAR UN DOCUMENTO ENTERO (NO UN ARRAY) SIN PISAR A OTRO.
 *
 * Para documentos que guardan un objeto (por ejemplo, chats o memoria del
 * asistente): lee, transforma y guarda adentro de una transacción. Si dos
 * servidores intentan guardar al mismo tiempo, la base repite `cambiar` con
 * el dato más nuevo. Si `cambiar` devuelve `null`, no guarda nada.
 *
 * **path**: dos segmentos separados por `/`, el segundo termina en `.json`.
 * Ejemplo: `"multiagent/chats.json"`. Usa validación propia y NO llama a
 * `isSafeTopLevelJsonFile` porque esa rechaza cualquier path con `/`.
 */
class FileAsyncMutex extends AsyncMutex {}
const fileMutexes = new Map<string, FileAsyncMutex>();
function getFileMutex(path: string): FileAsyncMutex {
  let m = fileMutexes.get(path);
  if (!m) {
    m = new FileAsyncMutex();
    fileMutexes.set(path, m);
  }
  return m;
}

export async function mutarDocumentoConTransaccion<T>(
  filePath: string,
  vacio: T,
  cambiar: (actual: T) => Promise<T | null> | T | null,
): Promise<T | null> {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const partes = normalizedPath.split('/');
  if (partes.length !== 2 || !partes[1].endsWith('.json')) {
    throw new Error(
      `[mutarDocumentoConTransaccion] Path inválido: "${normalizedPath}". Debe ser "coleccion/archivo.json".`,
    );
  }

  if (process.env.AK_USE_LOCAL_JSON_ONLY === 'true') {
    const { readData, writeData } = await import('./data-service');
    const mutex = getFileMutex(normalizedPath);
    return mutex.runExclusive(async () => {
      const actual = await readData<T>(normalizedPath, vacio);
      const nuevo = await cambiar(actual ?? vacio);
      if (nuevo === null) return null;
      await writeData(normalizedPath, nuevo);
      return nuevo;
    });
  }

  const collection = partes[0];
  const docId = partes[1].replace(/\.json$/, '');
  const db = await getDbAdmin();
  const ref = db.collection(collection).doc(docId);
  let resultado: T | null = null;

  await db.runTransaction(async (transaction) => {
    resultado = null;
    const snapshot = await transaction.get(ref);
    let actual: T = vacio;
    if (snapshot.exists) {
      const data = snapshot.data();
      if (data) {
        const copy = { ...data };
        delete copy._syncedAt;
        actual = (copy._data !== undefined ? copy._data : copy) as T;
      }
    }
    const nuevo = await cambiar(actual ?? vacio);
    if (nuevo === null) return;
    const cleanData = typeof nuevo === 'object' && nuevo !== null ? nuevo : { value: nuevo };
    transaction.set(ref, {
      ...cleanData,
      _syncedAt: new Date().toISOString(),
    });
    resultado = nuevo;
  });

  if (resultado !== null) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      for (const base of ['data', 'src/data']) {
        const full = path.join(process.cwd(), base, normalizedPath);
        await fs.mkdir(path.dirname(full), { recursive: true });
        await fs.writeFile(full, JSON.stringify(resultado, null, 2), 'utf-8');
      }
    } catch {}
  }

  return resultado;
}

export async function readGenericJsonFile(filePath: string): Promise<any | null> {
  const normalizedPath = filePath.replace(/\\/g, '/');
  if (!isSafeTopLevelJsonFile(normalizedPath)) return null;
  if (logger.shouldSkipFirestoreDuringBuild()) return null;

  try {
    const db = await getDbAdmin();
    const doc = await db.collection(GENERIC_JSON_COLLECTION).doc(getGenericDocId(normalizedPath)).get();
    if (!doc.exists) return null;
    return unwrapGenericDocument(doc.data());
  } catch (error) {
    if (!logger.isBuildTime() || !logger.isDefaultCredentialError(error)) {
      logger.warn(`[Generic JSON Store] No se pudo leer "${normalizedPath}":`, logger.compactError(error));
    }
    return null;
  }
}

/**
 * LEER PARA GUARDAR ENCIMA: HAY QUE SABER SI SE PUDO LEER.
 *
 * De donde sale, y es de las peores que aparecieron. Cuando se guarda un cambio
 * parcial -por ejemplo, solo el telefono de un contacto-, la app **lee lo que habia,
 * le suma lo nuevo y guarda el conjunto entero**. `readGenericJsonFile` devuelve
 * `null` en dos casos que no son lo mismo: cuando el documento **no existe**, y
 * cuando **no se pudo leer** -la base tardo, se corto la red, fallo el permiso-.
 *
 * Con el segundo caso confundido con el primero, la app entiende que no habia nada
 * y **guarda encima solo el pedacito nuevo: el resto se borra**. Sin aviso, sin
 * error en pantalla, y justo cuando la base anda mal, que es cuando mas duele.
 *
 * Lo reprodujo Codex el 14 de septiembre de 2026. Por eso el camino que guarda usa
 * esta funcion y no la otra: **dice si pudo leer**. Si no pudo, no se guarda nada.
 */
export async function leerGenericJsonParaGuardarEncima(
  filePath: string,
): Promise<{ sePudoLeer: boolean; datos: any | null }> {
  const normalizedPath = filePath.replace(/\\/g, '/');
  if (!isSafeTopLevelJsonFile(normalizedPath)) return { sePudoLeer: true, datos: null };
  if (logger.shouldSkipFirestoreDuringBuild()) return { sePudoLeer: true, datos: null };

  try {
    const db = await getDbAdmin();
    const doc = await db.collection(GENERIC_JSON_COLLECTION).doc(getGenericDocId(normalizedPath)).get();
    if (!doc.exists) return { sePudoLeer: true, datos: null };
    return { sePudoLeer: true, datos: unwrapGenericDocument(doc.data()) };
  } catch (error) {
    logger.warn(
      `[Generic JSON Store] No se pudo leer "${normalizedPath}" antes de guardar encima:`,
      logger.compactError(error),
    );
    return { sePudoLeer: false, datos: null };
  }
}

export async function listGenericJsonDocuments(): Promise<Record<string, any>> {
  if (logger.shouldSkipFirestoreDuringBuild()) return {};

  try {
    const db = await getDbAdmin();
    const snapshot = await db.collection(GENERIC_JSON_COLLECTION).get();
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

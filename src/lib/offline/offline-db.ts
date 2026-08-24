'use client';

/**
 * Base de datos local IndexedDB para almacenar capturas (fotos, videos y audios)
 * en formato Blob cuando no hay conexion a internet.
 *
 * REGLA CRITICA DE ESTABILIDAD:
 * Nunca guardar archivos binarios como Base64 en localStorage (limite de 5MB).
 * En IndexedDB se almacenan como Blob nativo sin saturar la memoria.
 */

export interface OfflineMediaItem {
  id: string;
  fiestaId: string;
  moduleId: string; // 'fotocabina' | 'espejo-magico' | 'plataforma-360' | 'touchpix' | 'buzon' | 'video-vida' | 'totem' | 'muro-en-vivo'
  fileBlob: Blob;
  fileName: string;
  mimeType: string;
  createdAt: string;
  authorName: string;
  /** Identidad del invitado que sacó la foto en la estación/kiosco */
  guestId?: string;
  guestAccessToken?: string;
  accessToken?: string;
  metadata?: Record<string, any>;
  attempts: number;
  lastError?: string | null;
}

/**
 * Claves que NO se guardan dentro del `metadata` suelto de una captura.
 *
 * Se habia aflojado este filtro para poder saber de quien era cada foto sacada sin
 * internet. Ya no hace falta: la identidad viaja en los campos propios de arriba
 * (`guestId` y las llaves), asi que el `metadata` libre vuelve a filtrarse fuerte.
 *
 * Por que importa: las tabletas de la fotocabina, el espejo magico y la plataforma
 * 360 **las usa un invitado atras del otro**. Todo lo que quede escrito en la base
 * del navegador sobrevive al invitado que lo dejo. En el `metadata` libre entra
 * cualquier cosa que ponga la pantalla que llama, asi que ahi se filtra por las
 * dudas.
const SENSITIVE_OFFLINE_METADATA_KEY = /(?:accessToken|guestAccessToken|guestId|token|secret|credential|password)/i;

function sanitizeOfflineMetadata(
  metadata?: Record<string, any>,
): Record<string, any> | undefined {
  if (!metadata) return undefined;

  const entries = Object.entries(metadata);
  const safeEntries = entries.filter(([key]) => !SENSITIVE_OFFLINE_METADATA_KEY.test(key));
  if (safeEntries.length === entries.length) return metadata;
  return safeEntries.length > 0 ? Object.fromEntries(safeEntries) : undefined;
}

const DB_NAME = 'ak_offline_media_storage';
const DB_VERSION = 1;
const STORE_NAME = 'media_queue';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB no esta disponible en este entorno.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('fiestaId', 'fiestaId', { unique: false });
        store.createIndex('moduleId', 'moduleId', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Error al abrir IndexedDB'));
  });
}

/**
 * Guarda una captura en la cola local de IndexedDB.
 */
export async function saveOfflineMedia(
  entry: Omit<OfflineMediaItem, 'id' | 'createdAt' | 'attempts'>
): Promise<string> {
  const db = await openDatabase();
  const id = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const item: OfflineMediaItem = {
    ...entry,
    metadata: sanitizeOfflineMetadata(entry.metadata),
    id,
    createdAt: new Date().toISOString(),
    attempts: 0,
    lastError: null,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.add(item);

    req.onsuccess = () => {
      // Disparar evento personalizado para actualizar los contadores en pantalla
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ak-offline-media-updated'));
      }
      resolve(id);
    };
    req.onerror = () => reject(req.error || new Error('No se pudo guardar el archivo en IndexedDB'));
  });
}

/**
 * Retorna todos los archivos multimedia pendientes de subida.
 */
export async function getPendingOfflineMedia(fiestaId?: string): Promise<OfflineMediaItem[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const storedItems: OfflineMediaItem[] = req.result || [];
        let items = storedItems.map((item) => {
          const metadata = sanitizeOfflineMetadata(item.metadata);
          if (metadata === item.metadata) return item;

          const sanitizedItem = { ...item, metadata };
          store.put(sanitizedItem);
          return sanitizedItem;
        });
        if (fiestaId) {
          items = items.filter((it) => it.fiestaId === fiestaId);
        }
        // Orden cronologico ascendente (los mas antiguos primero)
        items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        resolve(items);
      };
      req.onerror = () => reject(req.error || new Error('Error al leer cola de IndexedDB'));
    });
  } catch {
    return [];
  }
}

/**
 * Cuenta la cantidad de capturas pendientes de subida.
 */
export async function getPendingOfflineMediaCount(
  fiestaId?: string,
  moduleId?: string
): Promise<number> {
  try {
    const items = await getPendingOfflineMedia(fiestaId);
    if (moduleId) {
      return items.filter((it) => it.moduleId === moduleId).length;
    }
    return items.length;
  } catch {
    return 0;
  }
}

/**
 * Elimina un elemento tras la confirmacion exitosa de subida por el servidor.
 */
export async function removeOfflineMedia(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ak-offline-media-updated'));
      }
      resolve();
    };
    req.onerror = () => reject(req.error || new Error('Error al eliminar de IndexedDB'));
  });
}

/**
 * Registra un intento fallido y el mensaje de error.
 */
export async function updateOfflineMediaAttempt(id: string, error: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item: OfflineMediaItem = getReq.result;
      if (!item) {
        resolve();
        return;
      }
      item.metadata = sanitizeOfflineMetadata(item.metadata);
      item.attempts += 1;
      item.lastError = error;
      const putReq = store.put(item);
      putReq.onsuccess = () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ak-offline-media-updated'));
        }
        resolve();
      };
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Limpia todos los elementos locales (usado en pruebas o reinicio).
 */
export async function clearAllOfflineMedia(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ak-offline-media-updated'));
      }
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

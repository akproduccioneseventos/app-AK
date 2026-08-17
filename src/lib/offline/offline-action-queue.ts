export type OfflineActionType = 'muro_foto' | 'recepcion_checkin' | 'barra_pedido';

export interface OfflineAction<T = any> {
  id: string;
  type: OfflineActionType;
  fiestaId: string;
  payload: T;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

const STORAGE_KEY = 'ak_offline_queue_v1';

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadOfflineQueue(): OfflineAction[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(queue: OfflineAction[]): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('[OfflineQueue] Error guardando cola offline:', error);
  }
}

/**
 * Encola una acción offline evitando duplicados por ID.
 */
export function enqueueOfflineAction<T>(action: {
  id?: string;
  type: OfflineActionType;
  fiestaId: string;
  payload: T;
}): OfflineAction<T> {
  const queue = loadOfflineQueue();
  const id = action.id || `off_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Evitar duplicados
  const existingIndex = queue.findIndex((item) => item.id === id);
  const newAction: OfflineAction<T> = {
    id,
    type: action.type,
    fiestaId: action.fiestaId,
    payload: action.payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };

  if (existingIndex >= 0) {
    queue[existingIndex] = newAction;
  } else {
    queue.push(newAction);
  }

  saveOfflineQueue(queue);
  return newAction;
}

/**
 * Elimina una acción completada de la cola.
 */
export function dequeueOfflineAction(id: string): void {
  const queue = loadOfflineQueue().filter((item) => item.id !== id);
  saveOfflineQueue(queue);
}

/**
 * Obtiene acciones pendientes filtradas opcionalmente por fiesta o tipo.
 */
export function getPendingOfflineActions(fiestaId?: string, type?: OfflineActionType): OfflineAction[] {
  return loadOfflineQueue().filter((action) => {
    if (fiestaId && action.fiestaId !== fiestaId) return false;
    if (type && action.type !== type) return false;
    return true;
  });
}

/**
 * Procesa la cola pendiente ejecutando la función de envío para cada elemento.
 */
export async function flushOfflineQueue(
  executor: (action: OfflineAction) => Promise<{ success: boolean; error?: string }>,
  options?: { fiestaId?: string }
): Promise<{ processed: number; failed: number; remaining: number }> {
  const queue = loadOfflineQueue();
  const toProcess = queue.filter((action) => {
    if (options?.fiestaId && action.fiestaId !== options.fiestaId) return false;
    return true;
  });

  let processed = 0;
  let failed = 0;

  for (const action of toProcess) {
    try {
      const result = await executor(action);
      if (result.success) {
        dequeueOfflineAction(action.id);
        processed++;
      } else {
        action.retryCount = (action.retryCount || 0) + 1;
        action.lastError = result.error || 'Error de envío';
        failed++;
      }
    } catch (err: any) {
      action.retryCount = (action.retryCount || 0) + 1;
      action.lastError = err?.message || 'Error desconocido';
      failed++;
    }
  }

  // Guardar reintentos actualizados si hubo fallos
  if (failed > 0) {
    const currentQueue = loadOfflineQueue();
    const updated = currentQueue.map((item) => {
      const failedMatch = toProcess.find((p) => p.id === item.id);
      return failedMatch || item;
    });
    saveOfflineQueue(updated);
  }

  return {
    processed,
    failed,
    remaining: loadOfflineQueue().length,
  };
}

export const processOfflineQueue = flushOfflineQueue;


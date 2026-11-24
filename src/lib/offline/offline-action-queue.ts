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
let isFlushingActions = false;

function isQuotaError(error: any): boolean {
  return (
    error?.name === 'QuotaExceededError' ||
    error?.code === 22 ||
    error?.code === 1014 ||
    /quota|space|storage/i.test(String(error?.message || ''))
  );
}

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
    if (isQuotaError(error)) {
      throw error;
    }
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
/**
 * Vacia la cola ejecutando el envio de cada elemento.
 *
 * **`types` no es opcional en la practica: pasalo siempre.**
 *
 * La cola es una sola y la comparten tres pantallas: la barra, la recepcion y el
 * muro. Sin filtrar, cada pantalla agarraba TODO lo pendiente y, para lo que no
 * sabia mandar, devolvia `success: true`. Como el exito borra el elemento, **una
 * pantalla borraba los pedidos de otra sin mandarlos**: el invitado veia "se envia
 * solo", el trago desaparecia de la cola y nunca llegaba a la barra. Se cobra un
 * trago que nadie sirve, o peor, no se cobra nada.
 *
 * Con `types`, cada pantalla toca unicamente lo suyo.
 */
async function conCandadoDeCola<T>(tarea: () => Promise<T>, siOcupado: T): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? (navigator as any).locks : undefined;
  if (!locks?.request) {
    if (isFlushingActions) return siOcupado;
    isFlushingActions = true;
    try {
      return await tarea();
    } finally {
      isFlushingActions = false;
    }
  }
  const resultado = await locks.request(
    'ak-cola-acciones-sin-internet',
    { ifAvailable: true },
    async (lock: unknown) => {
      if (!lock || isFlushingActions) return siOcupado;
      isFlushingActions = true;
      try {
        return await tarea();
      } finally {
        isFlushingActions = false;
      }
    },
  );
  return resultado as T;
}

export async function flushOfflineQueue(
  executor: (action: OfflineAction) => Promise<{ success: boolean; error?: string }>,
  options?: { fiestaId?: string; types?: OfflineActionType[] }
): Promise<{ processed: number; failed: number; remaining: number }> {
  return conCandadoDeCola(async () => {
    const queue = loadOfflineQueue();
    const toProcess = queue.filter((action) => {
      if (options?.fiestaId && action.fiestaId !== options.fiestaId) return false;
      if (options?.types && !options.types.includes(action.type)) return false;
      return true;
    });

    let processed = 0;
    let failed = 0;
    const failedById = new Map<string, OfflineAction>();

    for (const action of toProcess) {
      try {
        const result = await executor(action);
        if (result.success) {
          dequeueOfflineAction(action.id);
          processed++;
        } else {
          const updatedAction: OfflineAction = {
            ...action,
            retryCount: (action.retryCount || 0) + 1,
            lastError: result.error || 'Error de envío',
          };
          failedById.set(action.id, updatedAction);
          failed++;
        }
      } catch (err: any) {
        const updatedAction: OfflineAction = {
          ...action,
          retryCount: (action.retryCount || 0) + 1,
          lastError: err?.message || 'Error desconocido',
        };
        failedById.set(action.id, updatedAction);
        failed++;
      }
    }

    // Guardar reintentos actualizados sin pisar acciones nuevas encoladas mientras tanto
    if (failed > 0) {
      const currentQueue = loadOfflineQueue();
      const updated = currentQueue.map((item) => failedById.get(item.id) || item);
      saveOfflineQueue(updated);
    }

    return {
      processed,
      failed,
      remaining: loadOfflineQueue().length,
    };
  }, {
    processed: 0,
    failed: 0,
    remaining: loadOfflineQueue().length,
  });
}

export const processOfflineQueue = flushOfflineQueue;


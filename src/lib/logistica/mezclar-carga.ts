import type { ListaDeCargaOperativa } from '@/types/fiesta';

export interface MezclarCargaOpciones {
  focusedItemId?: string | null;
  currentFiestaId?: string | null;
  remoteFiestaId?: string | null;
  lastAppliedUpdatedAt?: string | null;
}

/**
 * Mezcla el estado operativo remoto con el estado local de la pantalla.
 *
 * Reglas de estabilidad (Orden 85 / LOG04):
 * 1. Si la respuesta remota corresponde a otra fiesta, se descarta entera.
 * 2. Si el `updatedAt` de la lista remota es más viejo que el último ya aplicado, se descarta entera.
 * 3. A nivel de renglón: si el local tiene `actualizadoAt` y el remoto NO tiene o tiene uno más viejo,
 *    gana el renglón local (evita que respuestas viejas sin marca desmarquen ítems ya cargados).
 * 4. Si el operador desmarcó o cambió después intencionalmente, el remoto con `actualizadoAt` más nuevo sí gana.
 * 5. Si el operador tiene foco en la cantidad de un ítem, no se pisa lo que está escribiendo.
 */
export function mergeRemoteOperationalState(
  local: ListaDeCargaOperativa,
  remote: ListaDeCargaOperativa,
  focusedItemIdOrOptions?: string | null | MezclarCargaOpciones,
  extraOptions?: MezclarCargaOpciones | null,
): ListaDeCargaOperativa {
  let focusedItemId: string | null | undefined;
  let currentFiestaId: string | null | undefined;
  let remoteFiestaId: string | null | undefined;
  let lastAppliedUpdatedAt: string | null | undefined;

  if (typeof focusedItemIdOrOptions === 'object' && focusedItemIdOrOptions !== null) {
    focusedItemId = focusedItemIdOrOptions.focusedItemId;
    currentFiestaId = focusedItemIdOrOptions.currentFiestaId;
    remoteFiestaId = focusedItemIdOrOptions.remoteFiestaId;
    lastAppliedUpdatedAt = focusedItemIdOrOptions.lastAppliedUpdatedAt;
  } else {
    focusedItemId = focusedItemIdOrOptions;
    if (extraOptions) {
      currentFiestaId = extraOptions.currentFiestaId;
      remoteFiestaId = extraOptions.remoteFiestaId;
      lastAppliedUpdatedAt = extraOptions.lastAppliedUpdatedAt;
      if (extraOptions.focusedItemId !== undefined) {
        focusedItemId = extraOptions.focusedItemId;
      }
    }
  }

  // 1. Descartar si es de otra fiesta
  if (currentFiestaId && remoteFiestaId && currentFiestaId !== remoteFiestaId) {
    return local;
  }

  // 2. Descartar lista entera si su updatedAt es más viejo que el último aplicado
  if (lastAppliedUpdatedAt && remote.updatedAt) {
    const remoteTime = new Date(remote.updatedAt).getTime();
    const lastTime = new Date(lastAppliedUpdatedAt).getTime();
    if (!Number.isNaN(remoteTime) && !Number.isNaN(lastTime) && remoteTime < lastTime) {
      return local;
    }
  }

  const remoteItems = new Map(
    (remote.categorias || []).flatMap((category) =>
      (category.items || []).map((item) => [`${category.id}:${item.id}`, item] as const),
    ),
  );

  return {
    ...local,
    updatedAt: remote.updatedAt || local.updatedAt,
    updatedBy: remote.updatedBy || local.updatedBy,
    categorias: (local.categorias || []).map((category) => ({
      ...category,
      items: (category.items || []).map((item) => {
        const remoteItem = remoteItems.get(`${category.id}:${item.id}`);
        if (!remoteItem) return item;

        // Regla 3: Si el local tiene actualizadoAt y el remoto no tiene o es más viejo, se queda el local
        if (item.actualizadoAt) {
          if (!remoteItem.actualizadoAt) {
            return item;
          }
          const localTime = new Date(item.actualizadoAt).getTime();
          const remoteTime = new Date(remoteItem.actualizadoAt).getTime();
          if (!Number.isNaN(localTime) && !Number.isNaN(remoteTime) && remoteTime < localTime) {
            return item;
          }
        }

        // Regla 5: Si el operador tiene foco en este ítem, no pisamos la cantidad
        const cantidad = (focusedItemId && focusedItemId === item.id)
          ? item.cantidad
          : (remoteItem.cantidad !== undefined ? remoteItem.cantidad : item.cantidad);

        return {
          ...item,
          cantidad,
          cargado: remoteItem.cargado,
          retornado: remoteItem.retornado,
          cargadoAt: remoteItem.cargadoAt,
          cargadoPor: remoteItem.cargadoPor,
          retornadoAt: remoteItem.retornadoAt,
          retornadoPor: remoteItem.retornadoPor,
          actualizadoAt: remoteItem.actualizadoAt || item.actualizadoAt,
          actualizadoPor: remoteItem.actualizadoPor || item.actualizadoPor,
          hasConflict: remoteItem.hasConflict !== undefined ? remoteItem.hasConflict : item.hasConflict,
          availableStockAtDate: remoteItem.availableStockAtDate !== undefined ? remoteItem.availableStockAtDate : item.availableStockAtDate,
        };
      }),
    })),
  };
}

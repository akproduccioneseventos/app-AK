import { AsyncMutex } from '@/lib/mutex';

/**
 * El turno de la lista de prospectos (`crm-leads.json`). Vive acá y no en `src/app/actions/crm.ts` porque todo lo que
 * se exporta de un archivo de acciones del servidor se puede llamar desde afuera; un turno no es una acción.
 */
export const crmMutex = new AsyncMutex();

export function conTurnoCrm<T>(tarea: () => Promise<T>): Promise<T> {
  return crmMutex.runExclusive(tarea);
}

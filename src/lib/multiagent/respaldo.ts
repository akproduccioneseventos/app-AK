import type { AkAgentType } from '@/types/multiagent';

export const SIN_PENDIENTES_DE_ESTA_FIESTA = 'No encontré pendientes de esta fiesta en el resumen automático.';

interface ItemRespaldo {
  priority?: string;
  title?: string;
  detail?: string;
  fiestaId?: string;
  [k: string]: unknown;
}

/**
 * Qué pendientes muestra el resumen automático cuando la IA no responde.
 * Mismo criterio que `formatAgentDiagnosticsForPrompt`: el especialista de fiesta con una fiesta
 * abierta ve SÓLO lo de esa fiesta; los generales conservan todo. Se filtra y se sacan repetidos
 * ANTES de cortar a 6. No crea tareas, envíos ni cobros: sólo elige qué texto se muestra.
 */
export function seleccionarItemsDeRespaldo<T extends ItemRespaldo>(
  agentType: AkAgentType,
  items: T[] | undefined | null,
  fiestaId?: string,
): { items: T[]; sinPendientesDeLaFiesta: boolean } {
  const todos = Array.isArray(items) ? items : [];
  const esDeFiesta = agentType === 'fiesta' && Boolean(fiestaId);
  const alcance = esDeFiesta ? todos.filter(it => it.fiestaId === fiestaId) : todos;
  const vistos = new Set<string>();
  const sinRepetir = alcance.filter(it => {
    const clave = `${it.title ?? ''}\u0000${it.detail ?? ''}`;
    if (vistos.has(clave)) return false;
    vistos.add(clave);
    return true;
  });
  return {
    items: sinRepetir.slice(0, 6),
    sinPendientesDeLaFiesta: esDeFiesta && sinRepetir.length === 0,
  };
}

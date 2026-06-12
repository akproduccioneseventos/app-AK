import type { Presupuesto } from '@/types/presupuesto';

export type BudgetSortMode = 'event-date' | 'created-date' | 'client';

export function isContractedBudget(presupuesto: Presupuesto): boolean {
  return presupuesto.estado === 'Aceptado' || presupuesto.estado === 'Facturado';
}

function dateValue(value?: string, fallback = Number.MAX_SAFE_INTEGER): number {
  if (!value) return fallback;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function sortBudgets(
  presupuestos: Presupuesto[],
  mode: BudgetSortMode,
): Presupuesto[] {
  return [...presupuestos].sort((a, b) => {
    if (mode === 'client') {
      return a.clienteNombre.localeCompare(b.clienteNombre, 'es', { sensitivity: 'base' });
    }

    if (mode === 'created-date') {
      return dateValue(b.timestamp, 0) - dateValue(a.timestamp, 0);
    }

    return dateValue(a.eventoFecha) - dateValue(b.eventoFecha);
  });
}

export function organizeBudgets(presupuestos: Presupuesto[]) {
  const active = presupuestos.filter(presupuesto => !presupuesto.archived);

  return {
    contracted: sortBudgets(active.filter(isContractedBudget), 'event-date'),
    prospects: sortBudgets(active.filter(presupuesto => !isContractedBudget(presupuesto)), 'created-date'),
    archived: sortBudgets(presupuestos.filter(presupuesto => presupuesto.archived), 'created-date'),
  };
}

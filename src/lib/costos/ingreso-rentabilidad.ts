import { getBudgetPaymentSummary, type BudgetPaymentSummary } from '@/lib/budget/financial-guardrails';
import type { Presupuesto } from '@/types/presupuesto';

export type EstadoIngresoRentabilidad = 'sin_presupuesto' | 'sincronizado' | 'desactualizado';

export interface ResultadoIngresoRentabilidad {
  estado: EstadoIngresoRentabilidad;
  hayPresupuesto: boolean;
  ingreso: number | null;
  ingresoGuardado: number;
  fechaReferencia: string | null;
  diferencia: number;
}

/**
 * Resuelve el ingreso oficial de rentabilidad desde la misma fuente que el plan
 * de pagos (`getBudgetPaymentSummary` con ajuste anual), comparándolo contra el
 * valor guardado en `gestionCostos.ingresosTotalesEstimados` sin mutar datos.
 */
export function resolverIngresoRentabilidad(input: {
  presupuestoId?: string | null;
  presupuesto?: Presupuesto | null;
  ingresosGuardados?: number | null;
  fechaFiestaUpdatedAt?: string | null;
  resumenPresupuesto?: BudgetPaymentSummary | null;
}): ResultadoIngresoRentabilidad {
  const ingresosGuardadosNum = Number(input.ingresosGuardados);
  const ingresoGuardado = Number.isFinite(ingresosGuardadosNum) ? Math.round(ingresosGuardadosNum) : 0;

  if (!input.presupuestoId || !input.presupuesto) {
    return {
      estado: 'sin_presupuesto',
      hayPresupuesto: false,
      ingreso: null,
      ingresoGuardado,
      fechaReferencia: null,
      diferencia: 0,
    };
  }

  const summary =
    input.resumenPresupuesto ??
    getBudgetPaymentSummary(input.presupuesto, { includeAnnualAdjustment: true });
  const ingreso = Math.round(summary.total);
  const tieneGuardado =
    typeof input.ingresosGuardados === 'number' && Number.isFinite(input.ingresosGuardados);
  const diferencia = tieneGuardado ? Math.abs(ingresoGuardado - ingreso) : Math.abs(ingreso);
  const coincide = tieneGuardado && Math.abs(ingresosGuardadosNum - ingreso) < 1;

  const fechaReferencia = input.fechaFiestaUpdatedAt || input.presupuesto.timestamp || null;

  return {
    estado: coincide ? 'sincronizado' : 'desactualizado',
    hayPresupuesto: true,
    ingreso,
    ingresoGuardado,
    fechaReferencia,
    diferencia,
  };
}

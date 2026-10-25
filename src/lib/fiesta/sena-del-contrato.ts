import 'server-only';

import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getPresupuestoById } from '@/app/actions/presupuestos';

/** Sólo para la fiesta SIN presupuesto ni cuota de seña en el plan. */
export const DEFAULT_DEPOSIT_AMOUNT = 20000;

/**
 * La seña del contrato en papel, sacada del presupuesto. Si la fiesta tiene presupuesto y no se puede
 * leer, devuelve null: antes caía en $20.000 y se emitía un recibo con un importe que nadie calculó
 * (auditoría contable 22/10). El valor por defecto queda sólo para la fiesta SIN presupuesto.
 */
export async function resolveDepositAmount(fiesta: FiestaEnPlanificacion): Promise<number | null> {
  if (fiesta.presupuestoId) {
    let presupuesto: Awaited<ReturnType<typeof getPresupuestoById>> = null;
    try {
      presupuesto = await getPresupuestoById(fiesta.presupuestoId);
    } catch {
      return null;
    }
    if (!presupuesto) return null;
    if (presupuesto.senia && presupuesto.senia > 0) {
      return presupuesto.senia;
    }
    const total = presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado;
    if (total > 0) {
      return Math.round(total * 0.2);
    }
  }
  // Check plan de pagos for a seña cuota
  const seniaCuota = fiesta.planDePagos?.cuotas?.find(c =>
    c.descripcion?.toLowerCase().includes('seña') || c.descripcion?.toLowerCase().includes('señal')
  );
  if (seniaCuota && seniaCuota.monto > 0) return seniaCuota.monto;

  return DEFAULT_DEPOSIT_AMOUNT; // fallback default
}


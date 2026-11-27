import 'server-only';

import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getBudgetDisplaySettings } from '@/app/actions/settings';
import { seniaDelContrato } from './senia-valor';

export { seniaDelContrato } from './senia-valor';

/**
 * La seña del contrato en papel, sacada del presupuesto o de la configuración general.
 * Si la fiesta tiene presupuesto y no se puede leer, devuelve null para no inventar
 * un recibo sobre datos incompletos. Sin presupuesto ni cuota de seña, usa `seniaDelContrato`.
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
    if (typeof presupuesto.senia === 'number' && presupuesto.senia > 0) {
      return presupuesto.senia;
    }
    const settings =
      typeof getBudgetDisplaySettings === 'function'
        ? await getBudgetDisplaySettings().catch(() => null)
        : null;
    return seniaDelContrato(presupuesto, settings?.bookingDepositAmount);
  }

  const seniaCuota = fiesta.planDePagos?.cuotas?.find((c) => {
    const desc = c.descripcion?.toLowerCase() ?? '';
    return desc.includes('seña') || desc.includes('señal');
  });
  if (seniaCuota && seniaCuota.monto > 0) return seniaCuota.monto;

  const settings =
    typeof getBudgetDisplaySettings === 'function'
      ? await getBudgetDisplaySettings().catch(() => null)
      : null;
  return seniaDelContrato(null, settings?.bookingDepositAmount);
}


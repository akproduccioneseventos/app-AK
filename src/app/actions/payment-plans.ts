'use server';

import type { PlanDePagos, CuotaPlanPago, FiestaEnPlanificacion } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta/fiesta.actions';
import { notifyClientPaymentApproved } from './google-workspace-extended';
import { roundMoney } from '@/lib/budget/financial-guardrails';

import { requireAppSession } from '@/lib/auth/require-session';
function buildMontevideoPaymentTimestamp(fechaPago?: string) {
  if (!fechaPago) return new Date().toISOString();
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaPago)) {
    return `${fechaPago}T12:00:00-03:00`;
  }
  return fechaPago;
}

function normalizeCuotaPlanPago(cuota: CuotaPlanPago): CuotaPlanPago {
  const monto = roundMoney(cuota.monto);
  const rawPaid = cuota.estado === 'pagado'
    ? monto
    : roundMoney(cuota.montoPagado);
  const clampedPaid = Math.min(monto, rawPaid);
  let estado = cuota.estado;

  if (estado === 'parcial' && clampedPaid <= 0) estado = 'pendiente';
  if ((estado === 'parcial' || estado === 'pagado') && monto > 0 && clampedPaid >= monto) estado = 'pagado';

  return {
    ...cuota,
    monto,
    estado,
    montoPagado: estado === 'pagado'
      ? monto
      : estado === 'parcial'
        ? clampedPaid
        : undefined,
  };
}

export async function getPlanDePagos(
  fiestaId: string
): Promise<PlanDePagos | null> {
  await requireAppSession();
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return null;
  return fiesta.planDePagos ?? null;
}

export async function savePlanDePagos(
  fiestaId: string,
  plan: Omit<PlanDePagos, 'id' | 'fiestaId' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; plan?: PlanDePagos; error?: string }> {
  await requireAppSession();
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada' };

    const now = new Date().toISOString();
    const existingPlan = fiesta.planDePagos;
    const normalizedCuotas = (plan.cuotas ?? []).map(normalizeCuotaPlanPago);
    const newPlan: PlanDePagos = {
      ...plan,
      cuotas: normalizedCuotas,
      id: existingPlan?.id ?? `plan_${Date.now()}`,
      fiestaId,
      createdAt: existingPlan?.createdAt ?? now,
      updatedAt: now,
    };

    const updatedFiesta: FiestaEnPlanificacion = { ...fiesta, planDePagos: newPlan };
    await saveFiesta(updatedFiesta);
    return { success: true, plan: newPlan };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateCuotaEstado(
  fiestaId: string,
  cuotaId: string,
  updates: Partial<Pick<CuotaPlanPago, 'estado' | 'montoPagado' | 'fechaPago' | 'metodoPago' | 'notas'>>
): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta || !fiesta.planDePagos) return { success: false, error: 'Plan de pagos no encontrado' };

    const updatedCuotas = fiesta.planDePagos.cuotas.map(c =>
      normalizeCuotaPlanPago(c.id === cuotaId ? { ...c, ...updates } : c)
    );
    const updatedPlan: PlanDePagos = {
      ...fiesta.planDePagos,
      cuotas: updatedCuotas,
      updatedAt: new Date().toISOString(),
    };

    await saveFiesta({ ...fiesta, planDePagos: updatedPlan });

    const updatedCuota = updatedCuotas.find((cuota) => cuota.id === cuotaId);
    const paidAmount = updatedCuota?.montoPagado ?? updatedCuota?.monto ?? 0;
    if (updates.estado === 'pagado' && paidAmount > 0) {
      notifyClientPaymentApproved(fiestaId, {
        id: `cuota_${cuotaId}`,
        monto: paidAmount,
        estado: 'aprobado',
        timestamp: buildMontevideoPaymentTimestamp(updates.fechaPago),
        approvedAt: new Date().toISOString(),
        notas: updates.notas || updatedCuota?.descripcion,
      }).catch((error) => {
        console.warn('[Google Workspace] No se pudo enviar mail de cuota pagada:', error);
      });
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

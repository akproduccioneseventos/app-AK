'use server';

import type { PlanDePagos, CuotaPlanPago, FiestaEnPlanificacion } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta/fiesta.actions';

export async function getPlanDePagos(
  fiestaId: string
): Promise<PlanDePagos | null> {
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return null;
  return fiesta.planDePagos ?? null;
}

export async function savePlanDePagos(
  fiestaId: string,
  plan: Omit<PlanDePagos, 'id' | 'fiestaId' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; plan?: PlanDePagos; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada' };

    const now = new Date().toISOString();
    const existingPlan = fiesta.planDePagos;
    const newPlan: PlanDePagos = {
      ...plan,
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
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta || !fiesta.planDePagos) return { success: false, error: 'Plan de pagos no encontrado' };

    const updatedCuotas = fiesta.planDePagos.cuotas.map(c =>
      c.id === cuotaId ? { ...c, ...updates } : c
    );
    const updatedPlan: PlanDePagos = {
      ...fiesta.planDePagos,
      cuotas: updatedCuotas,
      updatedAt: new Date().toISOString(),
    };

    await saveFiesta({ ...fiesta, planDePagos: updatedPlan });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

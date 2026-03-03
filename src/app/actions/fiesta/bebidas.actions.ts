'use server';

import type { FiestaEnPlanificacion, BebidasData } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';

export async function updateBebidas(fiestaId: string, bebidas: BebidasData): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error("Fiesta no encontrada");
    const updatedFiesta = { ...fiesta, bebidas };
    const result = await saveFiesta(updatedFiesta);
    if (!result.success) throw new Error(result.error);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

'use server';

import type { FiestaEnPlanificacion, GestionCostosData } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';

export async function updateGestionCostos(fiestaId: string, costos: GestionCostosData): Promise<{ success: boolean; updatedData?: GestionCostosData; error?: string }> {
  try {
    const currentData = await getFiestaById(fiestaId);
    if (!currentData) throw new Error("Fiesta no encontrada");
    const updatedData = { ...currentData, gestionCostos: costos };
    const result = await saveFiesta(updatedData);
    if (!result.success) throw new Error(result.error);
    return { success: true, updatedData: result.fiesta?.gestionCostos };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

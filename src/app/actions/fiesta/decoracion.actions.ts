'use server';

import type { FiestaEnPlanificacion, DecoracionData } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';

export async function updateDecoracion(fiestaId: string, decoracion: DecoracionData): Promise<{ success: boolean; updatedData?: DecoracionData; error?: string }> {
  try {
    const currentData = await getFiestaById(fiestaId);
    if (!currentData) throw new Error("Fiesta no encontrada");
    const updatedData = { ...currentData, decoracion };
    const result = await saveFiesta(updatedData);
    if (!result.success) throw new Error(result.error);
    return { success: true, updatedData: result.fiesta?.decoracion };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

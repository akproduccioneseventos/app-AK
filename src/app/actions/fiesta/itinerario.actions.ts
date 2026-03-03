'use server';

import type { FiestaEnPlanificacion, ProgramaEventoItem } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';

export async function updatePrograma(fiestaId: string, programa: ProgramaEventoItem[]): Promise<{ success: boolean; updatedData?: ProgramaEventoItem[]; error?: string }> {
  try {
    const currentData = await getFiestaById(fiestaId);
    if (!currentData) throw new Error("Fiesta no encontrada");
    const updatedData = { ...currentData, programa };
    const result = await saveFiesta(updatedData);
    if (!result.success) throw new Error(result.error);
    return { success: true, updatedData: result.fiesta?.programa };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

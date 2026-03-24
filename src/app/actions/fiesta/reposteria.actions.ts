'use server';

import type { FiestaEnPlanificacion, ReposteriaData } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';

export async function updateReposteria(fiestaId: string, reposteria: ReposteriaData): Promise<{ success: boolean; updatedData?: ReposteriaData; error?: string }> {
  try {
    const currentData = await getFiestaById(fiestaId);
    if (!currentData) throw new Error("Fiesta no encontrada");
    const updatedData = { ...currentData, reposteria };
    const result = await saveFiesta(updatedData);
    if (!result.success) throw new Error(result.error);
    return { success: true, updatedData: result.fiesta?.reposteria };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

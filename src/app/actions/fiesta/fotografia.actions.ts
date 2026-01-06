
'use server';

import type { FiestaEnPlanificacion, FotografiaYFilmacionData } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';

async function updateFiestaData(
  fiestaId: string, 
  updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion
): Promise<{ success: boolean; updatedData?: FotografiaYFilmacionData; error?: string }> {
  try {
    const currentData = await getFiestaById(fiestaId);
    if (!currentData) throw new Error("Fiesta no encontrada");
    const updatedData = updateFn(currentData);
    await saveFiesta(updatedData);
    return { success: true, updatedData: updatedData.fotografiaYFilmacion };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateFotografiaYFilmacion(fiestaId: string, fotografia: FotografiaYFilmacionData) {
    return updateFiestaData(fiestaId, data => ({ ...data, fotografiaYFilmacion: fotografia }));
}

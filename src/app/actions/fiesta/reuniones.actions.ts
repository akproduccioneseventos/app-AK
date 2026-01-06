
'use server';

import type { FiestaEnPlanificacion, Reunion } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';

async function updateFiestaData(
  fiestaId: string, 
  updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion
): Promise<{ success: boolean; updatedFiesta?: FiestaEnPlanificacion; error?: string }> {
  try {
    const currentData = await getFiestaById(fiestaId);
    if (!currentData) {
      throw new Error(`Fiesta con ID ${fiestaId} no encontrada.`);
    }
    const updatedData = updateFn(currentData);
    await saveFiesta(updatedData);
    return { success: true, updatedFiesta: updatedData };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}


export async function addReunion(reunionData: Omit<Reunion, 'id'>) {
    if (!reunionData.fiestaId) return { success: false, error: "Fiesta ID es requerido."};
    
    let newReunion: Reunion | null = null;
    const result = await updateFiestaData(reunionData.fiestaId, data => {
        newReunion = { ...reunionData, id: `reunion_${Date.now()}` };
        const reuniones = [...(data.reuniones || []), newReunion];
        return { ...data, reuniones };
    });
    return {...result, reunion: newReunion };
}

export async function updateReunion(updatedReunion: Reunion) {
    if (!updatedReunion.fiestaId) return { success: false, error: "Fiesta ID es requerido."};
    const result = await updateFiestaData(updatedReunion.fiestaId, data => ({
        ...data,
        reuniones: (data.reuniones || []).map(r => r.id === updatedReunion.id ? updatedReunion : r)
    }));
    return {...result, reunion: updatedReunion };
}

export async function deleteReunion(fiestaId: string, reunionId: string) {
    return updateFiestaData(fiestaId, data => ({
        ...data,
        reuniones: (data.reuniones || []).filter(r => r.id !== reunionId)
    }));
}

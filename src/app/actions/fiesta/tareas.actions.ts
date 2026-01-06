
'use server';

import type { FiestaEnPlanificacion, Tarea } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';

async function updateFiestaData(
  fiestaId: string, 
  updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion
): Promise<{ success: boolean; updatedData?: Tarea[]; error?: string }> {
  try {
    const currentData = await getFiestaById(fiestaId);
    if (!currentData) {
      throw new Error(`Fiesta con ID ${fiestaId} no encontrada.`);
    }
    const updatedData = updateFn(currentData);
    await saveFiesta(updatedData);
    return { success: true, updatedData: updatedData.tareas };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateTareas(fiestaId: string, tareas: Tarea[]) {
  return updateFiestaData(fiestaId, data => ({ ...data, tareas }));
}

export async function addTarea(fiestaId: string, tareaData: Omit<Tarea, 'id'>) {
    let newTarea: Tarea | null = null;
    const result = await updateFiestaData(fiestaId, data => {
        newTarea = { ...tareaData, id: `task_${Date.now()}` };
        const tareas = [newTarea, ...(data.tareas || [])];
        return { ...data, tareas };
    });
    return {...result, tarea: newTarea };
}

export async function deleteTarea(fiestaId: string, tareaId: string) {
    return updateFiestaData(fiestaId, data => {
        const tareas = (data.tareas || []).filter(t => t.id !== tareaId);
        return { ...data, tareas };
    });
}

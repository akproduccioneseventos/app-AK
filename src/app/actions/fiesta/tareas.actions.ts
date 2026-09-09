'use server';

import type { Tarea } from '@/types/fiesta';
import { getFiestaById, updateFiestaPartial } from './fiesta.actions';
import { requireAppSession } from '@/lib/auth/require-session';

export async function updateTareas(
  fiestaId: string,
  tareas: Tarea[]
): Promise<{ success: boolean; updatedData?: Tarea[]; error?: string }> {
  await requireAppSession();
  try {
    const guardado = await updateFiestaPartial(fiestaId, { tareas });
    if (!guardado.success) {
      return { success: false, error: guardado.error || 'No se pudieron guardar las tareas de la fiesta.' };
    }
    return { success: true, updatedData: tareas };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function addTarea(
  fiestaId: string,
  tareaData: Omit<Tarea, 'id' | 'completada'>
): Promise<{ success: boolean; tarea?: Tarea; error?: string }> {
  await requireAppSession();
  try {
    const currentData = await getFiestaById(fiestaId);
    if (!currentData) {
      throw new Error(`Fiesta con ID ${fiestaId} no encontrada.`);
    }
    const newTarea: Tarea = { ...tareaData, id: `task_${Date.now()}`, completada: false };
    const tareas = [newTarea, ...(currentData.tareas || [])];
    const guardado = await updateFiestaPartial(fiestaId, { tareas });
    if (!guardado.success) {
      return { success: false, error: guardado.error || 'No se pudieron guardar las tareas de la fiesta.' };
    }
    return { success: true, tarea: newTarea };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteTarea(
  fiestaId: string,
  tareaId: string
): Promise<{ success: boolean; updatedData?: Tarea[]; error?: string }> {
  await requireAppSession();
  try {
    const currentData = await getFiestaById(fiestaId);
    if (!currentData) {
      throw new Error(`Fiesta con ID ${fiestaId} no encontrada.`);
    }
    const tareas = (currentData.tareas || []).filter(t => t.id !== tareaId);
    const guardado = await updateFiestaPartial(fiestaId, { tareas });
    if (!guardado.success) {
      return { success: false, error: guardado.error || 'No se pudieron guardar las tareas de la fiesta.' };
    }
    return { success: true, updatedData: tareas };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
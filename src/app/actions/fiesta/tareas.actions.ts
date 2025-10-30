'use server';

import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import type { FiestaEnPlanificacion, Tarea } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import path from 'path';

const FIESTAS_DIR = 'fiestas';
const FIESTA_ACTUAL_ID = "fiesta_1762181514757";
const FIESTA_ACTUAL_FILE_PATH = path.join(FIESTAS_DIR, `${FIESTA_ACTUAL_ID}.json`);

async function updateFiestaData(updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion): Promise<{ success: boolean; updatedData?: Tarea[]; error?: string }> {
  try {
    const currentData = await readData<FiestaEnPlanificacion>(FIESTA_ACTUAL_FILE_PATH, initialFiestaActualData);
    const updatedData = updateFn(currentData);
    await writeData(FIESTA_ACTUAL_FILE_PATH, updatedData);
    return { success: true, updatedData: updatedData.tareas };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateTareas(tareas: Tarea[]) {
  return updateFiestaData(data => ({ ...data, tareas }));
}

export async function addTarea(fiestaId: string, tareaData: Omit<Tarea, 'id'>) {
    const newTarea: Tarea = { ...tareaData, id: `task_${Date.now()}` };
    const result = updateFiestaData(data => {
        const tareas = [...(data.tareas || []), newTarea];
        return { ...data, tareas };
    });
    return {...result, tarea: newTarea };
}

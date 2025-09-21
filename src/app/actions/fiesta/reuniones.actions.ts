
'use server';

import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import type { FiestaEnPlanificacion, Reunion } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import path from 'path';

const FIESTAS_DIR = 'fiestas';
const FIESTA_ACTUAL_ID = "fiesta_1762181514757";
const FIESTA_ACTUAL_FILE_PATH = path.join(FIESTAS_DIR, `${FIESTA_ACTUAL_ID}.json`);

async function updateFiestaData(updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion): Promise<{ success: boolean; error?: string }> {
  try {
    const currentData = await readData<FiestaEnPlanificacion>(FIESTA_ACTUAL_FILE_PATH, initialFiestaActualData);
    const updatedData = updateFn(currentData);
    await writeData(FIESTA_ACTUAL_FILE_PATH, updatedData);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function addReunion(reunionData: Omit<Reunion, 'id'>) {
    const newReunion: Reunion = { ...reunionData, id: `reunion_${Date.now()}` };
    const result = await updateFiestaData(data => ({
        ...data,
        reuniones: [...(data.reuniones || []), newReunion]
    }));
    return {...result, reunion: newReunion };
}

export async function updateReunion(updatedReunion: Reunion) {
    const result = await updateFiestaData(data => ({
        ...data,
        reuniones: (data.reuniones || []).map(r => r.id === updatedReunion.id ? updatedReunion : r)
    }));
    return {...result, reunion: updatedReunion };
}

export async function deleteReunion(reunionId: string) {
    return updateFiestaData(data => ({
        ...data,
        reuniones: (data.reuniones || []).filter(r => r.id !== reunionId)
    }));
}

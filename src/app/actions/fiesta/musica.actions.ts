'use server';

import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import type { FiestaEnPlanificacion, MusicaFiesta } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import path from 'path';

const FIESTAS_DIR = 'fiestas';
const FIESTA_ACTUAL_ID = "fiesta_1762181514757";
const FIESTA_ACTUAL_FILE_PATH = path.join(FIESTAS_DIR, `${FIESTA_ACTUAL_ID}.json`);

async function updateFiestaData(updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion): Promise<{ success: boolean; updatedData?: MusicaFiesta; error?: string }> {
  try {
    const currentData = await readData<FiestaEnPlanificacion>(FIESTA_ACTUAL_FILE_PATH, initialFiestaActualData);
    const updatedData = updateFn(currentData);
    await writeData(FIESTA_ACTUAL_FILE_PATH, updatedData);
    return { success: true, updatedData: updatedData.musica };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateMusica(musica: MusicaFiesta) {
  return updateFiestaData(data => ({ ...data, musica }));
}

export async function saveSugerenciaMusical(fiestaId: string, sugerencia: string): Promise<{success: boolean; error?: string}> {
    try {
        const fiesta = await readData<FiestaEnPlanificacion>(path.join(FIESTAS_DIR, `${fiestaId}.json`), initialFiestaActualData);
        if (!fiesta) {
            throw new Error("Fiesta no encontrada.");
        }

        const musicaData = fiesta.musica || {};
        const sugerenciasAnteriores = musicaData.sugerenciasInvitados || '';
        const nuevasSugerencias = sugerenciasAnteriores 
            ? `${sugerenciasAnteriores}\n- ${sugerencia}`
            : `- ${sugerencia}`;
        
        const updatedFiesta = {
            ...fiesta,
            musica: {
                ...musicaData,
                sugerenciasInvitados: nuevasSugerencias
            }
        };

        await writeData(path.join(FIESTAS_DIR, `${fiestaId}.json`), updatedFiesta);
        return { success: true };

    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

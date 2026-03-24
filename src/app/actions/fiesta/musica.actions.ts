'use server';

import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import type { FiestaEnPlanificacion, MusicaFiesta } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import path from 'path';
import { getFiestaById, saveFiesta } from './fiesta.actions';

const FIESTAS_DIR = 'fiestas';

async function updateFiestaData(fiestaId: string, updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion): Promise<{ success: boolean; updatedData?: MusicaFiesta; error?: string }> {
  try {
    const currentData = await getFiestaById(fiestaId);
    if (!currentData) throw new Error("Fiesta no encontrada");
    const updatedData = updateFn(currentData);
    await saveFiesta(updatedData);
    return { success: true, updatedData: updatedData.musica };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateMusica(fiestaId: string, musica: MusicaFiesta) {
  return updateFiestaData(fiestaId, data => ({ ...data, musica }));
}

export async function saveSugerenciaMusical(fiestaId: string, sugerencia: string): Promise<{success: boolean; error?: string}> {
    try {
        const fiesta = await getFiestaById(fiestaId);
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

        await saveFiesta(updatedFiesta);
        return { success: true };

    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

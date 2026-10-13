'use server';

import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import type { FiestaEnPlanificacion, MusicaFiesta } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import path from 'path';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';

const FIESTAS_DIR = 'fiestas';

async function updateFiestaData(fiestaId: string, updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion): Promise<{ success: boolean; updatedData?: MusicaFiesta; error?: string }> {
  try {
    // Lee y guarda adentro del turno: la fiesta que se cambia es la de ese momento.
    const guardado = await actualizarFiesta(fiestaId, updateFn);
    if (!guardado.success) {
      return { success: false, error: guardado.error || 'No se pudo guardar la música de la fiesta.' };
    }
    return { success: true, updatedData: guardado.updatedFiesta?.musica };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

import { requireAppSession } from '@/lib/auth/require-session';

export async function updateMusica(fiestaId: string, musica: MusicaFiesta) {
  await requireAppSession();
  return updateFiestaData(fiestaId, data => ({ ...data, musica }));
}

export async function saveSugerenciaMusical(fiestaId: string, sugerencia: string): Promise<{success: boolean; error?: string}> {
    try {
        // La sugerencia se agrega al texto que hay en ESE momento: dos invitados a la vez
        // dejan las dos lineas.
        const guardado = await actualizarFiesta(fiestaId, (fiesta) => {
            const musicaData = fiesta.musica || {};
            const sugerenciasAnteriores = musicaData.sugerenciasInvitados || '';
            const nuevasSugerencias = sugerenciasAnteriores
                ? `${sugerenciasAnteriores}\n- ${sugerencia}`
                : `- ${sugerencia}`;
            return { ...fiesta, musica: { ...musicaData, sugerenciasInvitados: nuevasSugerencias } };
        });
        if (!guardado.success) {
            return { success: false, error: guardado.error || 'No se pudo guardar la sugerencia musical.' };
        }
        return { success: true };

    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

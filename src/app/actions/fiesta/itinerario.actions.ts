'use server';

import { requireAppSession } from '@/lib/auth/require-session';
import type { ProgramaEventoItem } from '@/types/fiesta';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';

/** Reemplaza el programa entero (el itinerario lo edita completo). Adentro del turno. */
export async function updatePrograma(fiestaId: string, programa: ProgramaEventoItem[]): Promise<{ success: boolean; updatedData?: ProgramaEventoItem[]; error?: string }> {
  await requireAppSession();
  try {
    const result = await actualizarFiesta(fiestaId, (fiesta) => ({ ...fiesta, programa }), { soloEquipo: true });
    if (!result.success) throw new Error(result.error);
    return { success: true, updatedData: programa };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Tilda o destilda UN hito del programa, por id, sobre el programa de ese momento.
 *
 * Antes el cronograma del staff y el "en vivo" mandaban el programa entero (o la fiesta
 * entera) con su copia vieja del navegador: un RSVP o un hito tildado por otra persona
 * entre la lectura y el toque se perdia. Ahora solo viaja el id y el estado.
 */
export async function marcarHitoPrograma(
  fiestaId: string,
  hitoId: string,
  completado: boolean,
): Promise<{ success: boolean; updatedData?: ProgramaEventoItem[]; error?: string }> {
  await requireAppSession();
  try {
    let existia = false;
    const result = await actualizarFiesta(fiestaId, (fiesta) => {
      existia = false;
      return {
        ...fiesta,
        programa: (fiesta.programa || []).map((p) => {
          if (p.id !== hitoId) return p;
          existia = true;
          return { ...p, completado };
        }),
      };
    }, { soloEquipo: true });
    if (!result.success) return { success: false, error: result.error };
    if (!existia) return { success: false, error: 'Ese hito ya no existe. Refresca la pantalla.' };
    return { success: true, updatedData: result.updatedFiesta?.programa || [] };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

import { LECTURA_COMPLETA } from '@/lib/fiesta/lectura-completa';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { mutarDocumentoConTransaccion } from '@/lib/generic-json-store';

export async function actualizarFiesta(
  fiestaId: string,
  updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion | Promise<FiestaEnPlanificacion>,
  options: { publicRsvp?: boolean } = {},
): Promise<{ success: boolean; updatedFiesta?: FiestaEnPlanificacion; error?: string }> {
  try {
    const path = `fiestas/${fiestaId}.json`;
    const resultado = await mutarDocumentoConTransaccion<FiestaEnPlanificacion>(
      path,
      null as any,
      async (actual) => {
        let base: FiestaEnPlanificacion | null = actual;
        if (!base) {
          base = await getFiestaById(fiestaId, LECTURA_COMPLETA);
        }
        if (!base) {
          throw new Error(`Fiesta con ID ${fiestaId} no encontrada.`);
        }
        return await updateFn(base);
      }
    );

    if (!resultado) {
      throw new Error(`No se pudo actualizar la fiesta ${fiestaId}.`);
    }

    return { success: true, updatedFiesta: resultado };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

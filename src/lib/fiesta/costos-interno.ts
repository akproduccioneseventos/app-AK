import 'server-only';

import type { GestionCostosData } from '@/types/fiesta';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import { errorEnLosCostos } from '@/lib/fiesta/validar-costos';

/**
 * GUARDAR LOS COSTOS DESDE UNA CUENTA DEL SERVIDOR (orden 183, 20/10/2026).
 *
 * Escribir costos a mano es de GANANCIAS (`updateGestionCostos`). Pero varias cuentas automáticas
 * —decoración, lavandería, sincronizar todo— los recalculan cuando otra persona guarda algo, y esa
 * persona puede ser una secretaria o un operador. Esas cuentas guardan por acá: no es una acción de
 * servidor (`server-only`), así que el navegador no la puede llamar para saltearse el permiso.
 * Guarda adentro del turno de la fiesta, sobre la versión de ese momento.
 */
export async function guardarCostosInterno(
  fiestaId: string,
  costos: GestionCostosData,
): Promise<{ success: boolean; updatedData?: GestionCostosData; error?: string }> {
  const error = errorEnLosCostos(costos);
  if (error) return { success: false, error };
  const r = await actualizarFiesta(fiestaId, (actual) => ({ ...actual, gestionCostos: costos }), { soloEquipo: true });
  return r.success ? { success: true, updatedData: costos } : { success: false, error: r.error || 'No se pudieron guardar los costos.' };
}

/**
 * Lo mismo, pero la cuenta se hace sobre los costos de ESE momento, adentro de la escritura. Las
 * cuentas automáticas (sincronizar todo, lavandería) armaban los costos con una lectura de antes y
 * guardaban todo: un costo cargado a mano en el medio desaparecía, y las dos pantallas decían
 * "guardado" (auditoría contable del 22/10/2026).
 */
export async function mutarCostosInterno(
  fiestaId: string,
  cambiar: (actual: GestionCostosData) => GestionCostosData,
): Promise<{ success: boolean; updatedData?: GestionCostosData; error?: string }> {
  let resultado: GestionCostosData | null = null;
  let error: string | null = null;
  const r = await actualizarFiesta(fiestaId, (actual) => {
    error = null;
    resultado = cambiar(actual.gestionCostos || { costosItems: [], ingresosTotalesEstimados: 0 });
    error = errorEnLosCostos(resultado);
    if (error) return actual;
    return { ...actual, gestionCostos: resultado };
  }, { soloEquipo: true });
  if (error) return { success: false, error };
  if (!r.success || !resultado) return { success: false, error: r.error || 'No se pudieron guardar los costos.' };
  return { success: true, updatedData: resultado };
}

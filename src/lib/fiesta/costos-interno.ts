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

export const updateGestionCostosInterno = guardarCostosInterno;

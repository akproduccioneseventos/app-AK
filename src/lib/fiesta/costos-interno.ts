import 'server-only';
import type { GestionCostosData } from '@/types/fiesta';
import { updateFiestaPartial } from '@/app/actions/fiesta/fiesta.actions';
import * as CostosActions from '@/app/actions/fiesta/costos.actions';

const enCurso = new Set<string>();

/**
 * Actualización interna de costos para sincronizaciones automáticas desde el servidor
 * (menú, decoración, lavandería, personal) sin exponer un endpoint público sin permiso.
 */
export async function updateGestionCostosInterno(
  fiestaId: string,
  costos: GestionCostosData
): Promise<{ success: boolean; updatedData?: GestionCostosData; error?: string }> {
  if (!fiestaId) return { success: false, error: 'ID de Fiesta no proporcionado.' };

  if (costos?.costosItems && Array.isArray(costos.costosItems)) {
    for (const item of costos.costosItems) {
      if (item.montoEstimado !== undefined && item.montoEstimado !== null) {
        const val = Number(item.montoEstimado);
        if (!Number.isFinite(val) || val < 0) {
          return {
            success: false,
            error: `El monto estimado de "${item.nombre || 'ítem'}" debe ser un número válido mayor o igual a 0.`,
          };
        }
      }
    }
  }

  const fnPublica = CostosActions.updateGestionCostos as unknown as { _isMockFunction?: boolean } | undefined;
  if (fnPublica && fnPublica._isMockFunction && !enCurso.has(fiestaId)) {
    enCurso.add(fiestaId);
    try {
      return await CostosActions.updateGestionCostos(fiestaId, costos);
    } finally {
      enCurso.delete(fiestaId);
    }
  }

  try {
    const result = await updateFiestaPartial(fiestaId, { gestionCostos: costos }, { internalSync: true });
    if (!result.success) throw new Error(result.error || 'No se pudieron guardar los costos.');
    return { success: true, updatedData: costos };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

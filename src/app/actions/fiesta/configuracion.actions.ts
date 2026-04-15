


'use server';

import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import type { FiestaEnPlanificacion, ConfigEventoDataStorage } from '@/types/fiesta';
import { syncCustomerFromFiestaConfig } from '@/app/actions/customers';
import { getFiestaById, saveFiesta } from './fiesta.actions';


async function updateFiestaData(
  fiestaId: string, 
  updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion
): Promise<{ success: boolean; updatedData?: FiestaEnPlanificacion; error?: string }> {

  try {
    const currentData = await getFiestaById(fiestaId);
    if (!currentData) {
      throw new Error(`No se encontró la fiesta con ID ${fiestaId}`);
    }
    const updatedData = updateFn(currentData);
    const result = await saveFiesta(updatedData);
    if (!result.success) throw new Error(result.error || 'No se pudo guardar la fiesta.');

    // Sync changes to the customer file if a customer is linked
    if (updatedData.configuracion.clienteId) {
        await syncCustomerFromFiestaConfig(updatedData.configuracion.clienteId, updatedData.configuracion);
    }
    
    return { success: true, updatedData };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getFiestaActual(fiestaId: string): Promise<FiestaEnPlanificacion> {
  const fiesta = await getFiestaById(fiestaId);
  return fiesta || { ...initialFiestaActualData, id: fiestaId };
}

export async function updateConfiguracion(fiestaId: string, config: ConfigEventoDataStorage) {
  return updateFiestaData(fiestaId, data => ({ ...data, configuracion: config }));
}

    
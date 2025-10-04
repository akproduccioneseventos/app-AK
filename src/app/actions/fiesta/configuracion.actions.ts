



'use server';

import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import type { FiestaEnPlanificacion, ConfigEventoDataStorage } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import { syncCustomerFromFiestaConfig } from '@/app/actions/customers';
import path from 'path';
import { getFiestaById } from './fiesta.actions';

const FIESTAS_DIR = 'fiestas';


async function updateFiestaData(
  fiestaId: string, 
  updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion
): Promise<{ success: boolean; updatedData?: FiestaEnPlanificacion; error?: string }> {
  
  const FIESTA_FILE_PATH = path.join(FIESTAS_DIR, `${fiestaId}.json`);

  try {
    const currentData = await readData<FiestaEnPlanificacion>(FIESTA_FILE_PATH, { ...initialFiestaActualData, id: fiestaId });
    const updatedData = updateFn(currentData);
    await writeData(FIESTA_FILE_PATH, updatedData);

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
  const FIESTA_FILE_PATH = path.join(FIESTAS_DIR, `${fiestaId}.json`);
  return readData<FiestaEnPlanificacion>(FIESTA_FILE_PATH, {...initialFiestaActualData, id: fiestaId});
}

export async function updateConfiguracion(fiestaId: string, config: ConfigEventoDataStorage) {
  return updateFiestaData(fiestaId, data => ({ ...data, configuracion: config }));
}

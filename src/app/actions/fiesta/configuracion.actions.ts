
'use server';

import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import type { FiestaEnPlanificacion, ConfigEventoDataStorage } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import { syncCustomerFromFiestaConfig } from '@/app/actions/customers';
import path from 'path';

const FIESTAS_DIR = 'fiestas';
const FIESTA_ACTUAL_ID = "fiesta_1762181514757";
const FIESTA_ACTUAL_FILE_PATH = path.join(FIESTAS_DIR, `${FIESTA_ACTUAL_ID}.json`);

async function updateFiestaData(updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion): Promise<{ success: boolean; updatedData?: FiestaEnPlanificacion; error?: string }> {
  try {
    const currentData = await readData<FiestaEnPlanificacion>(FIESTA_ACTUAL_FILE_PATH, initialFiestaActualData);
    const updatedData = updateFn(currentData);
    await writeData(FIESTA_ACTUAL_FILE_PATH, updatedData);

    // Sync changes to the customer file if a customer is linked
    if (updatedData.configuracion.clienteId) {
        await syncCustomerFromFiestaConfig(updatedData.configuracion.clienteId, updatedData.configuracion);
    }
    
    return { success: true, updatedData };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getFiestaActual(): Promise<FiestaEnPlanificacion> {
  return readData<FiestaEnPlanificacion>(FIESTA_ACTUAL_FILE_PATH, initialFiestaActualData);
}

export async function updateConfiguracion(config: ConfigEventoDataStorage) {
  return updateFiestaData(data => ({ ...data, configuracion: config }));
}

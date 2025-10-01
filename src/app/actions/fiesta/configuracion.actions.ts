


'use server';

import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import type { FiestaEnPlanificacion, ConfigEventoDataStorage } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import { syncCustomerFromFiestaConfig } from '@/app/actions/customers';
import path from 'path';
import { getAllFiestas } from './fiesta.actions';

const FIESTAS_DIR = 'fiestas';

// Helper function to find the active fiesta file
async function getActiveFiestaPath(): Promise<string | null> {
    const fiestas = await getAllFiestas();
    const activeFiesta = fiestas.find(f => f.id.startsWith('fiesta_'));
    if (!activeFiesta) {
        // Create a new one if none exists
        const newFiesta = { ...initialFiestaActualData, id: `fiesta_${Date.now()}`};
        const newFilePath = path.join(FIESTAS_DIR, `${newFiesta.id}.json`);
        await writeData(newFilePath, newFiesta);
        return newFilePath;
    }
    return path.join(FIESTAS_DIR, `${activeFiesta.id}.json`);
}


async function updateFiestaData(updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion): Promise<{ success: boolean; updatedData?: FiestaEnPlanificacion; error?: string }> {
  const FIESTA_ACTUAL_FILE_PATH = await getActiveFiestaPath();
  if (!FIESTA_ACTUAL_FILE_PATH) {
    return { success: false, error: "No se pudo encontrar o crear un archivo de fiesta activa."};
  }

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
  const FIESTA_ACTUAL_FILE_PATH = await getActiveFiestaPath();
   if (!FIESTA_ACTUAL_FILE_PATH) {
    console.error("No active fiesta file found, returning initial data.");
    return initialFiestaActualData;
  }
  return readData<FiestaEnPlanificacion>(FIESTA_ACTUAL_FILE_PATH, initialFiestaActualData);
}

export async function updateConfiguracion(config: ConfigEventoDataStorage) {
  return updateFiestaData(data => ({ ...data, configuracion: config }));
}

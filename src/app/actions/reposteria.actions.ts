
'use server';

import type { ReposteriaData } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import { defaultReposteriaData } from '@/lib/fiesta-defaults';

const REPOSTERIA_TEMPLATE_FILE = 'reposteria-template.json';

// --- ACCIONES PARA LA PLANTILLA MAESTRA DE REPOSTERÍA ---

/**
 * Obtiene la plantilla maestra de repostería.
 */
export async function getReposteriaMasterTemplate(): Promise<ReposteriaData> {
  return readData<ReposteriaData>(REPOSTERIA_TEMPLATE_FILE, defaultReposteriaData);
}

/**
 * Guarda la plantilla maestra de repostería.
 * @param data Los nuevos datos de la plantilla de repostería.
 */
export async function saveReposteriaMasterTemplate(
  data: ReposteriaData
): Promise<{ success: boolean; data?: ReposteriaData; error?: string }> {
  try {
    await writeData(REPOSTERIA_TEMPLATE_FILE, data);
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}


// --- ACCIONES PARA LA FIESTA ESPECÍFICA (A TRAVÉS DE FIESTA-ACTUAL) ---
import { getFiestaById, saveFiesta } from './fiesta/fiesta.actions';

export async function updateReposteria(fiestaId: string, reposteria: ReposteriaData): Promise<{ success: boolean; updatedData?: ReposteriaData; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error("Fiesta no encontrada");
    const updatedFiesta = { ...fiesta, reposteria };
    const result = await saveFiesta(updatedFiesta);
    if (!result.success) throw new Error(result.error);
    return { success: true, updatedData: result.fiesta?.reposteria };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

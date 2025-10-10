
'use server';

import type { ListaDeCargaOperativa } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';

const MASTER_TEMPLATE_FILE = 'carga-operativa-master-template.json';
const defaultMasterTemplate: ListaDeCargaOperativa = {
  id: "master",
  name: "Plantilla Maestra de Carga Operativa",
  categorias: [],
};

// --- ACCIONES PARA LA PLANTILLA MAESTRA ---

/**
 * Obtiene la plantilla maestra de Carga Operativa.
 */
export async function getCargaOperativaMasterTemplate(): Promise<ListaDeCargaOperativa> {
  return readData<ListaDeCargaOperativa>(MASTER_TEMPLATE_FILE, defaultMasterTemplate);
}

/**
 * Guarda la plantilla maestra de Carga Operativa.
 * @param data Los nuevos datos de la plantilla.
 */
export async function saveCargaOperativaMasterTemplate(
  data: ListaDeCargaOperativa
): Promise<{ success: boolean; data?: ListaDeCargaOperativa; error?: string }> {
  try {
    await writeData(MASTER_TEMPLATE_FILE, { ...data, id: 'master', name: 'Plantilla Maestra de Carga Operativa' });
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}


// --- ACCIONES PARA LA FIESTA ESPECÍFICA (A TRAVÉS DE FIESTA-ACTUAL) ---
import { getFiestaById, saveFiesta } from './fiesta.actions';

export async function updateListaDeCargaOperativa(fiestaId: string, lista: ListaDeCargaOperativa): Promise<{ success: boolean; updatedData?: ListaDeCargaOperativa; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error("Fiesta no encontrada");
    const updatedFiesta = { ...fiesta, listaDeCargaOperativa: lista };
    const result = await saveFiesta(updatedFiesta);
    if (!result.success) throw new Error(result.error);
    return { success: true, updatedData: result.fiesta?.listaDeCargaOperativa };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

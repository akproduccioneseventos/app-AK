
'use server';

import type { BebidasData } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import { defaultBebidasData } from '@/lib/fiesta-defaults';

const BEBIDAS_TEMPLATE_FILE = 'bebidas-template.json';

/**
 * Obtiene la plantilla maestra de bebidas.
 */
export async function getBebidasMasterTemplate(): Promise<BebidasData> {
  const data = await readData<BebidasData>(BEBIDAS_TEMPLATE_FILE, defaultBebidasData);
  // Ensure we have the barra_tragos category
  if (!data.categorias.find(c => c.id === 'barra_tragos')) {
      data.categorias.push(defaultBebidasData.categorias.find(c => c.id === 'barra_tragos')!);
  }
  return data;
}

/**
 * Guarda la plantilla maestra de bebidas.
 * @param data Los nuevos datos de la plantilla de bebidas.
 */
export async function saveBebidasMasterTemplate(
  data: BebidasData
): Promise<{ success: boolean; data?: BebidasData; error?: string }> {
  try {
    await writeData(BEBIDAS_TEMPLATE_FILE, data);
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// --- ACCIONES PARA LA FIESTA ESPECÍFICA ---
import { getFiestaById, saveFiesta } from './fiesta/fiesta.actions';

export async function updateBebidas(fiestaId: string, bebidas: BebidasData): Promise<{ success: boolean; updatedData?: BebidasData; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error("Fiesta no encontrada");
    const updatedFiesta = { ...fiesta, bebidas };
    const result = await saveFiesta(updatedFiesta);
    if (!result.success) throw new Error(result.error);
    return { success: true, updatedData: result.fiesta?.bebidas };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

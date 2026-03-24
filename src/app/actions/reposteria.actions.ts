
'use server';

import type { ReposteriaData } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import { defaultReposteriaData } from '@/lib/fiesta-defaults';

const REPOSTERIA_TEMPLATE_FILE = 'reposteria-template.json';

/**
 * Obtiene la plantilla maestra de repostería.
 */
export async function getReposteriaMasterTemplate(): Promise<ReposteriaData> {
  const data = await readData<ReposteriaData>(REPOSTERIA_TEMPLATE_FILE, defaultReposteriaData);
  // Ensure we have all categories
  const essentialCategories = ['mesa_postres', 'candy_bar', 'fuente_chocolate'];
  essentialCategories.forEach(id => {
      if (!data.categorias.find(c => c.id === id)) {
          const cat = defaultReposteriaData.categorias.find(c => c.id === id);
          if (cat) data.categorias.push(cat);
      }
  });
  return data;
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

// --- ACCIONES PARA LA FIESTA ESPECÍFICA ---
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

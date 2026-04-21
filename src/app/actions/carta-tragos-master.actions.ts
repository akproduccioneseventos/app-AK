'use server';

import type { Trago } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import { defaultCartaTragosData } from '@/lib/fiesta-defaults';

const CARTA_TRAGOS_MASTER_FILE = 'carta-tragos-master.json';

const normalizeMasterItems = (items: Trago[]): Trago[] => {
  return items.map((item) => {
    const { ingredientes, recetaIngredientes, stockDisponible, ...rest } = item;
    return {
      ...rest,
      ingredientes: ingredientes || [],
      recetaIngredientes: recetaIngredientes || [],
      stockDisponible: stockDisponible ?? 0,
    };
  });
};

export async function getCartaTragosMaster(): Promise<Trago[]> {
  const fallback = normalizeMasterItems(defaultCartaTragosData.items);
  const data = await readData<Trago[]>(CARTA_TRAGOS_MASTER_FILE, fallback);
  return normalizeMasterItems(Array.isArray(data) ? data : fallback);
}

export async function saveCartaTragosMaster(items: Trago[]): Promise<{ success: boolean; data?: Trago[]; error?: string }> {
  try {
    const sanitized = normalizeMasterItems(items);
    await writeData(CARTA_TRAGOS_MASTER_FILE, sanitized);
    return { success: true, data: sanitized };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

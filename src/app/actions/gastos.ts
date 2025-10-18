
'use server';

import { readData, writeData } from '@/lib/data-service';
import type { GastoGeneral, CategoriaGasto } from '@/types/gastos';

const GASTOS_FILE = 'gastos-generales.json';

export async function getGastosGenerales(): Promise<GastoGeneral[]> {
  const gastos = await readData<GastoGeneral[]>(GASTOS_FILE, []);
  return gastos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

export async function saveGastoGeneral(
  data: Omit<GastoGeneral, 'id'>
): Promise<{ success: boolean; gasto?: GastoGeneral; error?: string }> {
  if (!data.concepto.trim() || !data.fecha || !data.categoria || data.monto <= 0) {
    return { success: false, error: 'Faltan datos obligatorios (Concepto, Fecha, Categoría y Monto mayor a cero).' };
  }
  const gastos = await getGastosGenerales();
  const newGasto: GastoGeneral = {
    ...data,
    id: `gasto_${Date.now()}`,
  };
  gastos.push(newGasto);
  await writeData(GASTOS_FILE, gastos);
  return { success: true, gasto: newGasto };
}

export async function deleteGastoGeneral(id: string): Promise<{ success: boolean; error?: string }> {
  let gastos = await getGastosGenerales();
  const initialLength = gastos.length;
  gastos = gastos.filter(g => g.id !== id);
  if (gastos.length === initialLength) {
    return { success: false, error: 'No se encontró el gasto para eliminar.' };
  }
  await writeData(GASTOS_FILE, gastos);
  return { success: true };
}

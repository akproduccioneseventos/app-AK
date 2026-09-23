
'use server';

import { readData, writeData, createDataItem, deleteDataItem } from '@/lib/data-service';
import type { GastoGeneral } from '@/types/gastos';
import { requireAppSession } from '@/lib/auth/require-session';
import { AsyncMutex } from '@/lib/mutex';

const GASTOS_FILE = 'gastos-generales.json';
const GASTOS_COLLECTION = 'gastos_generales';
const gastosMutex = new AsyncMutex();
/**
 * Con base, cada gasto se guarda y se borra SOLO, no la lista entera. La lista entera
 * leida un rato antes, guardada desde otro servidor, borraba el gasto que otro acababa de
 * cargar (23 de septiembre de 2026). El turno solo cuida un servidor.
 */
const SIN_BASE = () => process.env.AK_USE_LOCAL_JSON_ONLY === 'true';

export async function getGastosGenerales(): Promise<GastoGeneral[]> {
  await requireAppSession();
  const gastos = await readData<GastoGeneral[]>(GASTOS_FILE, []);
  return gastos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

export async function saveGastoGeneral(
  data: Omit<GastoGeneral, 'id'>
): Promise<{ success: boolean; gasto?: GastoGeneral; error?: string }> {
  await requireAppSession();
  if (!data.concepto.trim() || !data.fecha || !data.categoria || data.monto <= 0) {
    return { success: false, error: 'Faltan datos obligatorios (Concepto, Fecha, Categoría y Monto mayor a cero).' };
  }

  const newGasto: GastoGeneral = {
    ...data,
    id: `gasto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
  if (!SIN_BASE()) {
    await createDataItem(GASTOS_FILE, GASTOS_COLLECTION, newGasto.id, newGasto);
    return { success: true, gasto: newGasto };
  }
  return gastosMutex.runExclusive(async () => {
    const gastos = await getGastosGenerales();
    gastos.push(newGasto);
    await writeData(GASTOS_FILE, gastos);
    return { success: true, gasto: newGasto };
  });
}

export async function deleteGastoGeneral(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  if (!SIN_BASE()) {
    const borrado = await deleteDataItem(GASTOS_FILE, GASTOS_COLLECTION, id);
    return borrado ? { success: true } : { success: false, error: 'No se encontró el gasto para eliminar.' };
  }
  return gastosMutex.runExclusive(async () => {
    let gastos = await getGastosGenerales();
    const initialLength = gastos.length;
    gastos = gastos.filter(g => g.id !== id);
    if (gastos.length === initialLength) {
      return { success: false, error: 'No se encontró el gasto para eliminar.' };
    }
    await writeData(GASTOS_FILE, gastos);
    return { success: true };
  });
}


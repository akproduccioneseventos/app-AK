
'use server';

import { readData, writeData, createDataItem, deleteDataItem } from '@/lib/data-service';
import type { GastoGeneral } from '@/types/gastos';
import { requireAppSession, requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS, type Permiso } from '@/lib/auth/perfiles';
import { AsyncMutex } from '@/lib/mutex';
import { createHash } from 'crypto';
import { ALL_CATEGORIAS_GASTO } from '@/types/gastos';

const GASTOS_FILE = 'gastos-generales.json';
const GASTOS_COLLECTION = 'gastos_generales';
const gastosMutex = new AsyncMutex();
/**
 * Con base, cada gasto se guarda y se borra SOLO, no la lista entera. La lista entera
 * leida un rato antes, guardada desde otro servidor, borraba el gasto que otro acababa de
 * cargar (23 de septiembre de 2026). El turno solo cuida un servidor.
 */
const SIN_BASE = () => process.env.AK_USE_LOCAL_JSON_ONLY === 'true';

/**
 * Quién toca los gastos (Codex, auditoría 70, GAS01). Antes alcanzaba la sesión: el personal
 * leía, cargaba y borraba gastos. Ahora: leer y borrar, contabilidad; cargar, contabilidad o
 * insumos (el mantenimiento de un equipo deja su gasto). Los sueldos administrativos, sólo quien
 * ve sueldos.
 */
async function permisoDeGastos(...permisos: Permiso[]) {
  for (const permiso of permisos) {
    const r = await requirePermiso(permiso);
    if (r.ok) return r;
  }
  return requirePermiso(permisos[0]);
}

async function leerGastos(): Promise<GastoGeneral[]> {
  const gastos = await readData<GastoGeneral[]>(GASTOS_FILE, []);
  return gastos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

export async function getGastosGenerales(): Promise<GastoGeneral[]> {
  await requireAppSession();
  const permiso = await requirePermiso(PERMISOS.CONTABILIDAD);
  if (!permiso.ok) throw new Error(permiso.error);
  const veSueldos = (await requirePermiso(PERMISOS.SUELDOS)).ok;
  const gastos = await leerGastos();
  return veSueldos ? gastos : gastos.filter((g) => g.categoria !== 'Sueldos Administrativos');
}

/** El mismo pedido repetido trae la misma llave: el gasto tiene un número fijo que sale de ella. */
function idDeLaLlave(llave: string): string {
  return `gasto_llave_${createHash('sha256').update(llave).digest('hex').slice(0, 32)}`;
}

function mismoGasto(a: Omit<GastoGeneral, 'id'>, b: Omit<GastoGeneral, 'id'>): boolean {
  return a.monto === b.monto && a.fecha === b.fecha && a.categoria === b.categoria && a.concepto.trim() === b.concepto.trim();
}

export async function saveGastoGeneral(
  data: Omit<GastoGeneral, 'id'>
): Promise<{ success: boolean; gasto?: GastoGeneral; error?: string }> {
  await requireAppSession();
  const permiso = await permisoDeGastos(PERMISOS.CONTABILIDAD, PERMISOS.INSUMOS);
  if (!permiso.ok) return { success: false, error: permiso.error };
  // Un importe que no es un número (NaN, Infinity) pasaba "monto <= 0" y se guardaba (GAS03).
  const monto = Number(data.monto);
  if (!data.concepto?.trim() || !data.fecha || !data.categoria || !Number.isFinite(monto) || monto <= 0) {
    return { success: false, error: 'Faltan datos obligatorios (Concepto, Fecha, Categoría y Monto mayor a cero).' };
  }
  if (Number.isNaN(new Date(data.fecha).getTime())) return { success: false, error: 'La fecha del gasto no es válida.' };
  if (!ALL_CATEGORIAS_GASTO.includes(data.categoria)) return { success: false, error: 'La categoría del gasto no es válida.' };
  if (data.categoria === 'Sueldos Administrativos' && !(await requirePermiso(PERMISOS.SUELDOS)).ok) {
    return { success: false, error: 'Los sueldos administrativos los carga quien ve sueldos.' };
  }
  data = { ...data, monto };

  /**
   * Dos reintentos a la vez con la misma llave guardaban dos gastos (GAS02): se miraba si ya
   * estaba y después se creaba con un número al azar. Ahora el número sale de la llave y la base
   * crea el gasto sólo si no existe: el segundo choca y recibe el primero. Si la llave ya se usó
   * con OTROS datos, no se toma por el mismo gasto: se avisa.
   */
  if (data.idempotencyKey && !SIN_BASE()) {
    const id = idDeLaLlave(data.idempotencyKey);
    const gasto: GastoGeneral = { ...data, id };
    try {
      await createDataItem(GASTOS_FILE, GASTOS_COLLECTION, id, gasto);
      return { success: true, gasto };
    } catch (error) {
      const existente = (await leerGastos()).find((g) => g.id === id || g.idempotencyKey === data.idempotencyKey);
      if (!existente) throw error;
      if (!mismoGasto(existente, data)) {
        return { success: false, error: 'Esa operación ya quedó registrada con otros datos. Revisá el gasto antes de cargarlo de nuevo.' };
      }
      return { success: true, gasto: existente };
    }
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
    const gastos = await leerGastos();
    if (data.idempotencyKey) {
      const yaExiste = gastos.find(g => g.idempotencyKey === data.idempotencyKey);
      if (yaExiste && !mismoGasto(yaExiste, data)) {
        return { success: false, error: 'Esa operación ya quedó registrada con otros datos. Revisá el gasto antes de cargarlo de nuevo.' };
      }
      if (yaExiste) return { success: true, gasto: yaExiste };
    }
    gastos.push(newGasto);
    await writeData(GASTOS_FILE, gastos);
    return { success: true, gasto: newGasto };
  });
}

export async function deleteGastoGeneral(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  const permiso = await requirePermiso(PERMISOS.CONTABILIDAD);
  if (!permiso.ok) return { success: false, error: permiso.error };
  if (!SIN_BASE()) {
    const borrado = await deleteDataItem(GASTOS_FILE, GASTOS_COLLECTION, id);
    return borrado ? { success: true } : { success: false, error: 'No se encontró el gasto para eliminar.' };
  }
  return gastosMutex.runExclusive(async () => {
    let gastos = await leerGastos();
    const initialLength = gastos.length;
    gastos = gastos.filter(g => g.id !== id);
    if (gastos.length === initialLength) {
      return { success: false, error: 'No se encontró el gasto para eliminar.' };
    }
    await writeData(GASTOS_FILE, gastos);
    return { success: true };
  });
}


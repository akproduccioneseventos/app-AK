
'use server';

import type { ServicioEmpresa } from '@/types/empresa';
import { createDataItem, deleteDataItem, readData, updateDataItem } from '@/lib/data-service';
import { requireAppSession } from '@/lib/auth/require-session';

const ACTIVOS_FIJOS_FILE = 'activos-fijos.json';
const ACTIVOS_FIJOS_COLLECTION = 'activos_fijos';

export async function getActivosFijos(): Promise<ServicioEmpresa[]> {
    const items = await readData<any[]>(ACTIVOS_FIJOS_FILE, []);
    return (Array.isArray(items) ? items : []).map(item => ({
      ...item,
      tipoItem: 'Activo Fijo',
      valorUnitarioEstimado: item.valorUnitarioEstimado !== undefined && !isNaN(Number(item.valorUnitarioEstimado)) ? Number(item.valorUnitarioEstimado) : 0,
      cantidadDisponible: item.cantidadDisponible !== undefined && !isNaN(Number(item.cantidadDisponible)) ? Number(item.cantidadDisponible) : undefined,
    })).sort((a, b) =>
      (a.categoria || '').localeCompare(b.categoria || '')
      || (a.nombre || '').localeCompare(b.nombre || '')
    );
}

export async function getActivoFijoById(id: string): Promise<ServicioEmpresa | null> {
  const activos = await getActivosFijos();
  return activos.find(s => s.id === id) || null;
}

export async function saveActivoFijo(
  itemData: Omit<ServicioEmpresa, 'id'> | ServicioEmpresa
): Promise<{ success: boolean; id?: string; servicio?: ServicioEmpresa; error?: string }> {
  await requireAppSession();
  let inventario = await getActivosFijos();
  let finalItemData: Partial<ServicioEmpresa>;
  let itemId: string;

  const dataWithParsedNumbers: Partial<ServicioEmpresa> = {
    ...itemData,
    tipoItem: 'Activo Fijo',
    cantidadDisponible: itemData.cantidadDisponible !== undefined && !isNaN(Number(itemData.cantidadDisponible)) ? Number(itemData.cantidadDisponible) : undefined,
    valorUnitarioEstimado: itemData.valorUnitarioEstimado !== undefined && !isNaN(Number(itemData.valorUnitarioEstimado)) ? Number(itemData.valorUnitarioEstimado) : 0,
    imageUrl: itemData.imageUrl?.trim() || undefined,
    // Remover campos de precio de venta, ya que no aplican a activos para lista de carga
    precioVenta: undefined,
    precioBase: undefined,
    precioPorPersona: undefined,
    tramosDePrecio: undefined,
    // Mantener campos de cálculo de cantidad
    calculationMethod: itemData.calculationMethod || 'fijo',
    invitadosPorUnidad: itemData.invitadosPorUnidad === undefined || itemData.invitadosPorUnidad === null || isNaN(Number(itemData.invitadosPorUnidad)) ? undefined : Number(itemData.invitadosPorUnidad),
    subcategoria: itemData.subcategoria?.trim() || undefined,
    notas: (itemData as any).notas?.trim() || undefined,
  };

  if (!dataWithParsedNumbers.nombre || dataWithParsedNumbers.nombre.trim() === "") return { success: false, error: "El nombre del activo es obligatorio." };
  if (!dataWithParsedNumbers.categoria) return { success: false, error: "La categoría es obligatoria." };
  if (!dataWithParsedNumbers.unidad) return { success: false, error: "La unidad es obligatoria para activos." };

  if ('id' in dataWithParsedNumbers && dataWithParsedNumbers.id) {
    itemId = dataWithParsedNumbers.id;
    const index = inventario.findIndex(s => s.id === itemId);
    if (index === -1) return { success: false, error: `Activo con ID ${itemId} no encontrado.` };
    
    inventario[index] = { ...inventario[index], ...dataWithParsedNumbers } as ServicioEmpresa;
    finalItemData = inventario[index];
  } else {
    const existingItem = inventario.find(s => s.nombre.trim().toLowerCase() === dataWithParsedNumbers.nombre!.trim().toLowerCase() && s.categoria === dataWithParsedNumbers.categoria);
    if (existingItem) return { success: false, error: `Ya existe un activo con el nombre "${dataWithParsedNumbers.nombre!.trim()}" en la categoría "${dataWithParsedNumbers.categoria}".` };
    itemId = `activo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    finalItemData = { ...(dataWithParsedNumbers as Omit<ServicioEmpresa, 'id'>), id: itemId };
    inventario.push(finalItemData as ServicioEmpresa);
  }
  
  if ('id' in itemData && itemData.id) {
    const updated = await updateDataItem(
      ACTIVOS_FIJOS_FILE,
      ACTIVOS_FIJOS_COLLECTION,
      itemId,
      finalItemData,
    );
    if (!updated) return { success: false, error: `Activo con ID ${itemId} no encontrado.` };
  } else {
    await createDataItem(ACTIVOS_FIJOS_FILE, ACTIVOS_FIJOS_COLLECTION, itemId, finalItemData);
  }
  return { success: true, id: itemId, servicio: finalItemData as ServicioEmpresa };
}

export async function deleteActivoFijo(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  const deleted = await deleteDataItem(ACTIVOS_FIJOS_FILE, ACTIVOS_FIJOS_COLLECTION, id);
  if (!deleted) return { success: false, error: `Activo Fijo con ID ${id} no encontrado para eliminar.` };
  return { success: true };
}

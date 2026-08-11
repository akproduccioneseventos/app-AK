
'use server';

import type { Proveedor, NuevoProveedorFormData } from '@/types/proveedor';
import { createDataItem, deleteDataItem, readData, updateDataItem } from '@/lib/data-service';
import { requireAppSession } from '@/lib/auth/require-session';

const PROVEEDORES_FILE = 'proveedores.json';
const PROVEEDORES_COLLECTION = 'proveedores';

export async function getProveedores(): Promise<Proveedor[]> {
  const proveedores = await readData<Proveedor[]>(PROVEEDORES_FILE, []);
  return [...proveedores].sort((a, b) =>
    (a.nombreEmpresa || a.nombre || '').localeCompare(b.nombreEmpresa || b.nombre || '')
  );
}

export async function getProveedorById(id: string): Promise<Proveedor | null> {
  const proveedores = await getProveedores();
  return proveedores.find(p => p.id === id) || null;
}

export async function saveProveedor(
  proveedorData: NuevoProveedorFormData | Proveedor
): Promise<{ success: boolean; id?: string; proveedor?: Proveedor; error?: string }> {
  await requireAppSession();
  let proveedores = await getProveedores();
  let finalProveedorData: Proveedor;
  let proveedorId: string;

  if (!proveedorData.nombreEmpresa?.trim()) {
    return { success: false, error: 'El nombre de la empresa o del servicio es obligatorio.' };
  }
  if (!proveedorData.servicioPrincipal.trim()) {
      return { success: false, error: 'El servicio principal/categoría es obligatorio.' };
  }

  if ('id' in proveedorData && proveedorData.id) {
    // Update
    proveedorId = proveedorData.id;
    const index = proveedores.findIndex(p => p.id === proveedorId);
    if (index === -1) {
      return { success: false, error: `Proveedor con ID ${proveedorId} no encontrado.` };
    }
    proveedores[index] = { ...proveedores[index], ...proveedorData };
    finalProveedorData = proveedores[index];
  } else {
    // Create
    const isDuplicate = proveedores.some(p => p.nombreEmpresa?.trim().toLowerCase() === proveedorData.nombreEmpresa!.trim().toLowerCase());
    if (isDuplicate) {
        return { success: false, error: `Ya existe un proveedor o servicio con el nombre "${proveedorData.nombreEmpresa!.trim()}".` };
    }

    proveedorId = `prov_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    finalProveedorData = {
      ...proveedorData,
      id: proveedorId,
      nombre: proveedorData.nombre.trim(),
      nombreEmpresa: proveedorData.nombreEmpresa.trim(),
    };
    proveedores.push(finalProveedorData);
  }
  try {
    if ('id' in proveedorData && proveedorData.id) {
      const updated = await updateDataItem(
        PROVEEDORES_FILE,
        PROVEEDORES_COLLECTION,
        proveedorId,
        finalProveedorData,
      );
      if (!updated) return { success: false, error: `Proveedor con ID ${proveedorId} no encontrado.` };
    } else {
      await createDataItem(PROVEEDORES_FILE, PROVEEDORES_COLLECTION, proveedorId, finalProveedorData);
    }
  } catch (writeError: any) {
    console.error("Error saving proveedor:", writeError);
    return { success: false, error: writeError.message || "Error al guardar el proveedor." };
  }
  return { success: true, id: proveedorId, proveedor: finalProveedorData };
}

export async function deleteProveedor(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();

  // Borrarlo de una deja a sus insumos apuntando a un proveedor que ya no existe:
  // en la lista de compras esos productos quedan sin a quien pedirselos, y nadie
  // se entera hasta el dia que hay que comprar. Mismo criterio que al dar de baja
  // a alguien del equipo: se avisa que hay que resolverlo antes.
  try {
    const { getInsumos } = await import('./insumos');
    const insumos = await getInsumos();
    const enUso = insumos.filter((insumo: { proveedor?: string }) => insumo.proveedor === id);
    if (enUso.length > 0) {
      const nombres = enUso
        .slice(0, 3)
        .map((insumo: { nombre?: string }) => insumo.nombre)
        .filter(Boolean)
        .join(', ');
      const resto = enUso.length > 3 ? ` y ${enUso.length - 3} más` : '';
      return {
        success: false,
        error: `Este proveedor tiene ${enUso.length} insumo(s) asociado(s): ${nombres}${resto}. Cambiales el proveedor antes de eliminarlo.`,
      };
    }
  } catch (lookupError: any) {
    console.error('Error comprobando insumos del proveedor:', lookupError);
    return { success: false, error: 'No se pudo comprobar si el proveedor tiene insumos asociados. Probá de nuevo.' };
  }

  try {
    const deleted = await deleteDataItem(PROVEEDORES_FILE, PROVEEDORES_COLLECTION, id);
    if (!deleted) return { success: false, error: `Proveedor con ID ${id} no encontrado para eliminar.` };
  } catch (writeError: any) {
    console.error("Error deleting proveedor:", writeError);
    return { success: false, error: writeError.message || "Error al eliminar el proveedor." };
  }
  return { success: true };
}

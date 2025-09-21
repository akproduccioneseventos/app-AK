
'use server';

import type { Proveedor, NuevoProveedorFormData } from '@/types/proveedor';
import { readData, writeData } from '@/lib/data-service';

const PROVEEDORES_FILE = 'proveedores.json';

export async function getProveedores(): Promise<Proveedor[]> {
  return readData<Proveedor[]>(PROVEEDORES_FILE, []);
}

export async function getProveedorById(id: string): Promise<Proveedor | null> {
  const proveedores = await getProveedores();
  return proveedores.find(p => p.id === id) || null;
}

export async function saveProveedor(
  proveedorData: NuevoProveedorFormData | Proveedor
): Promise<{ success: boolean; id?: string; proveedor?: Proveedor; error?: string }> {
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
    proveedorId = `prov_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    finalProveedorData = {
      ...proveedorData,
      id: proveedorId,
      nombre: proveedorData.nombre.trim(),
      nombreEmpresa: proveedorData.nombreEmpresa.trim(),
    };
    proveedores.push(finalProveedorData);
  }
  await writeData(PROVEEDORES_FILE, proveedores, (a, b) => (a.nombreEmpresa || a.nombre || '').localeCompare(b.nombreEmpresa || b.nombre || ''));
  return { success: true, id: proveedorId, proveedor: finalProveedorData };
}

export async function deleteProveedor(id: string): Promise<{ success: boolean; error?: string }> {
  let proveedores = await getProveedores();
  const initialLength = proveedores.length;
  proveedores = proveedores.filter(p => p.id !== id);
  if (proveedores.length === initialLength) {
    return { success: false, error: `Proveedor con ID ${id} no encontrado para eliminar.` };
  }
  await writeData(PROVEEDORES_FILE, proveedores);
  return { success: true };
}

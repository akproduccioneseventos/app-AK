'use server';

import type { Proveedor, NuevoProveedorFormData } from '@/types/proveedor';

export async function getProveedores(): Promise<Proveedor[]> {
  return [];
}

export async function getProveedorById(id: string): Promise<Proveedor | null> {
  return null;
}

export async function saveProveedor(
  proveedorData: NuevoProveedorFormData | Proveedor
): Promise<{ success: boolean; id?: string; proveedor?: Proveedor; error?: string }> {
  return { success: false, error: 'Módulo de proveedores deshabilitado.' };
}

export async function deleteProveedor(id: string): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Módulo de proveedores deshabilitado.' };
}

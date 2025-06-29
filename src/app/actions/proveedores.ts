
'use server';

import type { Proveedor, NuevoProveedorFormData } from '@/types/proveedor';
import fs from 'fs/promises';
import path from 'path';

const PROVEEDORES_COLLECTION_JSON = 'proveedores.json';
const dataDirectory = path.join(process.cwd(), 'src', 'data');
const proveedoresFilePath = path.join(dataDirectory, PROVEEDORES_COLLECTION_JSON);

async function ensureDataDirectoryExists() {
  try {
    await fs.access(dataDirectory);
  } catch {
    await fs.mkdir(dataDirectory, { recursive: true });
  }
}

async function readProveedoresFile(): Promise<Proveedor[]> {
  try {
    await ensureDataDirectoryExists();
    await fs.access(proveedoresFilePath);
    const fileContent = await fs.readFile(proveedoresFilePath, 'utf-8');
    if (fileContent.trim() === '') return [];
    return JSON.parse(fileContent) as Proveedor[];
  } catch (error) {
    return [];
  }
}

async function writeProveedoresFile(data: Proveedor[]): Promise<void> {
  try {
    await ensureDataDirectoryExists();
    const sortedData = data.sort((a, b) => (a.nombreEmpresa || a.nombre || '').localeCompare(b.nombreEmpresa || b.nombre || ''));
    await fs.writeFile(proveedoresFilePath, JSON.stringify(sortedData, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing proveedores JSON file:', error);
  }
}

async function initializeLocalProveedoresFile() {
  try {
    await fs.access(proveedoresFilePath);
  } catch {
    await writeProveedoresFile([]);
  }
}
initializeLocalProveedoresFile();

export async function getProveedores(): Promise<Proveedor[]> {
  return readProveedoresFile();
}

export async function getProveedorById(id: string): Promise<Proveedor | null> {
  const proveedores = await readProveedoresFile();
  return proveedores.find(p => p.id === id) || null;
}

export async function saveProveedor(
  proveedorData: NuevoProveedorFormData | Proveedor
): Promise<{ success: boolean; id?: string; proveedor?: Proveedor; error?: string }> {
  let proveedores = await readProveedoresFile();
  let finalProveedorData: Proveedor;
  let proveedorId: string;

  if (!proveedorData.nombre.trim() && !proveedorData.nombreEmpresa?.trim()) {
    return { success: false, error: 'El nombre del proveedor o de la empresa es obligatorio.' };
  }
  if (!proveedorData.servicioPrincipal.trim()) {
      return { success: false, error: 'El servicio principal es obligatorio.' };
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
      nombre: proveedorData.nombre.trim() || proveedorData.nombreEmpresa!.trim(), // Ensure name is present
    };
    proveedores.push(finalProveedorData);
  }
  await writeProveedoresFile(proveedores);
  return { success: true, id: proveedorId, proveedor: finalProveedorData };
}

export async function deleteProveedor(id: string): Promise<{ success: boolean; error?: string }> {
  let proveedores = await readProveedoresFile();
  const initialLength = proveedores.length;
  proveedores = proveedores.filter(p => p.id !== id);
  if (proveedores.length === initialLength) {
    return { success: false, error: `Proveedor con ID ${id} no encontrado para eliminar.` };
  }
  await writeProveedoresFile(proveedores);
  return { success: true };
}

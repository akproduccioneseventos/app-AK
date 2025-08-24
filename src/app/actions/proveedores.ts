
'use server';

import type { Proveedor, NuevoProveedorFormData } from '@/types/proveedor';
import fs from 'fs/promises';
import path from 'path';

const PROVEEDORES_COLLECTION_JSON = 'proveedores.json';
const dataDirectory = path.join(process.cwd(), 'src', 'data');
const proveedoresFilePath = path.join(dataDirectory, PROVEEDORES_COLLECTION_JSON);

async function ensureDataFileExists(filePath: string, defaultContent: string = '[]') {
    try {
        await fs.access(dataDirectory);
    } catch {
        await fs.mkdir(dataDirectory, { recursive: true });
    }
    try {
        await fs.access(filePath);
    } catch {
        await fs.writeFile(filePath, defaultContent, 'utf-8');
    }
}

async function readProveedoresFile(): Promise<Proveedor[]> {
  await ensureDataFileExists(proveedoresFilePath, '[]');
  try {
    const fileContent = await fs.readFile(proveedoresFilePath, 'utf-8');
    if (fileContent.trim() === '') return [];
    return JSON.parse(fileContent) as Proveedor[];
  } catch (error) {
    console.error('Error reading proveedores file, returning empty array:', error);
    return [];
  }
}

async function writeProveedoresFile(data: Proveedor[]): Promise<void> {
  await ensureDataFileExists(proveedoresFilePath, '[]');
  const sortedData = data.sort((a, b) => (a.nombreEmpresa || a.nombre || '').localeCompare(b.nombreEmpresa || b.nombre || ''));
  await fs.writeFile(proveedoresFilePath, JSON.stringify(sortedData, null, 2), 'utf-8');
}

async function initializeLocalProveedoresFile() {
  await readProveedoresFile();
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

  if (!proveedorData.nombreEmpresa?.trim()) {
    return { success: false, error: 'El nombre de la empresa o del servicio es obligatorio.' };
  }
  if (!proveedorData.servicioPrincipal.trim()) {
      return { success: false, error: 'El servicio principal/categoría es obligatorio.' };
  }
  
  const trimmedName = proveedorData.nombreEmpresa.trim().toLowerCase();
  
  // Enhanced duplicate check
  const existingProveedor = proveedores.find(p => 
    p.nombreEmpresa?.trim().toLowerCase() === trimmedName &&
    ('id' in proveedorData ? p.id !== proveedorData.id : true)
  );

  if (existingProveedor) {
    return { success: false, error: `Ya existe un proveedor con el nombre de empresa "${proveedorData.nombreEmpresa.trim()}".` };
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

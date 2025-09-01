
'use server';

import type { Empleado, NuevoEmpleadoFormData } from '@/types/empleado';
import fs from 'fs/promises';
import path from 'path';

const EMPLEADOS_COLLECTION_JSON = 'empleados.json';
const dataDirectory = path.join(process.cwd(), 'src', 'data');
const empleadosFilePath = path.join(dataDirectory, EMPLEADOS_COLLECTION_JSON);

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

async function readEmpleadosFile(): Promise<Empleado[]> {
  await ensureDataFileExists(empleadosFilePath, '[]');
  try {
    const fileContent = await fs.readFile(empleadosFilePath, 'utf-8');
    if (fileContent.trim() === '') return [];
    return JSON.parse(fileContent) as Empleado[];
  } catch (error) {
    console.error('Error reading empleados file, returning empty array:', error);
    return [];
  }
}

async function writeEmpleadosFile(data: Empleado[]): Promise<void> {
  await ensureDataFileExists(empleadosFilePath, '[]');
  const sortedData = data.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  await fs.writeFile(empleadosFilePath, JSON.stringify(sortedData, null, 2), 'utf-8');
}

async function initializeLocalEmpleadosFile() {
  await readEmpleadosFile();
}
initializeLocalEmpleadosFile();

export async function getEmpleados(): Promise<Empleado[]> {
  return readEmpleadosFile();
}

export async function getEmpleadoById(id: string): Promise<Empleado | null> {
  const empleados = await readEmpleadosFile();
  return empleados.find(e => e.id === id) || null;
}

export async function saveEmpleado(
  empleadoData: NuevoEmpleadoFormData | Empleado
): Promise<{ success: boolean; id?: string; empleado?: Empleado; error?: string }> {
  if (!empleadoData.nombre?.trim()) {
    return { success: false, error: 'El nombre del empleado es obligatorio.' };
  }

  let empleados = await readEmpleadosFile();
  let finalEmpleadoData: Empleado;
  let empleadoId: string;

  if ('id' in empleadoData && empleadoData.id) {
    // Update
    empleadoId = empleadoData.id;
    const index = empleados.findIndex(e => e.id === empleadoId);
    if (index === -1) {
      return { success: false, error: `Empleado con ID ${empleadoId} no encontrado.` };
    }
    const dataToUpdate: Partial<Empleado> = {
        nombre: empleadoData.nombre,
        cedula: empleadoData.cedula,
        fechaNacimiento: empleadoData.fechaNacimiento,
        rolId: (empleadoData as Empleado).rolId || undefined,
    };
    empleados[index] = { ...empleados[index], ...dataToUpdate };
    finalEmpleadoData = empleados[index];
  } else {
    // Create
    empleadoId = `emp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newEmpleadoData = empleadoData as NuevoEmpleadoFormData;
    finalEmpleadoData = {
      id: empleadoId,
      nombre: newEmpleadoData.nombre,
      cedula: newEmpleadoData.cedula || '',
      fechaNacimiento: newEmpleadoData.fechaNacimiento || '',
      rolId: newEmpleadoData.rolId,
    };
    empleados.push(finalEmpleadoData);
  }
  await writeEmpleadosFile(empleados);
  return { success: true, id: empleadoId, empleado: finalEmpleadoData };
}

export async function deleteEmpleado(id: string): Promise<{ success: boolean; error?: string }> {
  let empleados = await readEmpleadosFile();
  const initialLength = empleados.length;
  empleados = empleados.filter(e => e.id !== id);
  if (empleados.length === initialLength) {
    return { success: false, error: `Empleado con ID ${id} no encontrado para eliminar.` };
  }
  await writeEmpleadosFile(empleados);
  return { success: true };
}

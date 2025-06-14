
'use server';

// import { dbAdmin as db } from '@/lib/firebase/server'; // Firebase disabled
import type { Empleado, NuevoEmpleadoFormData } from '@/types/empleado';

import fs from 'fs/promises';
import path from 'path';

const EMPLEADOS_COLLECTION_JSON = 'empleados.json';
const dataDirectory = path.join(process.cwd(), 'src', 'data');
const empleadosFilePath = path.join(dataDirectory, EMPLEADOS_COLLECTION_JSON);

async function ensureDataDirectoryExists() {
  try {
    await fs.access(dataDirectory);
  } catch {
    await fs.mkdir(dataDirectory, { recursive: true });
  }
}

async function readEmpleadosFile(): Promise<Empleado[]> {
  try {
    await ensureDataDirectoryExists();
    await fs.access(empleadosFilePath);
    const fileContent = await fs.readFile(empleadosFilePath, 'utf-8');
    if (fileContent.trim() === '') return [];
    return JSON.parse(fileContent) as Empleado[];
  } catch (error) {
    return [];
  }
}

async function writeEmpleadosFile(data: Empleado[]): Promise<void> {
  try {
    await ensureDataDirectoryExists();
    const sortedData = data.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    await fs.writeFile(empleadosFilePath, JSON.stringify(sortedData, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing empleados JSON file:', error);
  }
}

async function initializeLocalEmpleadosFile() {
  try {
    await ensureDataDirectoryExists();
    await fs.access(empleadosFilePath);
    const fileContent = await fs.readFile(empleadosFilePath, 'utf-8');
    if (fileContent.trim() === '') {
      await writeEmpleadosFile([]);
    } else {
      JSON.parse(fileContent);
    }
  } catch (error) {
    await writeEmpleadosFile([]);
  }
}
initializeLocalEmpleadosFile();


export async function getEmpleados(): Promise<Empleado[]> {
  // console.log("Firebase is disabled. Reading empleados from JSON.");
  return readEmpleadosFile();
}

export async function getEmpleadoById(id: string): Promise<Empleado | null> {
  // console.log(`Firebase is disabled. Reading empleado ${id} from JSON.`);
  const empleados = await readEmpleadosFile();
  return empleados.find(e => e.id === id) || null;
}

export async function saveEmpleado(
  empleadoData: NuevoEmpleadoFormData | Empleado
): Promise<{ success: boolean; id?: string; empleado?: Empleado; error?: string }> {
  // console.log("Firebase is disabled. Saving empleado to JSON.");
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
    empleados[index] = { ...empleados[index], ...empleadoData } as Empleado;
    finalEmpleadoData = empleados[index];
  } else {
    // Create
    empleadoId = `emp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    finalEmpleadoData = {
      id: empleadoId,
      nombre: empleadoData.nombre,
      cedula: (empleadoData as NuevoEmpleadoFormData).cedula,
      fechaNacimiento: (empleadoData as NuevoEmpleadoFormData).fechaNacimiento,
      rolId: (empleadoData as Empleado).rolId, // Will be undefined for NuevoEmpleadoFormData
    };
    empleados.push(finalEmpleadoData);
  }
  await writeEmpleadosFile(empleados);
  return { success: true, id: empleadoId, empleado: finalEmpleadoData };
}

export async function deleteEmpleado(id: string): Promise<{ success: boolean; error?: string }> {
  // console.log(`Firebase is disabled. Deleting empleado ${id} from JSON.`);
  let empleados = await readEmpleadosFile();
  const initialLength = empleados.length;
  empleados = empleados.filter(e => e.id !== id);
  if (empleados.length === initialLength) {
    return { success: false, error: `Empleado con ID ${id} no encontrado para eliminar.` };
  }
  await writeEmpleadosFile(empleados);
  return { success: true };
}


'use server';

import type { Empleado, NuevoEmpleadoFormData } from '@/types/empleado';
import { readData, writeData } from '@/lib/data-service';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const EMPLEADOS_FILE = 'empleados.json';
const CONTRACTS_DIR = path.join(process.cwd(), 'src', 'data', 'employee-contracts');

async function ensureContractsDirectoryExists(): Promise<void> {
    try {
        await fs.access(CONTRACTS_DIR);
    } catch {
        await fs.mkdir(CONTRACTS_DIR, { recursive: true });
    }
}

export async function getEmpleados(): Promise<Empleado[]> {
  return readData<Empleado[]>(EMPLEADOS_FILE, []);
}

export async function getEmpleadoById(id: string): Promise<Empleado | null> {
  const empleados = await getEmpleados();
  return empleados.find(e => e.id === id) || null;
}

export async function saveEmpleado(
  empleadoData: NuevoEmpleadoFormData | Empleado | FormData
): Promise<{ success: boolean; id?: string; empleado?: Empleado; error?: string }> {

  let empleados = await getEmpleados();
  let empleadoId: string;
  let empleadoToSave: Partial<Empleado> = {};
  let contractFile: File | null = null;

  if (empleadoData instanceof FormData) {
    empleadoToSave.id = empleadoData.get('id') as string | undefined;
    empleadoToSave.nombre = empleadoData.get('nombre') as string;
    empleadoToSave.cedula = empleadoData.get('cedula') as string | undefined;
    empleadoToSave.fechaNacimiento = empleadoData.get('fechaNacimiento') as string | undefined;
    empleadoToSave.telefono = empleadoData.get('telefono') as string | undefined;
    const rolIdsStr = empleadoData.get('rolIds') as string | null;
    empleadoToSave.rolIds = rolIdsStr ? rolIdsStr.split(',') : [];
    contractFile = empleadoData.get('contract') as File | null;
    empleadoToSave.contractFileName = empleadoData.get('existingContract') as string || undefined;

  } else {
    empleadoToSave = { ...empleadoData };
  }
  
  if (!empleadoToSave.nombre?.trim()) {
    return { success: false, error: 'El nombre del empleado es obligatorio.' };
  }

  let isNewEmployee = false;

  if (empleadoToSave.id) { // Update
    empleadoId = empleadoToSave.id;
    const index = empleados.findIndex(e => e.id === empleadoId);
    if (index === -1) {
      return { success: false, error: `Empleado con ID ${empleadoId} no encontrado.` };
    }
    const existingEmpleado = empleados[index];
    empleados[index] = {
      ...existingEmpleado,
      ...empleadoToSave,
    };
    empleadoToSave = empleados[index];
  } else { // Create
    const isDuplicate = empleados.some(emp => emp.nombre && emp.nombre.trim().toLowerCase() === empleadoToSave.nombre!.trim().toLowerCase());
    if (isDuplicate) {
        return { success: false, error: `Ya existe un empleado con el nombre "${empleadoToSave.nombre!.trim()}".` };
    }
    empleadoId = `emp_${randomUUID()}`;
    empleadoToSave.id = empleadoId;
    empleados.push(empleadoToSave as Empleado);
    isNewEmployee = true;
  }

  if (contractFile && contractFile.size > 0) {
    try {
      if (contractFile.type !== 'application/pdf') {
        // Rollback in-memory addition for new employees before returning
        if (isNewEmployee) {
          empleados = empleados.filter(e => e.id !== empleadoId);
        }
        return { success: false, error: 'El contrato debe ser un archivo PDF.' };
      }
      await ensureContractsDirectoryExists();
      const bytes = await contractFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uniqueFilename = `contract_${empleadoId}_${Date.now()}_${contractFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      await fs.writeFile(path.join(CONTRACTS_DIR, uniqueFilename), buffer);
      empleadoToSave.contractFileName = uniqueFilename;
    } catch (fileError: any) {
      console.error("Error saving employee contract file:", fileError);
      // Rollback in-memory addition for new employees before returning
      if (isNewEmployee) {
        empleados = empleados.filter(e => e.id !== empleadoId);
      }
      return { success: false, error: `Error al guardar archivo de contrato: ${fileError.message}` };
    }
  }
  
  const finalIndex = empleados.findIndex(e => e.id === empleadoId);
  if (finalIndex !== -1) empleados[finalIndex] = empleadoToSave as Empleado;

  try {
    await writeData(EMPLEADOS_FILE, empleados, (a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  } catch (writeError: any) {
    console.error("Error writing empleados data:", writeError);
    return { success: false, error: `Error al guardar los datos del empleado: ${writeError.message}` };
  }
  return { success: true, id: empleadoId, empleado: empleadoToSave as Empleado };
}

export async function deleteEmpleado(id: string): Promise<{ success: boolean; error?: string }> {
  let empleados = await getEmpleados();
  const empleadoToDelete = empleados.find(e => e.id === id);
  const initialLength = empleados.length;
  empleados = empleados.filter(e => e.id !== id);

  if (empleados.length === initialLength) {
    return { success: false, error: `Empleado con ID ${id} no encontrado para eliminar.` };
  }

  if (empleadoToDelete?.contractFileName) {
    try {
      await fs.unlink(path.join(CONTRACTS_DIR, empleadoToDelete.contractFileName));
    } catch (fileError: any) {
      console.warn(`Error deleting contract file ${empleadoToDelete.contractFileName}:`, fileError.message);
    }
  }

  await writeData(EMPLEADOS_FILE, empleados);
  return { success: true };
}

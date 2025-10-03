
'use server';

import type { Empleado, NuevoEmpleadoFormData } from '@/types/empleado';
import { readData, writeData } from '@/lib/data-service';

const EMPLEADOS_FILE = 'empleados.json';

export async function getEmpleados(): Promise<Empleado[]> {
  return readData<Empleado[]>(EMPLEADOS_FILE, []);
}

export async function getEmpleadoById(id: string): Promise<Empleado | null> {
  const empleados = await getEmpleados();
  return empleados.find(e => e.id === id) || null;
}

export async function saveEmpleado(
  empleadoData: NuevoEmpleadoFormData | Empleado
): Promise<{ success: boolean; id?: string; empleado?: Empleado; error?: string }> {
  if (!empleadoData.nombre?.trim()) {
    return { success: false, error: 'El nombre del empleado es obligatorio.' };
  }

  let empleados = await getEmpleados();
  let finalEmpleadoData: Empleado;
  let empleadoId: string;

  if ('id' in empleadoData && empleadoData.id) {
    // Update
    empleadoId = empleadoData.id;
    const index = empleados.findIndex(e => e.id === empleadoId);
    if (index === -1) {
      return { success: false, error: `Empleado con ID ${empleadoId} no encontrado.` };
    }
    const dataToUpdate: Omit<Empleado, 'id'> = {
        nombre: empleadoData.nombre,
        cedula: empleadoData.cedula || '',
        fechaNacimiento: empleadoData.fechaNacimiento || '',
        rolIds: (empleadoData as Empleado).rolIds || [],
    };
    empleados[index] = { ...empleados[index], ...dataToUpdate };
    finalEmpleadoData = empleados[index];
  } else {
    // Create
    const isDuplicate = empleados.some(emp => emp.nombre.trim().toLowerCase() === empleadoData.nombre!.trim().toLowerCase());
    if (isDuplicate) {
        return { success: false, error: `Ya existe un empleado con el nombre "${empleadoData.nombre!.trim()}".` };
    }
    
    empleadoId = `emp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newEmpleadoData = empleadoData as NuevoEmpleadoFormData;
    finalEmpleadoData = {
      id: empleadoId,
      nombre: newEmpleadoData.nombre,
      cedula: newEmpleadoData.cedula || '',
      fechaNacimiento: newEmpleadoData.fechaNacimiento || '',
      rolIds: newEmpleadoData.rolIds || [],
    };
    empleados.push(finalEmpleadoData);
  }
  await writeData(EMPLEADOS_FILE, empleados, (a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  return { success: true, id: empleadoId, empleado: finalEmpleadoData };
}

export async function deleteEmpleado(id: string): Promise<{ success: boolean; error?: string }> {
  let empleados = await getEmpleados();
  const initialLength = empleados.length;
  empleados = empleados.filter(e => e.id !== id);
  if (empleados.length === initialLength) {
    return { success: false, error: `Empleado con ID ${id} no encontrado para eliminar.` };
  }
  await writeData(EMPLEADOS_FILE, empleados);
  return { success: true };
}

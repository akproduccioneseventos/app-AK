
'use server';

import type { Empleado, NuevoEmpleadoFormData } from '@/types/empleado';
import fs from 'fs/promises';
import path from 'path';

const dataDirectory = path.join(process.cwd(), 'src', 'data');
const empleadosFilePath = path.join(dataDirectory, 'empleados.json');

const initialMockEmpleadosDatabase: Empleado[] = []; // No mock data

async function ensureDataDirectoryExists(): Promise<void> {
  try {
    await fs.mkdir(dataDirectory, { recursive: true });
  } catch (error) {
    console.error('Error creando el directorio de datos para empleados:', error);
  }
}

async function readEmpleadosFile(): Promise<Empleado[]> {
  await ensureDataDirectoryExists();
  try {
    const fileContent = await fs.readFile(empleadosFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return Array.isArray(data) ? data : [...initialMockEmpleadosDatabase];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await writeEmpleadosFile([...initialMockEmpleadosDatabase]);
      return [...initialMockEmpleadosDatabase];
    }
    console.error('Error leyendo el archivo de empleados, usando datos iniciales (vacíos):', error);
    return [...initialMockEmpleadosDatabase];
  }
}

async function writeEmpleadosFile(data: Empleado[]): Promise<void> {
  await ensureDataDirectoryExists();
  try {
    await fs.writeFile(empleadosFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error escribiendo en el archivo de empleados:', error);
  }
}

export async function getEmpleados(): Promise<Empleado[]> {
  const empleados = await readEmpleadosFile();
  // Ordenar por nombre
  return empleados.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function getEmpleadoById(id: string): Promise<Empleado | null> {
  const empleados = await readEmpleadosFile();
  const empleado = empleados.find(e => e.id === id);
  return empleado ? JSON.parse(JSON.stringify(empleado)) : null;
}

export async function saveEmpleado(
  empleadoData: NuevoEmpleadoFormData | Empleado 
): Promise<{ success: boolean; id?: string; empleado?: Empleado; error?: string }> {
  let empleados = await readEmpleadosFile();
  
  if ('id' in empleadoData && empleadoData.id) {
    // Actualizar empleado existente
    const index = empleados.findIndex(e => e.id === empleadoData.id);
    if (index !== -1) {
      // Cuando se actualiza, se espera el tipo Empleado completo
      empleados[index] = { 
        ...empleados[index], 
        ...(empleadoData as Empleado), // Cast to full Empleado for update
      };
      await writeEmpleadosFile(empleados);
      return { success: true, id: empleadoData.id, empleado: JSON.parse(JSON.stringify(empleados[index])) };
    } else {
      // Si se intenta actualizar un ID que no existe, se crea como nuevo (debería ser raro)
      const nuevoDesdeUpdate: Empleado = {
        id: `emp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        nombre: empleadoData.nombre,
        cedula: (empleadoData as Empleado).cedula, // cedula is now part of Empleado
        fechaNacimiento: (empleadoData as Empleado).fechaNacimiento, // fechaNacimiento is now part of Empleado
        rolId: (empleadoData as Empleado).rolId, // rolId is now part of Empleado
      };
      empleados.push(nuevoDesdeUpdate);
      await writeEmpleadosFile(empleados);
      return { success: true, id: nuevoDesdeUpdate.id, empleado: JSON.parse(JSON.stringify(nuevoDesdeUpdate)) };
    }
  } else {
    // Crear nuevo empleado (usa NuevoEmpleadoFormData)
    const nuevoEmpleado: Empleado = {
      id: `emp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      nombre: empleadoData.nombre,
      cedula: (empleadoData as NuevoEmpleadoFormData).cedula,
      fechaNacimiento: (empleadoData as NuevoEmpleadoFormData).fechaNacimiento,
      // rolId se asignará después
    };
    empleados.push(nuevoEmpleado);
    await writeEmpleadosFile(empleados);
    return { success: true, id: nuevoEmpleado.id, empleado: JSON.parse(JSON.stringify(nuevoEmpleado)) };
  }
}

export async function deleteEmpleado(id: string): Promise<{ success: boolean; error?: string }> {
  let empleados = await readEmpleadosFile();
  const initialLength = empleados.length;
  empleados = empleados.filter(e => e.id !== id);
  
  if (empleados.length < initialLength) {
    await writeEmpleadosFile(empleados);
    return { success: true };
  } else {
    return { success: false, error: `Empleado con ID ${id} no encontrado para eliminar.` };
  }
}

async function initializeEmpleadosData() {
  await ensureDataDirectoryExists();
  try {
    await fs.access(empleadosFilePath);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('Archivo empleados.json no encontrado, creando con datos iniciales (vacíos)...');
      await writeEmpleadosFile([...initialMockEmpleadosDatabase]);
    }
  }
}

initializeEmpleadosData();

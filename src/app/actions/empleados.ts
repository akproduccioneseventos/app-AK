
'use server';

import type { Empleado, NuevoEmpleadoFormData } from '@/types/empleado';
import fs from 'fs/promises';
import path from 'path';

const dataDirectory = path.join(process.cwd(), 'src', 'data');
const empleadosFilePath = path.join(dataDirectory, 'empleados.json');

// Datos iniciales si el archivo no existe o está vacío
const initialMockEmpleadosDatabase: Empleado[] = [
  { id: 'emp_1', nombre: 'Eduardo', rol: 'Mozo', sueldoBase: 2100 },
  { id: 'emp_2', nombre: 'Ari Beraca', rol: 'Cocina', sueldoBase: 1700 },
  { id: 'emp_3', nombre: 'Alex', rol: 'Cocina y Utileria', sueldoBase: 2700 },
  { id: 'emp_4', nombre: 'Jonathan', rol: 'Cocina y Utileria', sueldoBase: 2700 },
  { id: 'emp_5', nombre: 'Matias', rol: 'Cocina y Utileria', sueldoBase: 2600 },
  { id: 'emp_6', nombre: 'Facundo Beraca', rol: 'Mozo', sueldoBase: 2100 },
  { id: 'emp_7', nombre: 'Ricardo Bairabar', rol: 'Mozo', sueldoBase: 2100 },
  { id: 'emp_8', nombre: 'Yusara', rol: 'Mozo', sueldoBase: 2100 },
  { id: 'emp_9', nombre: 'Pablo', rol: 'Fotografo', sueldoBase: 3800 },
  { id: 'emp_10', nombre: 'Gonza', rol: 'DJ', sueldoBase: 3000 },
  { id: 'emp_11', nombre: 'Juan (Barman)', rol: 'Barman', sueldoBase: 1800 },
  { id: 'emp_12', nombre: 'Pedro (Ayud. Barman)', rol: 'Ayudante de Barman', sueldoBase: 1700 },
];

async function ensureDataDirectoryExists(): Promise<void> {
  try {
    await fs.mkdir(dataDirectory, { recursive: true });
  } catch (error) {
    console.error('Error creando el directorio de datos:', error);
    // No relanzamos el error para permitir que la app continúe con datos en memoria si es necesario
  }
}

async function readEmpleadosFile(): Promise<Empleado[]> {
  await ensureDataDirectoryExists();
  try {
    const fileContent = await fs.readFile(empleadosFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return Array.isArray(data) ? data : initialMockEmpleadosDatabase;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Si el archivo no existe, lo creamos con los datos iniciales
      await writeEmpleadosFile(initialMockEmpleadosDatabase);
      return [...initialMockEmpleadosDatabase];
    }
    console.error('Error leyendo el archivo de empleados, usando datos iniciales:', error);
    // Devolver datos iniciales en caso de otro tipo de error de lectura/parseo
    return [...initialMockEmpleadosDatabase];
  }
}

async function writeEmpleadosFile(data: Empleado[]): Promise<void> {
  await ensureDataDirectoryExists();
  try {
    await fs.writeFile(empleadosFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error escribiendo en el archivo de empleados:', error);
    // Considerar cómo manejar errores de escritura. Por ahora, solo log.
  }
}

export async function getEmpleados(): Promise<Empleado[]> {
  const empleados = await readEmpleadosFile();
  // Ordenar por rol (cargo) y luego por nombre
  return empleados.sort((a, b) => {
    const rolComparison = a.rol.localeCompare(b.rol);
    if (rolComparison !== 0) {
      return rolComparison;
    }
    return a.nombre.localeCompare(b.nombre);
  });
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
      empleados[index] = { 
        ...empleados[index], 
        ...empleadoData, 
      };
      await writeEmpleadosFile(empleados);
      return { success: true, id: empleadoData.id, empleado: JSON.parse(JSON.stringify(empleados[index])) };
    } else {
      return { success: false, error: `Empleado con ID ${empleadoData.id} no encontrado para actualizar.` };
    }
  } else {
    // Crear nuevo empleado
    const nuevoEmpleado: Empleado = {
      ...empleadoData,
      id: `emp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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


'use server';

import type { Empleado, NuevoEmpleadoFormData } from '@/types/empleado';
import fs from 'fs/promises';
import path from 'path';

const dataDirectory = path.join(process.cwd(), 'src', 'data');
const empleadosFilePath = path.join(dataDirectory, 'empleados.json');

// Datos iniciales ahora vacíos. Los empleados se agregarán a través de la UI.
const initialMockEmpleadosDatabase: Empleado[] = [];

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
    // Si el archivo existe pero está vacío o no es un array, usa initialMock (que ahora es vacío)
    return Array.isArray(data) && data.length > 0 ? data : [...initialMockEmpleadosDatabase];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Si el archivo no existe, lo creamos con los datos iniciales (vacío)
      await writeEmpleadosFile([...initialMockEmpleadosDatabase]);
      return [...initialMockEmpleadosDatabase];
    }
    console.error('Error leyendo el archivo de empleados, usando datos iniciales (vacíos):', error);
    // Devolver datos iniciales (vacíos) en caso de otro tipo de error de lectura/parseo
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
      // Si se intenta actualizar un ID que no existe, lo creamos como nuevo.
      // Esto puede pasar si el archivo json se borró o corrompió.
      const nuevoEmpleadoDesdeUpdate: Empleado = {
        ...(empleadoData as Empleado), // Asumimos que si tiene ID, tiene todos los campos de Empleado
        id: `emp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, // Generar nuevo ID único
      };
      empleados.push(nuevoEmpleadoDesdeUpdate);
      await writeEmpleadosFile(empleados);
      return { success: true, id: nuevoEmpleadoDesdeUpdate.id, empleado: JSON.parse(JSON.stringify(nuevoEmpleadoDesdeUpdate)) };
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

// Asegurarse de que el archivo exista al iniciar, con un array vacío si es necesario.
async function initializeEmpleadosData() {
  await ensureDataDirectoryExists();
  try {
    await fs.access(empleadosFilePath);
    // Si el archivo existe, no hacemos nada con initialMockEmpleadosDatabase,
    // ya que readEmpleadosFile se encargará de leerlo o devolver un array vacío.
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('Archivo empleados.json no encontrado, creando con datos iniciales (vacíos)...');
      await writeEmpleadosFile([...initialMockEmpleadosDatabase]); // Escribe array vacío
    }
  }
}

initializeEmpleadosData();

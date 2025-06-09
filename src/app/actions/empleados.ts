
'use server';

import type { Empleado, NuevoEmpleadoFormData } from '@/types/empleado';

// --- SIMULACIÓN DE BASE DE DATOS EN MEMORIA ---
let mockEmpleadosDatabase: Empleado[] = [
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
  { id: 'emp_11', nombre: 'Juan (Barman)', rol: 'Barman', sueldoBase: 1800 }, // Asumiendo un nombre para el Barman
  { id: 'emp_12', nombre: 'Pedro (Ayud. Barman)', rol: 'Ayudante de Barman', sueldoBase: 1700 }, // Asumiendo un nombre
];
// --- FIN SIMULACIÓN BASE DE DATOS ---

export async function getEmpleados(): Promise<Empleado[]> {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simular delay
  return JSON.parse(JSON.stringify(mockEmpleadosDatabase.sort((a, b) => a.nombre.localeCompare(b.nombre))));
}

export async function getEmpleadoById(id: string): Promise<Empleado | null> {
  await new Promise(resolve => setTimeout(resolve, 200));
  const empleado = mockEmpleadosDatabase.find(e => e.id === id);
  return empleado ? JSON.parse(JSON.stringify(empleado)) : null;
}

export async function saveEmpleado(
  empleadoData: NuevoEmpleadoFormData | Empleado
): Promise<{ success: boolean; id?: string; empleado?: Empleado; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 700));

  if ('id' in empleadoData && empleadoData.id) {
    // Actualizar empleado existente
    const index = mockEmpleadosDatabase.findIndex(e => e.id === empleadoData.id);
    if (index !== -1) {
      mockEmpleadosDatabase[index] = { 
        ...mockEmpleadosDatabase[index], 
        ...empleadoData, 
      };
      return { success: true, id: empleadoData.id, empleado: JSON.parse(JSON.stringify(mockEmpleadosDatabase[index])) };
    } else {
      return { success: false, error: `Empleado con ID ${empleadoData.id} no encontrado para actualizar.` };
    }
  } else {
    // Crear nuevo empleado
    const nuevoEmpleado: Empleado = {
      ...empleadoData,
      id: `emp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    mockEmpleadosDatabase.push(nuevoEmpleado);
    return { success: true, id: nuevoEmpleado.id, empleado: JSON.parse(JSON.stringify(nuevoEmpleado)) };
  }
}

export async function deleteEmpleado(id: string): Promise<{ success: boolean; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const initialLength = mockEmpleadosDatabase.length;
  mockEmpleadosDatabase = mockEmpleadosDatabase.filter(e => e.id !== id);
  
  if (mockEmpleadosDatabase.length < initialLength) {
    return { success: true };
  } else {
    return { success: false, error: `Empleado con ID ${id} no encontrado para eliminar.` };
  }
}

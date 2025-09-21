
'use server';

import { readData, writeData } from '@/lib/data-service';
import type { Rol, NuevoRolFormData } from '@/types/rol';

const ROLES_FILE = 'roles.json';

export async function getRoles(): Promise<Rol[]> {
  return readData<Rol[]>(ROLES_FILE, []);
}

export async function getRolById(id: string): Promise<Rol | null> {
  const roles = await getRoles();
  return roles.find(r => r.id === id) || null;
}

export async function saveRol(
  rolData: Rol | NuevoRolFormData
): Promise<{ success: boolean; id?: string; rol?: Rol; error?: string }> {
  if (!rolData.nombre?.trim()) {
    return { success: false, error: "El nombre del rol es obligatorio." };
  }
  if (!rolData.categoriaServicio?.trim()) {
    return { success: false, error: "La categoría del servicio es obligatoria." };
  }
  const sueldoNum = Number(rolData.sueldoPorEvento);
  if (isNaN(sueldoNum) || sueldoNum < 0) {
    return { success: false, error: "El sueldo por evento debe ser un número positivo." };
  }
  
  const roles = await getRoles();
  let savedRol: Rol;

  const costoAportes = (sueldoNum * (Number(rolData.porcentajeAportesPatronales) || 0)) / 100;
  
  const rolToProcess: Omit<Rol, 'id'> = {
    nombre: rolData.nombre.trim(),
    categoriaServicio: rolData.categoriaServicio,
    sueldoPorEvento: sueldoNum,
    porcentajeSalarioVacacional: Number(rolData.porcentajeSalarioVacacional) || 0,
    porcentajeAguinaldo: Number(rolData.porcentajeAguinaldo) || 0,
    porcentajeAportesPatronales: Number(rolData.porcentajeAportesPatronales) || 0,
    costoAportesCalculado: costoAportes,
  };

  if ('id' in rolData && rolData.id) {
    // Update
    const index = roles.findIndex(r => r.id === rolData.id);
    if (index === -1) {
      return { success: false, error: `Rol con ID ${rolData.id} no encontrado para actualizar.` };
    }
    savedRol = { ...roles[index], ...rolToProcess };
    roles[index] = savedRol;
  } else {
    // Create
    const newRolId = `rol_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    savedRol = { ...rolToProcess, id: newRolId };
    roles.push(savedRol);
  }
  
  await writeData(ROLES_FILE, roles, (a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  return { success: true, id: savedRol.id, rol: savedRol };
}

export async function deleteRol(id: string): Promise<{ success: boolean; error?: string }> {
  let roles = await getRoles();
  const initialLength = roles.length;
  roles = roles.filter(r => r.id !== id);

  if (roles.length === initialLength) {
    return { success: false, error: `Rol ID ${id} no encontrado para eliminar.` };
  }
  
  await writeData(ROLES_FILE, roles);
  return { success: true };
}

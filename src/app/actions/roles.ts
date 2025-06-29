
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { Rol, NuevoRolFormData } from '@/types/rol';
import type { CategoriaServicio } from '@/types/empresa';

const dataDirectory = path.join(process.cwd(), 'src', 'data');
const rolesFilePath = path.join(dataDirectory, 'roles.json');

async function ensureDataDirectoryExists() {
  try {
    await fs.access(dataDirectory);
  } catch {
    await fs.mkdir(dataDirectory, { recursive: true });
  }
}

async function readRolesFile(): Promise<Rol[]> {
  try {
    await ensureDataDirectoryExists();
    await fs.access(rolesFilePath);
    const fileContent = await fs.readFile(rolesFilePath, 'utf-8');
    if (fileContent.trim() === '') return [];
    return JSON.parse(fileContent) as Rol[];
  } catch (error) {
    return [];
  }
}

async function writeRolesFile(data: Rol[]): Promise<void> {
  try {
    await ensureDataDirectoryExists();
    const sortedData = data.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    await fs.writeFile(rolesFilePath, JSON.stringify(sortedData, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing roles JSON file:', error);
  }
}

async function initializeLocalRolesFile() {
  try {
    await ensureDataDirectoryExists();
    await fs.access(rolesFilePath);
    const fileContent = await fs.readFile(rolesFilePath, 'utf-8');
    if (fileContent.trim() === '') {
      await writeRolesFile([]);
    }
  } catch (error) { 
    await writeRolesFile([]);
  }
}
initializeLocalRolesFile();


export async function getRoles(): Promise<Rol[]> {
  return readRolesFile();
}

export async function getRolById(id: string): Promise<Rol | null> {
  const localRoles = await readRolesFile();
  return localRoles.find(r => r.id === id) || null;
}

export async function saveRol(
  rolData: Rol | NuevoRolFormData
): Promise<{ success: boolean; id?: string; rol?: Rol; error?: string }> {
  // Validaciones básicas
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
  
  const localRoles = await readRolesFile();
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
    const index = localRoles.findIndex(r => r.id === rolData.id);
    if (index === -1) {
      return { success: false, error: `Rol con ID ${rolData.id} no encontrado para actualizar.` };
    }
    savedRol = { ...localRoles[index], ...rolToProcess };
    localRoles[index] = savedRol;
  } else {
    // Create
    const newRolId = `rol_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    savedRol = { ...rolToProcess, id: newRolId };
    localRoles.push(savedRol);
  }
  
  await writeRolesFile(localRoles);
  return { success: true, id: savedRol.id, rol: savedRol };
}

export async function deleteRol(id: string): Promise<{ success: boolean; error?: string }> {
  let localRoles = await readRolesFile();
  const initialLength = localRoles.length;
  localRoles = localRoles.filter(r => r.id !== id);

  if (localRoles.length === initialLength) {
    return { success: false, error: `Rol ID ${id} no encontrado en JSON local para eliminar.` };
  }
  
  await writeRolesFile(localRoles);
  return { success: true };
}

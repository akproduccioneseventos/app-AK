
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { Rol, NuevoRolFormData } from '@/types/rol';

const DEFAULT_APORTES_PERCENTAGE = 30;

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
    // Asegurarse de que los roles leídos no tengan 'notas' si se eliminó del tipo
    return (JSON.parse(fileContent) as any[]).map(r => {
      const { notas, ...rest } = r; // Eliminar 'notas' si existe
      return rest as Rol;
    });
  } catch (error) {
    return [];
  }
}

async function writeRolesFile(data: Rol[]): Promise<void> {
  try {
    await ensureDataDirectoryExists();
    const sortedData = data.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    // Asegurarse de que los roles guardados no tengan 'notas'
    const dataWithoutNotas = sortedData.map(r => {
      const { notas, ...rest } = r as any; // Castear a any para acceder a notas si aún existe
      return rest;
    });
    await fs.writeFile(rolesFilePath, JSON.stringify(dataWithoutNotas, null, 2), 'utf-8');
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
    } else {
      // Aplicar limpieza de 'notas' al inicializar si es necesario
      const roles = await readRolesFile();
      await writeRolesFile(roles); 
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
  rolData: Omit<NuevoRolFormData, 'notas'> | Omit<Rol, 'notas'> // Tipos actualizados
): Promise<{ success: boolean; id?: string; rol?: Rol; error?: string }> {
  let rolToProcess: Partial<Rol> = { 
    ...rolData,
    tipoSalario: 'Por evento', 
  };
  // Eliminar 'notas' explícitamente si llegara a estar en rolData
  delete (rolToProcess as any).notas;


  const montoSalarioNum = Number(rolToProcess.montoSalario);
  const porcentajeAportesNum = Number(rolToProcess.porcentajeAportes);

  if (rolToProcess.montoSalario !== undefined && !isNaN(montoSalarioNum) && montoSalarioNum >= 0) {
    if (!isNaN(porcentajeAportesNum) && porcentajeAportesNum >= 0 && porcentajeAportesNum <= 100) {
      rolToProcess.aportesCalculados = (montoSalarioNum * porcentajeAportesNum) / 100;
    } else {
      rolToProcess.porcentajeAportes = DEFAULT_APORTES_PERCENTAGE;
      rolToProcess.aportesCalculados = (montoSalarioNum * DEFAULT_APORTES_PERCENTAGE) / 100;
    }
  } else {
    rolToProcess.montoSalario = undefined;
    rolToProcess.porcentajeAportes = undefined;
    rolToProcess.aportesCalculados = undefined;
  }
  
  const localRoles = await readRolesFile();
  let savedRol: Rol;

  if ('id' in rolData && rolData.id) {
    const index = localRoles.findIndex(r => r.id === rolData.id);
    if (index === -1) {
      return { success: false, error: `Rol con ID ${rolData.id} no encontrado para actualizar.` };
    }
    savedRol = { ...localRoles[index], ...rolToProcess } as Rol;
    localRoles[index] = savedRol;
  } else {
    const newRolId = `rol_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    savedRol = { ...(rolToProcess as Omit<NuevoRolFormData, 'notas'>), id: newRolId } as Rol;
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

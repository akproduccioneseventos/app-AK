
'use server';

import type { Rol, NuevoRolFormData } from '@/types/rol';
import fs from 'fs/promises';
import path from 'path';

const dataDirectory = path.join(process.cwd(), 'src', 'data');
const rolesFilePath = path.join(dataDirectory, 'roles.json');

async function ensureDataDirectoryExists(): Promise<void> {
  try {
    await fs.mkdir(dataDirectory, { recursive: true });
  } catch (error) {
    console.error('Error creando el directorio de datos para roles:', error);
  }
}

async function readRolesFile(): Promise<Rol[]> {
  await ensureDataDirectoryExists();
  try {
    const fileContent = await fs.readFile(rolesFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await writeRolesFile([]);
      return [];
    }
    console.error('Error leyendo el archivo de roles, devolviendo array vacío:', error);
    return [];
  }
}

async function writeRolesFile(data: Rol[]): Promise<void> {
  await ensureDataDirectoryExists();
  try {
    await fs.writeFile(rolesFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error escribiendo en el archivo de roles:', error);
  }
}

export async function getRoles(): Promise<Rol[]> {
  const roles = await readRolesFile();
  return roles.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function getRolById(id: string): Promise<Rol | null> {
  const roles = await readRolesFile();
  const rol = roles.find(r => r.id === id);
  return rol ? JSON.parse(JSON.stringify(rol)) : null;
}

export async function saveRol(
  rolData: NuevoRolFormData | Rol
): Promise<{ success: boolean; id?: string; rol?: Rol; error?: string }> {
  let roles = await readRolesFile();
  
  if ('id' in rolData && rolData.id) {
    // Actualizar rol existente
    const index = roles.findIndex(r => r.id === rolData.id);
    if (index !== -1) {
      roles[index] = { ...roles[index], ...rolData };
      if (roles[index].tipoSalario === 'fijo' && typeof roles[index].montoSalario === 'number' && (roles[index].montoSalario as number) >= 0) {
        roles[index].aportesCalculados = (roles[index].montoSalario as number) * 0.30;
      } else {
        delete roles[index].montoSalario;
        delete roles[index].aportesCalculados;
      }
      await writeRolesFile(roles);
      return { success: true, id: rolData.id, rol: JSON.parse(JSON.stringify(roles[index])) };
    } else {
      return { success: false, error: `Rol con ID ${rolData.id} no encontrado para actualizar.` };
    }
  } else {
    // Crear nuevo rol
    const nuevoRol: Rol = {
      ...rolData,
      id: `rol_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    if (nuevoRol.tipoSalario === 'fijo' && typeof nuevoRol.montoSalario === 'number' && nuevoRol.montoSalario >= 0) {
      nuevoRol.aportesCalculados = nuevoRol.montoSalario * 0.30;
    } else {
      delete nuevoRol.montoSalario; // Eliminar monto si es variable o inválido
      delete nuevoRol.aportesCalculados;
    }
    roles.push(nuevoRol);
    await writeRolesFile(roles);
    return { success: true, id: nuevoRol.id, rol: JSON.parse(JSON.stringify(nuevoRol)) };
  }
}

export async function deleteRol(id: string): Promise<{ success: boolean; error?: string }> {
  let roles = await readRolesFile();
  const initialLength = roles.length;
  roles = roles.filter(r => r.id !== id);
  
  if (roles.length < initialLength) {
    await writeRolesFile(roles);
    // TODO: Considerar qué hacer con empleados que tenían este rol asignado.
    // Por ahora, simplemente se elimina el rol. El rolId en el empleado quedará "huérfano".
    return { success: true };
  } else {
    return { success: false, error: `Rol con ID ${id} no encontrado para eliminar.` };
  }
}

async function initializeRolesData() {
  await ensureDataDirectoryExists();
  try {
    await fs.access(rolesFilePath);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('Archivo roles.json no encontrado, creando archivo vacío...');
      await writeRolesFile([]);
    }
  }
}

initializeRolesData();

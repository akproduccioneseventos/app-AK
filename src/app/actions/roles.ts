
'use server';

// Firebase Firestore (Commented out)
// import { dbAdmin as db } from '@/lib/firebase/server';
// const ROLES_COLLECTION = 'roles';

import fs from 'fs/promises';
import path from 'path';
import type { Rol, NuevoRolFormData } from '@/types/rol';

const DEFAULT_APORTES_PERCENTAGE = 30;

// JSON Logic (Now Primary)
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
    } else {
      JSON.parse(fileContent); 
    }
  } catch (error) { 
    await writeRolesFile([]);
  }
}
initializeLocalRolesFile();


export async function getRoles(): Promise<Rol[]> {
  // console.log("Firebase is disabled. Reading roles from JSON.");
  return readRolesFile();
}

export async function getRolById(id: string): Promise<Rol | null> {
  // console.log(`Firebase is disabled. Reading rol ${id} from JSON.`);
  const localRoles = await readRolesFile();
  return localRoles.find(r => r.id === id) || null;
}

export async function saveRol(
  rolData: NuevoRolFormData | Rol
): Promise<{ success: boolean; id?: string; rol?: Rol; error?: string }> {
  let rolToProcess: Partial<Rol> = { 
    ...rolData,
    tipoSalario: 'Por evento', 
  };

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
    savedRol = { ...(rolToProcess as NuevoRolFormData), id: newRolId } as Rol;
    localRoles.push(savedRol);
  }
  
  // // Firestore operation (Commented out)
  // // if (!db) { // db would be null now
  // //   console.warn("Firestore no está inicializado. Guardando rol solo en JSON local.");
  // // } else {
  // //   try {
  // //     const firestoreRolData = { ...savedRol }; // Clone to avoid modifying original for JSON
  // //     if ('id' in rolData && rolData.id) {
  // //       await db.collection(ROLES_COLLECTION).doc(savedRol.id).set(firestoreRolData, { merge: true });
  // //     } else {
  // //       await db.collection(ROLES_COLLECTION).doc(savedRol.id).set(firestoreRolData);
  // //     }
  // //   } catch (dbError: any) {
  // //     console.error(`Firestore saveRol failed for ID ${savedRol.id}, but JSON backup will be attempted:`, dbError);
  // //     // Optionally, decide if this should be a hard failure or just a warning
  // //     // For now, we proceed to save to JSON as a backup.
  // //   }
  // // }

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
  
  // // Firestore operation (Commented out)
  // // if (!db) { // db would be null
  // //   console.warn(`Firestore no está inicializado. Eliminando rol ${id} solo de JSON local.`);
  // // } else {
  // //   try {
  // //     const docRef = db.collection(ROLES_COLLECTION).doc(id);
  // //     const doc = await docRef.get();
  // //     if (!doc.exists) {
  // //         console.warn(`Rol ID ${id} no encontrado en Firestore para eliminar, pero se eliminará localmente.`);
  // //     } else {
  // //         await docRef.delete();
  // //     }
  // //   } catch (dbError: any) {
  // //     console.error(`Firestore deleteRol failed for ID ${id}, JSON backup will be updated:`, dbError);
  // //     // Proceed to delete from JSON
  // //   }
  // // }
  
  await writeRolesFile(localRoles);
  return { success: true };
}


'use server';

import { dbAdmin as db } from '@/lib/firebase/server';
import type { Rol, NuevoRolFormData } from '@/types/rol';
import fs from 'fs/promises';
import path from 'path';

const ROLES_COLLECTION = 'roles';

// JSON Backup Logic
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
    if (fileContent.trim() === '') return []; // Handle empty file
    return JSON.parse(fileContent) as Rol[];
  } catch (error) {
    // If file doesn't exist or is invalid, return empty array
    return [];
  }
}

async function writeRolesFile(data: Rol[]): Promise<void> {
  try {
    await ensureDataDirectoryExists();
    await fs.writeFile(rolesFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing roles JSON file:', error);
    // Not throwing here to allow Firestore operation to be the primary success indicator
  }
}

async function initializeLocalRolesFile() {
  try {
    await fs.access(rolesFilePath);
     const fileContent = await fs.readFile(rolesFilePath, 'utf-8');
    if (fileContent.trim() === '') { // If file is empty, initialize with empty array
      await writeRolesFile([]);
    } else {
      JSON.parse(fileContent); // Try to parse to check if it's valid JSON
    }
  } catch (error) { // Covers file not existing or invalid JSON
    await writeRolesFile([]);
  }
}
initializeLocalRolesFile();


// Firestore is the primary source for reads
export async function getRoles(): Promise<Rol[]> {
  if (!db) {
    console.error("Firestore no está inicializado. No se pueden obtener roles.");
    return readRolesFile(); // Fallback to JSON if Firestore is down
  }
  try {
    const snapshot = await db.collection(ROLES_COLLECTION).orderBy('nombre').get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rol));
  } catch (error) {
    console.error('Error obteniendo roles de Firestore, intentando leer desde JSON local:', error);
    // Fallback to local JSON if Firestore read fails
    return readRolesFile();
  }
}

export async function getRolById(id: string): Promise<Rol | null> {
  if (!db) {
    console.error("Firestore no está inicializado. Rol no puede ser obtenido.");
    const localRoles = await readRolesFile();
    return localRoles.find(r => r.id === id) || null;
  }
  try {
    const docRef = db.collection(ROLES_COLLECTION).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() } as Rol;
  } catch (error) {
    console.error(`Error obteniendo rol ${id} de Firestore, intentando leer desde JSON local:`, error);
    const localRoles = await readRolesFile();
    return localRoles.find(r => r.id === id) || null;
  }
}

export async function saveRol(
  rolData: NuevoRolFormData | Rol
): Promise<{ success: boolean; id?: string; rol?: Rol; error?: string }> {
  if (!db) {
    return { success: false, error: "La base de datos Firestore no está disponible." };
  }
  
  let rolToProcess: Partial<Rol> = { ...rolData };

  // Calculate aportes if tipoSalario is 'Mensual' and montoSalario is valid
  if (rolToProcess.tipoSalario === 'Mensual' && 
      typeof rolToProcess.montoSalario === 'number' && rolToProcess.montoSalario >= 0) {
    rolToProcess.aportesCalculados = rolToProcess.montoSalario * 0.30; // Fixed 30%
  } else {
    // If not 'Mensual' or montoSalario is invalid, clear salary-related fields
    delete rolToProcess.montoSalario;
    delete rolToProcess.aportesCalculados;
  }

  let savedRolFromFirestore: Rol;

  try {
    // Firestore operation first
    if ('id' in rolData && rolData.id) {
      const rolId = rolData.id;
      const { id, ...dataToUpdate } = rolToProcess as Rol; // Cast to Rol after processing
      await db.collection(ROLES_COLLECTION).doc(rolId).set(dataToUpdate, { merge: true });
      savedRolFromFirestore = { id: rolId, ...dataToUpdate };
    } else {
      const newRolRef = db.collection(ROLES_COLLECTION).doc();
      const newRolId = newRolRef.id;
      const newRolData = { ...rolToProcess, id: newRolId } as Rol; // Add ID before saving
      await newRolRef.set(newRolData);
      savedRolFromFirestore = newRolData;
    }

    // If Firestore succeeds, update JSON backup
    try {
      const localRoles = await readRolesFile();
      const index = localRoles.findIndex(r => r.id === savedRolFromFirestore.id);
      if (index > -1) {
        localRoles[index] = savedRolFromFirestore;
      } else {
        localRoles.push(savedRolFromFirestore);
      }
      await writeRolesFile(localRoles.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '')));
    } catch (jsonError) {
      console.error(`Firestore saveRol successful for ID ${savedRolFromFirestore.id}, but JSON backup failed:`, jsonError);
      // Do not re-throw, Firestore is the source of truth
    }

    return { success: true, id: savedRolFromFirestore.id, rol: savedRolFromFirestore };

  } catch (error: any) {
    console.error('Error guardando rol en Firestore:', error);
    return { success: false, error: error.message || 'No se pudo guardar el rol en Firestore.' };
  }
}

export async function deleteRol(id: string): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: "La base de datos Firestore no está disponible." };
  }
  try {
    // Firestore operation first
    const docRef = db.collection(ROLES_COLLECTION).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
        return { success: false, error: `Rol con ID ${id} no encontrado en Firestore para eliminar.` };
    }
    await docRef.delete();

    // If Firestore succeeds, update JSON backup
    try {
      let localRoles = await readRolesFile();
      const initialLength = localRoles.length;
      localRoles = localRoles.filter(r => r.id !== id);
      if (localRoles.length < initialLength) {
        await writeRolesFile(localRoles);
      } else {
        console.warn(`Rol ID ${id} no encontrado en el archivo JSON local para eliminar, pero eliminado de Firestore.`);
      }
    } catch (jsonError) {
      console.error(`Firestore deleteRol successful for ID ${id}, but JSON backup failed:`, jsonError);
      // Do not re-throw
    }
    return { success: true };
  } catch (error: any) {
    console.error(`Error eliminando rol ${id} de Firestore:`, error);
    return { success: false, error: error.message || 'No se pudo eliminar el rol de Firestore.' };
  }
}

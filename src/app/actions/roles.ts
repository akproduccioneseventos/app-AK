
'use server';

import { dbAdmin as db } from '@/lib/firebase/server';
import type { Rol, NuevoRolFormData } from '@/types/rol';
import fs from 'fs/promises';
import path from 'path';

const ROLES_COLLECTION = 'roles';
const DEFAULT_APORTES_PERCENTAGE = 30;

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
    return [];
  }
}

async function writeRolesFile(data: Rol[]): Promise<void> {
  try {
    await ensureDataDirectoryExists();
    await fs.writeFile(rolesFilePath, JSON.stringify(data.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '')), null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing roles JSON file:', error);
  }
}

async function initializeLocalRolesFile() {
  try {
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
  if (!db) {
    console.warn("Firestore no está inicializado. Leyendo roles desde JSON local como fallback.");
    return readRolesFile();
  }
  try {
    const snapshot = await db.collection(ROLES_COLLECTION).orderBy('nombre').get();
    if (snapshot.empty) {
      return [];
    }
    const rolesFromDb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rol));
    // Opcional: podrías escribir a JSON aquí si quieres que getRoles actualice el backup.
    // await writeRolesFile(rolesFromDb); 
    return rolesFromDb;
  } catch (error) {
    console.error('Error obteniendo roles de Firestore, intentando leer desde JSON local:', error);
    return readRolesFile();
  }
}

export async function getRolById(id: string): Promise<Rol | null> {
  if (!db) {
    console.warn(`Firestore no está inicializado. Intentando leer rol ${id} desde JSON local.`);
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
  
  let rolToProcess: Partial<Rol> = { 
    ...rolData,
    tipoSalario: 'Por evento', // Siempre 'Por evento'
  };

  // Calculate aportes if montoSalario and porcentajeAportes are valid
  const montoSalarioNum = Number(rolToProcess.montoSalario);
  const porcentajeAportesNum = Number(rolToProcess.porcentajeAportes);

  if (!isNaN(montoSalarioNum) && montoSalarioNum >= 0 && 
      !isNaN(porcentajeAportesNum) && porcentajeAportesNum >= 0) {
    rolToProcess.aportesCalculados = (montoSalarioNum * porcentajeAportesNum) / 100;
  } else {
    // If montoSalario or porcentajeAportes are invalid or not provided for 'Por evento', 
    // clear aportesCalculados or handle as needed.
    // For 'Por evento', if montoSalario is not set, aportes should be 0.
    rolToProcess.aportesCalculados = 0;
    if (isNaN(montoSalarioNum) || montoSalarioNum < 0) {
        delete rolToProcess.montoSalario; // Or set to 0
    }
    if (isNaN(porcentajeAportesNum) || porcentajeAportesNum < 0) {
        delete rolToProcess.porcentajeAportes; // Or set to default if desired
    }
  }
  // Ensure porcentajeAportes is stored if provided, or a default if not and montoSalario exists
  if (rolToProcess.montoSalario !== undefined && rolToProcess.porcentajeAportes === undefined) {
    rolToProcess.porcentajeAportes = DEFAULT_APORTES_PERCENTAGE; // Default if not set by user but sueldo is
    if(rolToProcess.montoSalario > 0) { // Recalculate with default percentage
        rolToProcess.aportesCalculados = (rolToProcess.montoSalario * DEFAULT_APORTES_PERCENTAGE) / 100;
    }
  }


  let savedRolFromFirestore: Rol;

  try {
    // Firestore operation first
    if ('id' in rolData && rolData.id) {
      const rolId = rolData.id;
      const { id, ...dataToUpdate } = rolToProcess as Rol; 
      await db.collection(ROLES_COLLECTION).doc(rolId).set(dataToUpdate, { merge: true });
      savedRolFromFirestore = { id: rolId, ...dataToUpdate };
    } else {
      const newRolRef = db.collection(ROLES_COLLECTION).doc();
      const newRolId = newRolRef.id;
      const newRolData = { ...rolToProcess, id: newRolId } as Rol; 
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
      await writeRolesFile(localRoles);
    } catch (jsonError) {
      console.error(`Firestore saveRol successful for ID ${savedRolFromFirestore.id}, but JSON backup failed:`, jsonError);
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
    const docRef = db.collection(ROLES_COLLECTION).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
        return { success: false, error: `Rol con ID ${id} no encontrado en Firestore para eliminar.` };
    }
    await docRef.delete();

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
    }
    return { success: true };
  } catch (error: any) {
    console.error(`Error eliminando rol ${id} de Firestore:`, error);
    return { success: false, error: error.message || 'No se pudo eliminar el rol de Firestore.' };
  }
}

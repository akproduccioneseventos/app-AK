
'use server';

import { dbAdmin as db } from '@/lib/firebase/server';
import type { Rol, NuevoRolFormData } from '@/types/rol';
import fs from 'fs/promises';
import path from 'path';

const ROLES_COLLECTION = 'roles';

// JSON File Storage Constants
const dataDirectory = path.join(process.cwd(), 'src', 'data');
const rolesFilePath = path.join(dataDirectory, 'roles.json');

// Helper Functions for JSON file operations
async function ensureDataDirectoryExists(): Promise<void> {
  try {
    await fs.mkdir(dataDirectory, { recursive: true });
  } catch (error) {
    console.error('Error creando el directorio de datos para roles (JSON):', error);
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
      // File doesn't exist, create it with an empty array
      await writeRolesFile([]);
      return [];
    }
    console.error('Error leyendo el archivo roles.json, devolviendo array vacío:', error);
    return []; // Return empty array on other errors too, to prevent crashes
  }
}

async function writeRolesFile(data: Rol[]): Promise<void> {
  await ensureDataDirectoryExists();
  try {
    await fs.writeFile(rolesFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error escribiendo en el archivo roles.json:', error);
    // Decide if you want to throw, or just log, as Firestore is primary
  }
}


// Firestore (Primary) Operations
export async function getRoles(): Promise<Rol[]> {
  if (!db) {
    console.error("Firestore is not initialized. Roles cannot be fetched.");
    // Fallback to JSON if Firestore isn't available? For now, no.
    return [];
  }
  try {
    const snapshot = await db.collection(ROLES_COLLECTION).orderBy('nombre').get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rol));
  } catch (error) {
    console.error('Error fetching roles from Firestore:', error);
    // Fallback to JSON if Firestore read fails? For now, no.
    throw new Error('No se pudieron cargar los roles desde Firestore.');
  }
}

export async function getRolById(id: string): Promise<Rol | null> {
  if (!db) {
    console.error("Firestore is not initialized. Rol cannot be fetched.");
    return null;
  }
  try {
    const doc = await db.collection(ROLES_COLLECTION).doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() } as Rol;
  } catch (error) {
    console.error(`Error fetching rol ${id} from Firestore:`, error);
    throw new Error('No se pudo obtener el rol desde Firestore.');
  }
}

export async function saveRol(
  rolData: NuevoRolFormData | Rol
): Promise<{ success: boolean; id?: string; rol?: Rol; error?: string }> {
  if (!db) {
    console.error("Firestore is not initialized. Rol cannot be saved.");
    return { success: false, error: "La base de datos Firestore no está disponible." };
  }
  
  let rolToProcess: Omit<Rol, 'id'> & { id?: string } = { ...rolData };

  if (rolToProcess.tipoSalario === 'Mensual' && 
      typeof rolToProcess.montoSalario === 'number' && rolToProcess.montoSalario >= 0 &&
      typeof rolToProcess.porcentajeAportes === 'number' && rolToProcess.porcentajeAportes >= 0) {
    rolToProcess.aportesCalculados = rolToProcess.montoSalario * (rolToProcess.porcentajeAportes / 100);
  } else {
    delete rolToProcess.aportesCalculados;
    if (rolToProcess.tipoSalario !== 'Mensual') {
        delete rolToProcess.montoSalario;
        delete rolToProcess.porcentajeAportes;
    }
  }

  let savedRolFromFirestore: Rol;

  try {
    if ('id' in rolData && rolData.id) {
      // Actualizar rol existente
      const rolId = rolData.id;
      const { id, ...dataToUpdate } = rolToProcess as Rol; 
      await db.collection(ROLES_COLLECTION).doc(rolId).set(dataToUpdate, { merge: true });
      savedRolFromFirestore = { id: rolId, ...dataToUpdate };
    } else {
      // Crear nuevo rol
      const newRolRef = db.collection(ROLES_COLLECTION).doc();
      const newRolId = newRolRef.id;
      const newRolData = { ...rolToProcess } as Omit<Rol, 'id'>;
      await newRolRef.set(newRolData);
      savedRolFromFirestore = { id: newRolId, ...newRolData };
    }

    // Firestore operation successful, now try to update JSON file
    try {
      let rolesFromJson = await readRolesFile();
      if ('id' in rolData && rolData.id) { // Update in JSON
        const index = rolesFromJson.findIndex(r => r.id === rolData.id);
        if (index !== -1) {
          rolesFromJson[index] = { ...savedRolFromFirestore };
        } else {
          rolesFromJson.push({ ...savedRolFromFirestore }); // Add if not found (should not happen if IDs are consistent)
        }
      } else { // Create in JSON
        rolesFromJson.push({ ...savedRolFromFirestore });
      }
      await writeRolesFile(rolesFromJson);
    } catch (jsonError) {
      console.error('Error guardando rol en archivo JSON (Firestore tuvo éxito):', jsonError);
      // No retornamos error aquí, ya que Firestore tuvo éxito.
    }
    return { success: true, id: savedRolFromFirestore.id, rol: savedRolFromFirestore };

  } catch (error: any) {
    console.error('Error saving rol to Firestore:', error);
    return { success: false, error: error.message || 'No se pudo guardar el rol en Firestore.' };
  }
}

export async function deleteRol(id: string): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    console.error("Firestore is not initialized. Rol cannot be deleted.");
    return { success: false, error: "La base de datos Firestore no está disponible." };
  }
  try {
    await db.collection(ROLES_COLLECTION).doc(id).delete();
    
    // Firestore delete successful, now try to update JSON file
    try {
      let rolesFromJson = await readRolesFile();
      rolesFromJson = rolesFromJson.filter(r => r.id !== id);
      await writeRolesFile(rolesFromJson);
    } catch (jsonError) {
      console.error('Error eliminando rol del archivo JSON (Firestore tuvo éxito):', jsonError);
       // No retornamos error aquí.
    }
    return { success: true };

  } catch (error: any) {
    console.error(`Error deleting rol ${id} from Firestore:`, error);
    return { success: false, error: error.message || 'No se pudo eliminar el rol de Firestore.' };
  }
}

// Initialize JSON file if it doesn't exist or is malformed
async function initializeLocalRolesFile() {
  await ensureDataDirectoryExists();
  try {
    // Try reading to ensure it's valid JSON array, or create if not
    await readRolesFile(); 
  } catch (error) {
    console.error("Error crítico inicializando roles.json, intentando crear archivo vacío:", error);
    try {
      await writeRolesFile([]);
    } catch (writeError) {
      console.error("Fallo al crear roles.json vacío durante la inicialización:", writeError);
    }
  }
}

initializeLocalRolesFile();

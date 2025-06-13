
'use server';

import { dbAdmin as db } from '@/lib/firebase/server';
import type { Rol, NuevoRolFormData } from '@/types/rol';

const ROLES_COLLECTION = 'roles';

export async function getRoles(): Promise<Rol[]> {
  if (!db) {
    console.error("Firestore is not initialized. Roles cannot be fetched.");
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
    throw new Error('No se pudieron cargar los roles.');
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
    throw new Error('No se pudo obtener el rol.');
  }
}

export async function saveRol(
  rolData: NuevoRolFormData | Rol
): Promise<{ success: boolean; id?: string; rol?: Rol; error?: string }> {
  if (!db) {
    console.error("Firestore is not initialized. Rol cannot be saved.");
    return { success: false, error: "La base de datos no está disponible." };
  }
  
  let rolToSave: Omit<Rol, 'id'> & { id?: string } = { ...rolData };

  // Calcular aportes y limpiar campos si es necesario
  if (rolToSave.tipoSalario === 'Mensual' && 
      typeof rolToSave.montoSalario === 'number' && rolToSave.montoSalario >= 0 &&
      typeof rolToSave.porcentajeAportes === 'number' && rolToSave.porcentajeAportes >= 0) {
    rolToSave.aportesCalculados = rolToSave.montoSalario * (rolToSave.porcentajeAportes / 100);
  } else {
    delete rolToSave.aportesCalculados;
    if (rolToSave.tipoSalario !== 'Mensual') {
        delete rolToSave.montoSalario;
        delete rolToSave.porcentajeAportes;
    }
  }

  try {
    if ('id' in rolData && rolData.id) {
      // Actualizar rol existente
      const rolId = rolData.id;
      const { id, ...dataToUpdate } = rolToSave as Rol; // Type assertion to ensure id is present
      await db.collection(ROLES_COLLECTION).doc(rolId).set(dataToUpdate, { merge: true });
      return { success: true, id: rolId, rol: { id: rolId, ...dataToUpdate } as Rol };
    } else {
      // Crear nuevo rol
      const newRolRef = db.collection(ROLES_COLLECTION).doc();
      const newRolId = newRolRef.id;
      const newRolData = { ...rolToSave } as Omit<Rol, 'id'>; // Data without id for creation
      await newRolRef.set(newRolData);
      return { success: true, id: newRolId, rol: { id: newRolId, ...newRolData } as Rol };
    }
  } catch (error: any) {
    console.error('Error saving rol to Firestore:', error);
    return { success: false, error: error.message || 'No se pudo guardar el rol.' };
  }
}

export async function deleteRol(id: string): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    console.error("Firestore is not initialized. Rol cannot be deleted.");
    return { success: false, error: "La base de datos no está disponible." };
  }
  try {
    await db.collection(ROLES_COLLECTION).doc(id).delete();
    return { success: true };
  } catch (error: any) {
    console.error(`Error deleting rol ${id} from Firestore:`, error);
    return { success: false, error: error.message || 'No se pudo eliminar el rol.' };
  }
}

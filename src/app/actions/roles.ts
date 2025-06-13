
'use server';

import { dbAdmin as db } from '@/lib/firebase/server';
import type { Rol, NuevoRolFormData } from '@/types/rol';

const ROLES_COLLECTION = 'roles';

export async function getRoles(): Promise<Rol[]> {
  if (!db) {
    console.error("Firestore no está inicializado. No se pueden obtener roles.");
    return [];
  }
  try {
    const snapshot = await db.collection(ROLES_COLLECTION).orderBy('nombre').get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rol));
  } catch (error) {
    console.error('Error obteniendo roles de Firestore:', error);
    throw new Error('No se pudieron cargar los roles desde Firestore.');
  }
}

export async function getRolById(id: string): Promise<Rol | null> {
  if (!db) {
    console.error("Firestore no está inicializado. Rol no puede ser obtenido.");
    return null;
  }
  try {
    const doc = await db.collection(ROLES_COLLECTION).doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() } as Rol;
  } catch (error) {
    console.error(`Error obteniendo rol ${id} de Firestore:`, error);
    throw new Error('No se pudo obtener el rol desde Firestore.');
  }
}

export async function saveRol(
  rolData: NuevoRolFormData | Rol
): Promise<{ success: boolean; id?: string; rol?: Rol; error?: string }> {
  if (!db) {
    console.error("Firestore no está inicializado. Rol no puede ser guardado.");
    return { success: false, error: "La base de datos Firestore no está disponible." };
  }
  
  let rolToProcess: Partial<Rol> = { ...rolData }; // Use Partial<Rol> to allow deletion of fields

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
      const { id, ...dataToUpdate } = rolToProcess as Rol; // Cast to Rol after processing
      await db.collection(ROLES_COLLECTION).doc(rolId).set(dataToUpdate, { merge: true });
      savedRolFromFirestore = { id: rolId, ...dataToUpdate };
    } else {
      // Crear nuevo rol
      const newRolRef = db.collection(ROLES_COLLECTION).doc();
      const newRolId = newRolRef.id;
      const newRolData = { ...rolToProcess } as Omit<Rol, 'id'>; // Cast to Omit<Rol, 'id'>
      await newRolRef.set(newRolData);
      savedRolFromFirestore = { id: newRolId, ...newRolData };
    }
    return { success: true, id: savedRolFromFirestore.id, rol: savedRolFromFirestore };

  } catch (error: any) {
    console.error('Error guardando rol en Firestore:', error);
    return { success: false, error: error.message || 'No se pudo guardar el rol en Firestore.' };
  }
}

export async function deleteRol(id: string): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    console.error("Firestore no está inicializado. Rol no puede ser eliminado.");
    return { success: false, error: "La base de datos Firestore no está disponible." };
  }
  try {
    // First, check if the rol exists to provide a more specific error if not
    const doc = await db.collection(ROLES_COLLECTION).doc(id).get();
    if (!doc.exists) {
        return { success: false, error: `Rol con ID ${id} no encontrado para eliminar.` };
    }
    await db.collection(ROLES_COLLECTION).doc(id).delete();
    return { success: true };
  } catch (error: any) {
    console.error(`Error eliminando rol ${id} de Firestore:`, error);
    return { success: false, error: error.message || 'No se pudo eliminar el rol de Firestore.' };
  }
}

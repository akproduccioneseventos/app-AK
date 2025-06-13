
'use server';

import { dbAdmin as db } from '@/lib/firebase/server';
import type { Empleado, NuevoEmpleadoFormData } from '@/types/empleado';

const EMPLEADOS_COLLECTION = 'empleados';

export async function getEmpleados(): Promise<Empleado[]> {
  if (!db) {
    console.error("Firestore no está inicializado. No se pueden obtener empleados.");
    return [];
  }
  try {
    const snapshot = await db.collection(EMPLEADOS_COLLECTION).orderBy('nombre').get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Empleado));
  } catch (error) {
    console.error('Error obteniendo empleados de Firestore:', error);
    throw new Error('No se pudieron cargar los empleados.');
  }
}

export async function getEmpleadoById(id: string): Promise<Empleado | null> {
  if (!db) {
    console.error("Firestore no está inicializado.");
    return null;
  }
  try {
    const doc = await db.collection(EMPLEADOS_COLLECTION).doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() } as Empleado;
  } catch (error) {
    console.error(`Error obteniendo empleado ${id} de Firestore:`, error);
    throw new Error('No se pudo obtener el empleado.');
  }
}

export async function saveEmpleado(
  empleadoData: NuevoEmpleadoFormData | Empleado
): Promise<{ success: boolean; id?: string; empleado?: Empleado; error?: string }> {
  if (!db) {
    return { success: false, error: "Firestore no está inicializado." };
  }
  try {
    let finalEmpleadoData: Empleado;
    let empleadoId: string;

    if ('id' in empleadoData && empleadoData.id) {
      // Actualizar empleado existente
      empleadoId = empleadoData.id;
      const { id, ...dataToUpdate } = empleadoData;
      await db.collection(EMPLEADOS_COLLECTION).doc(empleadoId).set(dataToUpdate, { merge: true });
      finalEmpleadoData = { id: empleadoId, ...dataToUpdate };
    } else {
      // Crear nuevo empleado
      const newEmpleadoRef = db.collection(EMPLEADOS_COLLECTION).doc();
      empleadoId = newEmpleadoRef.id;
      finalEmpleadoData = {
        id: empleadoId,
        nombre: empleadoData.nombre,
        cedula: (empleadoData as NuevoEmpleadoFormData).cedula,
        fechaNacimiento: (empleadoData as NuevoEmpleadoFormData).fechaNacimiento,
        // rolId se asignará después
      };
      await newEmpleadoRef.set(finalEmpleadoData);
    }
    return { success: true, id: empleadoId, empleado: finalEmpleadoData };
  } catch (error: any) {
    console.error('Error guardando empleado en Firestore:', error);
    return { success: false, error: error.message || 'No se pudo guardar el empleado.' };
  }
}

export async function deleteEmpleado(id: string): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: "Firestore no está inicializado." };
  }
  try {
    const doc = await db.collection(EMPLEADOS_COLLECTION).doc(id).get();
    if (!doc.exists) {
        return { success: false, error: `Empleado con ID ${id} no encontrado para eliminar.` };
    }
    await db.collection(EMPLEADOS_COLLECTION).doc(id).delete();
    return { success: true };
  } catch (error: any) {
    console.error(`Error eliminando empleado ${id} de Firestore:`, error);
    return { success: false, error: error.message || 'No se pudo eliminar el empleado.' };
  }
}

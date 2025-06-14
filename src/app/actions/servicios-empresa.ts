
'use server';

import { dbAdmin as db } from '@/lib/firebase/server';
import type { ServicioEmpresa, CategoriaServicio } from '@/types/empresa';

const SERVICIOS_EMPRESA_COLLECTION = 'servicios_empresa';

export async function getServiciosEmpresa(): Promise<ServicioEmpresa[]> {
  if (!db) {
    console.error("Firestore no está inicializado. No se pueden obtener servicios.");
    return [];
  }
  try {
    const snapshot = await db.collection(SERVICIOS_EMPRESA_COLLECTION).orderBy('categoria').orderBy('nombre').get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServicioEmpresa));
  } catch (error) {
    console.error('Error obteniendo servicios de empresa de Firestore:', error);
    throw new Error('No se pudieron cargar los servicios de la empresa.');
  }
}

export async function getServicioEmpresaById(id: string): Promise<ServicioEmpresa | null> {
  if (!db) {
    console.error("Firestore no está inicializado.");
    return null;
  }
  try {
    const doc = await db.collection(SERVICIOS_EMPRESA_COLLECTION).doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() } as ServicioEmpresa;
  } catch (error) {
    console.error(`Error obteniendo servicio ${id} de Firestore:`, error);
    throw new Error('No se pudo obtener el servicio de la empresa.');
  }
}

export async function saveServicioEmpresa(
  servicioData: Omit<ServicioEmpresa, 'id'> | ServicioEmpresa
): Promise<{ success: boolean; id?: string; servicio?: ServicioEmpresa; error?: string }> {
  if (!db) {
    return { success: false, error: "Firestore no está inicializado." };
  }
  try {
    let finalServicioData: Partial<ServicioEmpresa>; // Use Partial to allow deleting fields
    let servicioId: string;

    const dataWithParsedNumbers: Partial<ServicioEmpresa> = {
      ...servicioData,
      precioVenta: servicioData.precioVenta !== undefined ? Number(servicioData.precioVenta) : undefined,
      costoReal: servicioData.costoReal !== undefined ? Number(servicioData.costoReal) : undefined,
    };
    // Remove fields if NaN or undefined after parsing, so they don't get stored in Firestore
    if (dataWithParsedNumbers.precioVenta === undefined || isNaN(dataWithParsedNumbers.precioVenta)) {
        delete dataWithParsedNumbers.precioVenta;
    }
    if (dataWithParsedNumbers.costoReal === undefined || isNaN(dataWithParsedNumbers.costoReal)) {
        delete dataWithParsedNumbers.costoReal;
    }
    // Ensure 'descripcion' is not part of the payload
    delete (dataWithParsedNumbers as any).descripcion;

    
    // Validar nombre y categoría
    if (!dataWithParsedNumbers.nombre || dataWithParsedNumbers.nombre.trim() === "") {
      return { success: false, error: "El nombre del servicio es obligatorio." };
    }
    if (!dataWithParsedNumbers.categoria) {
      return { success: false, error: "La categoría del servicio es obligatoria." };
    }


    if ('id' in dataWithParsedNumbers && dataWithParsedNumbers.id) {
      // Actualizar servicio existente
      servicioId = dataWithParsedNumbers.id;
      const { id, ...dataToUpdate } = dataWithParsedNumbers;
      await db.collection(SERVICIOS_EMPRESA_COLLECTION).doc(servicioId).set(dataToUpdate, { merge: true });
      finalServicioData = { id: servicioId, ...(dataToUpdate as Omit<ServicioEmpresa, 'id'>) };
    } else {
      // Crear nuevo servicio - Verificar duplicados
      const q = db.collection(SERVICIOS_EMPRESA_COLLECTION)
                  .where('nombre', '==', dataWithParsedNumbers.nombre.trim())
                  .where('categoria', '==', dataWithParsedNumbers.categoria);
      const querySnapshot = await q.get();
      if (!querySnapshot.empty) {
        return { success: false, error: `Ya existe un servicio con el nombre "${dataWithParsedNumbers.nombre.trim()}" en la categoría "${dataWithParsedNumbers.categoria}".` };
      }

      const newServicioRef = db.collection(SERVICIOS_EMPRESA_COLLECTION).doc();
      servicioId = newServicioRef.id;
      finalServicioData = {
        ...(dataWithParsedNumbers as Omit<ServicioEmpresa, 'id'>),
        id: servicioId,
      };
      await newServicioRef.set(finalServicioData);
    }
    return { success: true, id: servicioId, servicio: finalServicioData as ServicioEmpresa };
  } catch (error: any) {
    console.error('Error guardando servicio en Firestore:', error);
    return { success: false, error: error.message || 'No se pudo guardar el servicio.' };
  }
}

export async function deleteServicioEmpresa(id: string): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: "Firestore no está inicializado." };
  }
  try {
     const doc = await db.collection(SERVICIOS_EMPRESA_COLLECTION).doc(id).get();
    if (!doc.exists) {
        return { success: false, error: `Servicio con ID ${id} no encontrado para eliminar.` };
    }
    await db.collection(SERVICIOS_EMPRESA_COLLECTION).doc(id).delete();
    return { success: true };
  } catch (error: any) {
    console.error(`Error eliminando servicio ${id} de Firestore:`, error);
    return { success: false, error: error.message || 'No se pudo eliminar el servicio.' };
  }
}

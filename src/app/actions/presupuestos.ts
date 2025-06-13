
'use server';

import { dbAdmin as db } from '@/lib/firebase/server';
import type { Presupuesto, PlatoPresupuesto, ServicioAdicional } from '@/types/presupuesto';
import type { FullMenu } from '@/types/catering';

const PRESUPUESTOS_COLLECTION = 'presupuestos';
const MENUS_CATERING_COLLECTION = 'menus_catering'; // For getPlatos

// Helper function to generate simple AI hints for images
function generateDataAiHint(name: string): string {
  const commonWords = ['de', 'con', 'y', 'a', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'para', 'por', 'sin', 'sobre', 'tras'];
  const cleanedName = name.toLowerCase()
    .replace(/\((tradicional|gourmet|opción invierno|estimado por persona|lata \d+ml|botella \d+ml|porrón \d+ml|vaso|jarra \d+l)\)/gi, '')
    .replace(/[^\w\s]/gi, '')
    .trim();
  
  const words = cleanedName.split(/\s+/).filter(word => word.length > 2 && !commonWords.includes(word));
  if (words.length === 0) return 'food item';
  if (words.length === 1) return words[0];
  return `${words[0]} ${words[1]}`;
}

export async function getPlatos(): Promise<PlatoPresupuesto[]> {
  if (!db) {
    console.error("Firestore no está inicializado. No se pueden obtener platos.");
    return [{ id: 'fallback_error_firestore', nombre: 'Error: Firestore no disponible', descripcion: 'Contactar soporte', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 0, dataAiHint: "error sign" }];
  }
  try {
    const menusSnapshot = await db.collection(MENUS_CATERING_COLLECTION).get();
    const platosPresupuesto: PlatoPresupuesto[] = [];

    if (menusSnapshot.empty) {
      return []; // O un mensaje indicando que no hay menús/platos definidos
    }

    menusSnapshot.forEach(doc => {
      const menu = doc.data() as FullMenu;
      menu.items.forEach(item => {
        platosPresupuesto.push({
          id: item.id, // El ID del MenuItem (plato) dentro del FullMenu
          nombre: item.name,
          descripcion: item.type || undefined,
          costoPorPersona: item.totalDishCost, // Asumiendo totalDishCost es el costo por persona
          imagenUrl: `https://placehold.co/300x200.png`, // Placeholder, puede ser del item si se añade
          dataAiHint: generateDataAiHint(item.name),
          seleccionado: false, // Por defecto para el UI
        });
      });
    });
    return platosPresupuesto;
  } catch (error) {
    console.error('Error leyendo menús de Firestore para getPlatos:', error);
    return [{ id: 'fallback_error_read', nombre: 'Error al cargar platos', descripcion: 'Contactar soporte', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 0, dataAiHint: "error sign" }];
  }
}

export async function savePresupuesto(presupuestoData: Omit<Presupuesto, 'id' | 'timestamp' | 'estado'>): Promise<{ success: boolean, id?: string, error?: string }> {
  if (!db) {
    return { success: false, error: "Firestore no está inicializado." };
  }
  try {
    const newPresupuestoRef = db.collection(PRESUPUESTOS_COLLECTION).doc();
    const nuevoPresupuesto: Presupuesto = {
      ...presupuestoData,
      id: newPresupuestoRef.id,
      timestamp: new Date().toISOString(),
      estado: 'Borrador'
    };
    await newPresupuestoRef.set(nuevoPresupuesto);
    return { success: true, id: nuevoPresupuesto.id };
  } catch (error: any) {
    console.error('Error guardando presupuesto en Firestore:', error);
    return { success: false, error: error.message || 'No se pudo guardar el presupuesto.' };
  }
}

export async function getPresupuestos(): Promise<Presupuesto[]> {
  if (!db) {
    console.error("Firestore no está inicializado. No se pueden obtener presupuestos.");
    return [];
  }
  try {
    const snapshot = await db.collection(PRESUPUESTOS_COLLECTION).orderBy('timestamp', 'desc').get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Presupuesto));
  } catch (error) {
    console.error('Error obteniendo presupuestos de Firestore:', error);
    throw new Error('No se pudieron cargar los presupuestos.');
  }
}

export async function getPresupuestoById(id: string): Promise<Presupuesto | null> {
  if (!db) {
    console.error("Firestore no está inicializado.");
    return null;
  }
  try {
    const doc = await db.collection(PRESUPUESTOS_COLLECTION).doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() } as Presupuesto;
  } catch (error) {
    console.error(`Error obteniendo presupuesto ${id} de Firestore:`, error);
    throw new Error('No se pudo obtener el presupuesto.');
  }
}

export async function updatePresupuesto(presupuestoData: Presupuesto): Promise<{ success: boolean; presupuesto?: Presupuesto; error?: string }> {
  if (!db) {
    return { success: false, error: "Firestore no está inicializado." };
  }
  try {
    const { id, ...dataToUpdate } = presupuestoData;
    
    // Recalcular costos por si acaso
    const costoSubtotalPlatos = dataToUpdate.platosSeleccionados.reduce((sum, plato) => sum + plato.costoTotalPlato, 0);
    const costoSubtotalServicios = dataToUpdate.serviciosAdicionales.reduce((sum, servicio) => sum + servicio.costoServicio, 0);
    const costoTotalEstimado = costoSubtotalPlatos + costoSubtotalServicios;

    const finalDataToUpdate = {
        ...dataToUpdate,
        costoSubtotalPlatos,
        costoSubtotalServicios,
        costoTotalEstimado,
        timestamp: new Date().toISOString(),
    };
    
    await db.collection(PRESUPUESTOS_COLLECTION).doc(id).set(finalDataToUpdate, { merge: true });
    return { success: true, presupuesto: { id, ...finalDataToUpdate } };
  } catch (error: any) {
    console.error('Error actualizando presupuesto en Firestore:', error);
    return { success: false, error: error.message || 'No se pudo actualizar el presupuesto.' };
  }
}

export async function deletePresupuesto(id: string): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: "Firestore no está inicializado." };
  }
  try {
    const doc = await db.collection(PRESUPUESTOS_COLLECTION).doc(id).get();
    if (!doc.exists) {
        return { success: false, error: `Presupuesto con ID ${id} no encontrado para eliminar.` };
    }
    await db.collection(PRESUPUESTOS_COLLECTION).doc(id).delete();
    return { success: true };
  } catch (error: any) {
    console.error(`Error eliminando presupuesto ${id} de Firestore:`, error);
    return { success: false, error: error.message || 'No se pudo eliminar el presupuesto.' };
  }
}

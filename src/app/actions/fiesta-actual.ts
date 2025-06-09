
'use server';

import type { FiestaEnPlanificacion, ConfigEventoDataStorage, PersonalAsignadoDetalleStorage } from '@/types/fiesta';

// Default data based on "6 de junio" for configuration
const defaultConfiguracion: ConfigEventoDataStorage = {
  nombreEvento: 'Boda Noelia Damaceno',
  tipoCelebracion: 'Boda',
  fechaEvento: new Date(2025, 5, 6).toISOString(), // Month is 0-indexed (June is 5)
  horaInicio: '',
  horaFin: '',
  nombreLugar: 'Bonsai',
  direccionLugar: '',
  invitadosEstimados: 80,
  presupuestoEstimado: 156000,
  notasAdicionales: '',
};

// This will hold the single "fiesta en planificación"
// It's initialized with default configuration and empty personal.
let fiestaActual: FiestaEnPlanificacion = {
  id: 'fiesta-en-curso', // Static ID for the single planned fiesta
  configuracion: { ...defaultConfiguracion },
  personalAsignado: [],
  // Initialize other modules with their defaults later
  // tareas: defaultTareas, // example
};

export async function getFiestaActual(): Promise<FiestaEnPlanificacion> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 50)); // Shorter delay for getters
  // Return a deep copy to prevent direct mutation of the server-side object from client-side cached versions
  return JSON.parse(JSON.stringify(fiestaActual)); 
}

export async function updateConfiguracionFiestaActual(
  configData: ConfigEventoDataStorage
): Promise<{ success: boolean; updatedData?: ConfigEventoDataStorage; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 300));
  try {
    fiestaActual.configuracion = { ...configData };
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.configuracion)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar la configuración." };
  }
}

export async function updatePersonalFiestaActual(
  personalData: PersonalAsignadoDetalleStorage[]
): Promise<{ success: boolean; updatedData?: PersonalAsignadoDetalleStorage[]; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 300));
  try {
    fiestaActual.personalAsignado = [...personalData];
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.personalAsignado)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar el personal." };
  }
}

// Function to reset the current fiesta planning data to defaults
export async function resetFiestaActual(): Promise<{ success: boolean; initialData?: FiestaEnPlanificacion, error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 100));
    try {
        fiestaActual = {
            id: 'fiesta-en-curso',
            configuracion: { ...defaultConfiguracion },
            personalAsignado: [],
            // TODO: Reset other modules like Tareas, Invitados etc. with their defaults when added
        };
        return { success: true, initialData: JSON.parse(JSON.stringify(fiestaActual)) };
    } catch (e: any) {
        return { success: false, error: e.message || "Error al reiniciar la fiesta." };
    }
}

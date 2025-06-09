
'use server';

import type { FiestaEnPlanificacion, ConfigEventoDataStorage, PersonalAsignadoDetalleStorage } from '@/types/fiesta';
import fs from 'fs/promises';
import path from 'path';

const dataDirectory = path.join(process.cwd(), 'src', 'data');
const fiestaActualFilePath = path.join(dataDirectory, 'fiesta-actual.json');

// Default data for configuration (from "6 de junio" example)
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

const initialFiestaActualData: FiestaEnPlanificacion = {
  id: 'fiesta-en-curso', // Static ID for the single planned fiesta
  configuracion: { ...defaultConfiguracion },
  personalAsignado: [],
  menuAsignadoId: undefined,
  presupuestoId: undefined,
  invoiceIds: [],
  // Initialize other modules with their defaults later
  // tareas: defaultTareas, // example
};

async function ensureDataDirectoryExists(): Promise<void> {
  try {
    await fs.mkdir(dataDirectory, { recursive: true });
  } catch (error) {
    console.error('Error creando el directorio de datos para fiesta actual:', error);
  }
}

async function readFiestaActualFile(): Promise<FiestaEnPlanificacion> {
  await ensureDataDirectoryExists();
  try {
    const fileContent = await fs.readFile(fiestaActualFilePath, 'utf-8');
    const data = JSON.parse(fileContent) as FiestaEnPlanificacion;
    // Basic validation to ensure it's somewhat like FiestaEnPlanificacion
    if (data && data.id === 'fiesta-en-curso' && data.configuracion) {
        // Ensure all potential new fields have defaults if missing from old JSON
        const validatedData: FiestaEnPlanificacion = {
            ...initialFiestaActualData, // provides defaults for all fields
            ...data, // overrides defaults with what's in the file
            configuracion: {
                ...initialFiestaActualData.configuracion,
                ...(data.configuracion || {}),
            },
            personalAsignado: data.personalAsignado || [],
            menuAsignadoId: data.menuAsignadoId || undefined,
            presupuestoId: data.presupuestoId || undefined,
            invoiceIds: data.invoiceIds || [],
        };
        return validatedData;
    }
    // If not valid, reset to initial
    await writeFiestaActualFile(initialFiestaActualData);
    return { ...initialFiestaActualData };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await writeFiestaActualFile(initialFiestaActualData);
      return { ...initialFiestaActualData };
    }
    console.error('Error leyendo el archivo de fiesta actual, usando datos iniciales:', error);
    // Attempt to write initial data if file is corrupt
    try {
        await writeFiestaActualFile(initialFiestaActualData);
    } catch (writeError) {
        console.error('Error escribiendo datos iniciales de fiesta actual después de un error de lectura:', writeError);
    }
    return { ...initialFiestaActualData };
  }
}

async function writeFiestaActualFile(data: FiestaEnPlanificacion): Promise<void> {
  await ensureDataDirectoryExists();
  try {
    await fs.writeFile(fiestaActualFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error escribiendo en el archivo de fiesta actual:', error);
  }
}

export async function getFiestaActual(): Promise<FiestaEnPlanificacion> {
  const fiesta = await readFiestaActualFile();
  return JSON.parse(JSON.stringify(fiesta)); // Return a deep copy
}

export async function updateConfiguracionFiestaActual(
  configData: ConfigEventoDataStorage
): Promise<{ success: boolean; updatedData?: ConfigEventoDataStorage; error?: string }> {
  try {
    let fiestaActual = await readFiestaActualFile();
    fiestaActual.configuracion = { ...configData };
    await writeFiestaActualFile(fiestaActual);
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.configuracion)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar la configuración." };
  }
}

export async function updatePersonalFiestaActual(
  personalData: PersonalAsignadoDetalleStorage[]
): Promise<{ success: boolean; updatedData?: PersonalAsignadoDetalleStorage[]; error?: string }> {
  try {
    let fiestaActual = await readFiestaActualFile();
    fiestaActual.personalAsignado = [...personalData];
    await writeFiestaActualFile(fiestaActual);
    return { success: true, updatedData: JSON.parse(JSON.stringify(fiestaActual.personalAsignado)) };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar el personal." };
  }
}

export async function updateMenuAsignadoFiestaActual(
  menuId?: string
): Promise<{ success: boolean; menuId?: string; error?: string }> {
  try {
    let fiestaActual = await readFiestaActualFile();
    fiestaActual.menuAsignadoId = menuId;
    await writeFiestaActualFile(fiestaActual);
    return { success: true, menuId: menuId };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar el menú asignado." };
  }
}

export async function updatePresupuestoAsignadoFiestaActual(
  presupuestoId?: string | null
): Promise<{ success: boolean; presupuestoId?: string | null; error?: string }> {
  try {
    let fiestaActual = await readFiestaActualFile();
    fiestaActual.presupuestoId = presupuestoId === null ? undefined : presupuestoId;
    await writeFiestaActualFile(fiestaActual);
    return { success: true, presupuestoId: fiestaActual.presupuestoId };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al actualizar el presupuesto asignado." };
  }
}

export async function addInvoiceIdToFiestaActual(
  invoiceId: string
): Promise<{ success: boolean; invoiceIds?: string[]; error?: string }> {
  try {
    let fiestaActual = await readFiestaActualFile();
    if (!fiestaActual.invoiceIds) {
      fiestaActual.invoiceIds = [];
    }
    if (!fiestaActual.invoiceIds.includes(invoiceId)) {
      fiestaActual.invoiceIds.push(invoiceId);
      await writeFiestaActualFile(fiestaActual);
    }
    return { success: true, invoiceIds: fiestaActual.invoiceIds };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al añadir ID de factura." };
  }
}

export async function removeInvoiceIdFromFiestaActual(
  invoiceId: string
): Promise<{ success: boolean; invoiceIds?: string[]; error?: string }> {
  try {
    let fiestaActual = await readFiestaActualFile();
    if (fiestaActual.invoiceIds) {
      fiestaActual.invoiceIds = fiestaActual.invoiceIds.filter(id => id !== invoiceId);
      await writeFiestaActualFile(fiestaActual);
    }
    return { success: true, invoiceIds: fiestaActual.invoiceIds || [] };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al quitar ID de factura." };
  }
}

export async function resetFiestaActual(): Promise<{ success: boolean; initialData?: FiestaEnPlanificacion, error?: string }> {
    try {
        // Ensure initial data always includes all fields with their defaults on reset
        const resetData = { ...initialFiestaActualData };
        await writeFiestaActualFile(resetData);
        return { success: true, initialData: JSON.parse(JSON.stringify(resetData)) };
    } catch (e: any) {
        return { success: false, error: e.message || "Error al reiniciar la fiesta." };
    }
}

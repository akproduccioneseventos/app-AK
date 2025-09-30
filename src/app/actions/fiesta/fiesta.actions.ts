
'use server';

import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import { readData, writeData } from '@/lib/data-service';
import path from 'path';
import fs from 'fs/promises';

const FIESTAS_DIR = 'fiestas';
const ARCHIVE_DIR = 'archive';
const FIESTA_ACTUAL_ID = "fiesta_1762181514757"; 
const FIESTA_ACTUAL_FILE_PATH = path.join(FIESTAS_DIR, `${FIESTA_ACTUAL_ID}.json`);
const ARCHIVE_FILE_PATH_PREFIX = 'archive';


async function ensureDirectoryExists(dirPath: string) {
    try { 
        const dataDir = path.join(process.cwd(), 'src', 'data');
        await fs.access(path.join(dataDir, dirPath)); 
    } catch { 
        const dataDir = path.join(process.cwd(), 'src', 'data');
        await fs.mkdir(path.join(dataDir, dirPath), { recursive: true }); 
    }
}
ensureDirectoryExists(FIESTAS_DIR);
ensureDirectoryExists(ARCHIVE_DIR);


export async function getFiestaActual(): Promise<FiestaEnPlanificacion> {
  return readData<FiestaEnPlanificacion>(FIESTA_ACTUAL_FILE_PATH, initialFiestaActualData);
}

export async function getHistorialFiestas(): Promise<FiestaEnPlanificacion[]> {
  const dataDir = path.join(process.cwd(), 'src', 'data', ARCHIVE_DIR);
  try {
    const archiveFiles = await fs.readdir(dataDir);
    const historialesPromises = archiveFiles
        .filter(file => file.endsWith('.json'))
        .map(file => readData<FiestaEnPlanificacion>(path.join(ARCHIVE_DIR, file), null as any));
    
    const historiales = await Promise.all(historialesPromises);

    return historiales.filter((f): f is FiestaEnPlanificacion => f !== null)
      .sort((a, b) => new Date(b.configuracion.fechaEvento || 0).getTime() - new Date(a.configuracion.fechaEvento || 0).getTime());
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []; // No archive directory exists yet.
    }
    console.error("Error leyendo el historial de fiestas:", error);
    return [];
  }
}

export async function getFiestas(includeArchived = true): Promise<FiestaEnPlanificacion[]> {
    const [activas, archivadas] = await Promise.all([
        getActivas(),
        includeArchived ? getHistorialFiestas() : Promise.resolve([])
    ]);
    return [...activas, ...archivadas];
}

async function getActivas(): Promise<FiestaEnPlanificacion[]> {
    const dataDir = path.join(process.cwd(), 'src', 'data', FIESTAS_DIR);
    try {
        const activeFiles = await fs.readdir(dataDir);
        const activasPromises = activeFiles
            .filter(file => file.endsWith('.json'))
            .map(file => readData<FiestaEnPlanificacion>(path.join(FIESTAS_DIR, file), null as any));
        
        const activas = await Promise.all(activasPromises);
        return activas.filter((f): f is FiestaEnPlanificacion => f !== null);

    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return [];
        }
        console.error("Error leyendo fiestas activas:", error);
        return [];
    }
}

export async function getAllFiestas(): Promise<FiestaEnPlanificacion[]> {
  const [activas, archivadas] = await Promise.all([getActivas(), getHistorialFiestas()]);
  return [...activas, ...archivadas];
}


async function updateFiestaData(updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion, fiestaId: string = FIESTA_ACTUAL_ID): Promise<{ success: boolean; updatedData?: FiestaEnPlanificacion; error?: string }> {
  try {
    const targetPath = path.join(FIESTAS_DIR, `${fiestaId}.json`);
    const currentData = await readData<FiestaEnPlanificacion>(targetPath, initialFiestaActualData);
    const updatedData = updateFn(currentData);
    await writeData(targetPath, updatedData);
    return { success: true, updatedData };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}


export async function archiveFiesta(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  if (fiestaId !== FIESTA_ACTUAL_ID) {
    return { success: false, error: "Solo se puede archivar la fiesta activa." };
  }
  
  try {
    const fiestaActual = await getFiestaActual();
    if (!fiestaActual) {
      return { success: false, error: "No hay una fiesta activa para archivar." };
    }
    
    const datePart = fiestaActual.configuracion.fechaEvento ? new Date(fiestaActual.configuracion.fechaEvento).toISOString().split('T')[0] : 'sin-fecha';
    const namePart = fiestaActual.configuracion.nombreEvento.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 20);
    const archiveFilename = `fiesta_archivada_${datePart}_${namePart}_${fiestaActual.id}.json`;
    
    await writeData(path.join(ARCHIVE_FILE_PATH_PREFIX, archiveFilename), fiestaActual);
    await writeData(FIESTA_ACTUAL_FILE_PATH, initialFiestaActualData);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error al archivar la fiesta actual:", error);
    return { success: false, error: "No se pudo archivar la fiesta." };
  }
}

export async function deleteFiestaArchivada(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  const allArchived = await getHistorialFiestas();
  const fiestaToDelete = allArchived.find(f => f.id === fiestaId);
  if (!fiestaToDelete) {
    return { success: false, error: "El evento archivado no fue encontrado." };
  }
  
  const datePart = fiestaToDelete.configuracion.fechaEvento ? new Date(fiestaToDelete.configuracion.fechaEvento).toISOString().split('T')[0] : 'sin-fecha';
  const namePart = fiestaToDelete.configuracion.nombreEvento.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 20);
  const archiveFilename = `fiesta_archivada_${datePart}_${namePart}_${fiestaToDelete.id}.json`;

  try {
    const filePath = path.join(process.cwd(), 'src', 'data', ARCHIVE_DIR, archiveFilename);
    await fs.unlink(filePath);
    return { success: true };
  } catch (error: any) {
     if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // If file doesn't exist, it might be a naming mismatch. Try finding it by ID.
      const files = await fs.readdir(path.join(process.cwd(), 'src', 'data', ARCHIVE_DIR));
      const actualFile = files.find(f => f.includes(fiestaId));
      if (actualFile) {
        try {
          await fs.unlink(path.join(process.cwd(), 'src', 'data', ARCHIVE_DIR, actualFile));
          return { success: true };
        } catch (e: any) {
           console.error(`Error deleting archived fiesta file (fallback) ${actualFile}:`, e);
           return { success: false, error: `No se pudo eliminar el archivo del evento archivado (fallback). Error: ${e.message}` };
        }
      }
      return { success: false, error: "El archivo del evento archivado no fue encontrado para eliminar." };
    }
    console.error(`Error deleting archived fiesta file ${archiveFilename}:`, error);
    return { success: false, error: "No se pudo eliminar el archivo del evento archivado." };
  }
}


export async function resetFiestaActual(): Promise<{ success: boolean; error?: string }> {
    try {
        await writeData(FIESTA_ACTUAL_FILE_PATH, initialFiestaActualData);
        return { success: true };
    } catch(e: any) {
        return { success: false, error: e.message };
    }
}

export async function getFiestaById(fiestaId: string): Promise<FiestaEnPlanificacion | null> {
    const allFiestas = await getAllFiestas();
    return allFiestas.find(f => f.id === fiestaId) || null;
}

export async function saveFiesta(fiestaData: FiestaEnPlanificacion): Promise<{ success: boolean; fiesta?: FiestaEnPlanificacion; error?: string }> {
  try {
    const filePath = path.join(FIESTAS_DIR, `${fiestaData.id}.json`);
    await writeData(filePath, fiestaData);
    return { success: true, fiesta: fiestaData };
  } catch (error: any) {
    console.error("Error saving fiesta:", error);
    return { success: false, error: "No se pudo guardar la fiesta." };
  }
}

export async function createNewFiestaForCustomer(customer: Customer): Promise<{ success: boolean; fiesta?: FiestaEnPlanificacion; error?: string }> {
  const newFiesta: FiestaEnPlanificacion = {
    ...initialFiestaActualData,
    id: `fiesta_${customer.id}`, // Link to customer
    configuracion: {
      ...initialFiestaActualData.configuracion,
      clienteId: customer.id,
      nombreEvento: customer.partyType ? `${customer.partyType} de ${customer.name}` : `Evento de ${customer.name}`,
      fechaEvento: customer.partyDate || new Date().toISOString(),
      invitadosEstimados: customer.guestCount || 50,
      nombreLugar: customer.venueName || 'A definir',
    },
  };
  
  try {
    const filePath = path.join(FIESTAS_DIR, `${newFiesta.id}.json`);
    await writeData(filePath, newFiesta);
    return { success: true, fiesta: newFiesta };
  } catch (error: any) {
    console.error("Error creating new fiesta for customer:", error);
    return { success: false, error: "No se pudo crear la fiesta para el nuevo cliente." };
  }
}

export async function addInvoiceId(invoiceId: string) {
  return updateFiestaData(data => {
    const invoiceIds = Array.from(new Set([...(data.invoiceIds || []), invoiceId]));
    return { ...data, invoiceIds };
  });
}

export async function removeInvoiceId(invoiceId: string) {
  return updateFiestaData(data => {
    const invoiceIds = (data.invoiceIds || []).filter(id => id !== invoiceId);
    return { ...data, invoiceIds };
  });
}

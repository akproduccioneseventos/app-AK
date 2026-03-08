
/**
 * @fileOverview Acciones nucleares para la persistencia de archivos de fiesta.
 */
'use server';

import type { FiestaEnPlanificacion, MenuMesaData, NumerosMesaData } from '@/types/fiesta';
import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import { readData, writeData } from '@/lib/data-service';
import path from 'path';
import fs from 'fs/promises';

const FIESTAS_DIR = 'fiestas';
const ARCHIVE_DIR = 'archive';

// --- ACCIONES DE LECTURA ---

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
    return [];
  }
}

export async function getFiestas(includeArchived = true): Promise<FiestaEnPlanificacion[]> {
    const dataDir = path.join(process.cwd(), 'src', 'data', FIESTAS_DIR);
    try {
        const activeFiles = await fs.readdir(dataDir);
        const activasPromises = activeFiles
            .filter(file => file.endsWith('.json'))
            .map(file => readData<FiestaEnPlanificacion>(path.join(FIESTAS_DIR, file), null as any));
        
        const activas = (await Promise.all(activasPromises)).filter((f): f is FiestaEnPlanificacion => f !== null);
        const archivadas = includeArchived ? await getHistorialFiestas() : [];
        
        const allFiestas = [...activas, ...archivadas];
        return Array.from(new Map(allFiestas.map(item => [item.id, item])).values());
    } catch (error) {
        return [];
    }
}

export async function getFiestaActual(): Promise<FiestaEnPlanificacion> {
    const all = await getFiestas(false);
    if (all.length > 0) {
        return all.sort((a,b) => new Date(b.configuracion.fechaEvento || 0).getTime() - new Date(a.configuracion.fechaEvento || 0).getTime())[0];
    }
    return { ...initialFiestaActualData, id: `fiesta_${Date.now()}`};
}

// --- ACCIONES DE ESCRITURA ---

export async function saveFiesta(fiestaData: FiestaEnPlanificacion): Promise<{ success: boolean; fiesta?: FiestaEnPlanificacion; error?: string }> {
  try {
    const filePath = path.join(FIESTAS_DIR, `${fiestaData.id}.json`);
    await writeData(filePath, fiestaData);
    return { success: true, fiesta: fiestaData };
  } catch (error: any) {
    return { success: false, error: "No se pudo guardar el evento." };
  }
}

export async function getFiestaById(fiestaId: string): Promise<FiestaEnPlanificacion | null> {
    const activePath = path.join(FIESTAS_DIR, `${fiestaId}.json`);
    try {
        const active = await readData<FiestaEnPlanificacion | null>(activePath, null);
        if (active && active.id === fiestaId) return active;
    } catch (e) {}
    const archivadas = await getHistorialFiestas();
    return archivadas.find(f => f.id === fiestaId) || null;
}

export async function deleteFiesta(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  const dataDir = path.join(process.cwd(), 'src', 'data', FIESTAS_DIR);
  try {
    const files = await fs.readdir(dataDir);
    const fileToDelete = files.find(f => f.includes(fiestaId) && f.endsWith('.json'));
    if (fileToDelete) {
        await fs.unlink(path.join(dataDir, fileToDelete));
        return { success: true };
    }
    return { success: false, error: "Archivo no encontrado." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function archiveFiesta(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error("Evento no encontrado.");
    const datePart = fiesta.configuracion.fechaEvento ? new Date(fiesta.configuracion.fechaEvento).toISOString().split('T')[0] : 'sin-fecha';
    const archiveFilename = `fiesta_archivada_${datePart}_${fiesta.id}.json`;
    await writeData(path.join(ARCHIVE_DIR, archiveFilename), fiesta);
    await deleteFiesta(fiestaId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteFiestaArchivada(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  const dataDir = path.join(process.cwd(), 'src', 'data', ARCHIVE_DIR);
  try {
    const files = await fs.readdir(dataDir);
    const fileToDelete = files.find(f => f.includes(fiestaId));
    if (fileToDelete) {
        await fs.unlink(path.join(dataDir, fileToDelete));
        return { success: true };
    }
    return { success: false, error: "Archivo no encontrado." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resetFiestaActual(): Promise<{ success: boolean; error?: string }> {
    try {
        const activas = await getFiestas(false);
        for (const f of activas) { await archiveFiesta(f.id); }
        const newFiesta = { ...initialFiestaActualData, id: `fiesta_${Date.now()}`};
        await saveFiesta(newFiesta);
        return { success: true };
    } catch(e: any) {
        return { success: false, error: e.message };
    }
}

export async function duplicateFiesta(fiestaId: string): Promise<{ success: boolean; newFiestaId?: string; error?: string }> {
  try {
    const original = await getFiestaById(fiestaId);
    if (!original) throw new Error('Evento no encontrado.');
    const newFiesta: FiestaEnPlanificacion = {
      ...original,
      id: `fiesta_copy_${Date.now()}`,
      configuracion: { ...original.configuracion, nombreEvento: `[COPIA] ${original.configuracion.nombreEvento}` },
      presupuestoId: undefined, invoiceIds: [], pagosProveedores: [],
    };
    const result = await saveFiesta(newFiesta);
    return result.success ? { success: true, newFiestaId: newFiesta.id } : { success: false, error: result.error };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addInvoiceId(fiestaId: string, invoiceId: string) {
  const f = await getFiestaById(fiestaId);
  if (!f) return { success: false };
  return await saveFiesta({ ...f, invoiceIds: [...(f.invoiceIds || []), invoiceId] });
}

export async function removeInvoiceId(fiestaId: string, invoiceId: string) {
  const f = await getFiestaById(fiestaId);
  if (!f) return { success: false };
  return await saveFiesta({ ...f, invoiceIds: (f.invoiceIds || []).filter(id => id !== invoiceId) });
}

export async function updateMenuMesa(fiestaId: string, menuData: MenuMesaData) {
  const f = await getFiestaById(fiestaId);
  if (!f) return { success: false };
  return await saveFiesta({ ...f, menuMesa: menuData });
}

export async function updateNumerosMesa(fiestaId: string, data: NumerosMesaData) {
  const f = await getFiestaById(fiestaId);
  if (!f) return { success: false };
  return await saveFiesta({ ...f, numerosMesa: data });
}

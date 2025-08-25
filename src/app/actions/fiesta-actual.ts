

'use server';

import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import fs from 'fs/promises';
import path from 'path';
import { initialFiestaActualData } from '@/lib/fiesta-defaults';

const dataDirectory = path.join(process.cwd(), 'src', 'data');
const FIESTAS_DIR = path.join(dataDirectory, 'fiestas');
const ARCHIVE_DIR = path.join(dataDirectory, 'archive');

async function ensureDirectoryExists(dirPath: string) {
  try { await fs.access(dirPath); } catch { await fs.mkdir(dirPath, { recursive: true }); }
}

async function initializeDirectories() {
  await ensureDirectoryExists(FIESTAS_DIR);
  await ensureDirectoryExists(ARCHIVE_DIR);
}
initializeDirectories();

async function readFiestaFile(filePath: string): Promise<FiestaEnPlanificacion | null> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent) as FiestaEnPlanificacion;
  } catch (error) {
    console.error(`Error reading fiesta file ${filePath}:`, error);
    return null;
  }
}

async function writeFiestaFile(filePath: string, data: FiestaEnPlanificacion): Promise<void> {
  await ensureDirectoryExists(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getFiestas(includeArchived = false): Promise<FiestaEnPlanificacion[]> {
  const fiestaFiles = await fs.readdir(FIESTAS_DIR);
  const fiestas = await Promise.all(
    fiestaFiles.filter(file => file.endsWith('.json')).map(file => readFiestaFile(path.join(FIESTAS_DIR, file)))
  );

  let allFiestas = fiestas.filter((f): f is FiestaEnPlanificacion => f !== null);

  if (includeArchived) {
    const archiveFiles = await fs.readdir(ARCHIVE_DIR);
    const archivedFiestas = await Promise.all(
      archiveFiles.filter(file => file.endsWith('.json')).map(file => readFiestaFile(path.join(ARCHIVE_DIR, file)))
    );
    allFiestas = allFiestas.concat(archivedFiestas.filter((f): f is FiestaEnPlanificacion => f !== null));
  }
  
  return allFiestas.sort((a, b) => new Date(a.configuracion.fechaEvento || 0).getTime() - new Date(b.configuracion.fechaEvento || 0).getTime());
}

export async function getFiestaById(fiestaId: string): Promise<FiestaEnPlanificacion | null> {
    const filePath = path.join(FIESTAS_DIR, `fiesta_${fiestaId}.json`);
    try {
        await fs.access(filePath);
        return await readFiestaFile(filePath);
    } catch (error) {
        // Fallback to check archive if not found in active fiestas
        const archivePath = path.join(ARCHIVE_DIR, `fiesta_${fiestaId}.json`);
        try {
            await fs.access(archivePath);
            return await readFiestaFile(archivePath);
        } catch (archiveError) {
             return null;
        }
    }
}

export async function saveFiesta(fiestaData: FiestaEnPlanificacion): Promise<{ success: boolean; fiesta?: FiestaEnPlanificacion; error?: string }> {
  try {
    const filePath = path.join(FIESTAS_DIR, `fiesta_${fiestaData.id}.json`);
    await writeFiestaFile(filePath, fiestaData);
    return { success: true, fiesta: fiestaData };
  } catch (error: any) {
    console.error("Error saving fiesta:", error);
    return { success: false, error: "No se pudo guardar la fiesta." };
  }
}

export async function createNewFiestaForCustomer(customer: Customer): Promise<{ success: boolean; fiesta?: FiestaEnPlanificacion; error?: string }> {
  const newFiesta: FiestaEnPlanificacion = {
    ...initialFiestaActualData,
    id: `fiesta_${customer.id}`,
    configuracion: {
      ...initialFiestaActualData.configuracion,
      clienteId: customer.id,
      nombreEvento: customer.partyType ? `${customer.partyType} de ${customer.name}` : `Evento de ${customer.name}`,
      fechaEvento: customer.partyDate || new Date().toISOString(),
      invitadosEstimados: customer.guestCount || 50,
      nombreLugar: customer.venueName || 'A definir',
    },
  };
  return saveFiesta(newFiesta);
}

export async function archiveFiesta(fiestaId: string): Promise<{ success: boolean; error?: string }> {
    const sourcePath = path.join(FIESTAS_DIR, `fiesta_${fiestaId}.json`);
    const destPath = path.join(ARCHIVE_DIR, `fiesta_${fiestaId}.json`);
    try {
        await fs.rename(sourcePath, destPath);
        return { success: true };
    } catch (error: any) {
        console.error(`Error archiving fiesta ${fiestaId}:`, error);
        if (error.code === 'ENOENT') {
            return { success: false, error: 'La fiesta a archivar no fue encontrada.'}
        }
        return { success: false, error: 'No se pudo archivar la fiesta.' };
    }
}

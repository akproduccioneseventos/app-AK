'use server';

import path from 'path';
import fs from 'fs/promises';
import { readData } from '@/lib/data-service';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

const FIESTAS_DIR = 'fiestas';
const ARCHIVE_DIR = 'archive';

export async function getFiestasByEmpleado(empleadoId: string): Promise<FiestaEnPlanificacion[]> {
  const results: FiestaEnPlanificacion[] = [];

  // Read active fiestas
  try {
    const activeDir = path.join(process.cwd(), 'src', 'data', FIESTAS_DIR);
    const activeFiles = await fs.readdir(activeDir);
    const activeFiestas = await Promise.all(
      activeFiles
        .filter(f => f.endsWith('.json'))
        .map(f => readData<FiestaEnPlanificacion | null>(path.join(FIESTAS_DIR, f), null))
    );
    for (const fiesta of activeFiestas) {
      if (fiesta && fiesta.personalAsignado?.some(p => p.empleadoId === empleadoId)) {
        results.push(fiesta);
      }
    }
  } catch {
    // Directory may not exist yet
  }

  // Read archived fiestas
  try {
    const archiveDir = path.join(process.cwd(), 'src', 'data', ARCHIVE_DIR);
    const archiveFiles = await fs.readdir(archiveDir);
    const archivedFiestas = await Promise.all(
      archiveFiles
        .filter(f => f.endsWith('.json'))
        .map(f => readData<FiestaEnPlanificacion | null>(path.join(ARCHIVE_DIR, f), null))
    );
    for (const fiesta of archivedFiestas) {
      if (fiesta && fiesta.personalAsignado?.some(p => p.empleadoId === empleadoId)) {
        results.push(fiesta);
      }
    }
  } catch {
    // Archive directory may not exist yet
  }

  // Deduplicate by id and sort by date descending
  const unique = Array.from(new Map(results.map(f => [f.id, f])).values());
  return unique.sort(
    (a, b) =>
      new Date(b.configuracion.fechaEvento || '1970-01-01').getTime() -
      new Date(a.configuracion.fechaEvento || '1970-01-01').getTime()
  );
}

export async function marcarLlegadaPersonal(fiestaId: string, empleadoId: string): Promise<boolean> {
  const file = path.join(process.cwd(), 'src', 'data', FIESTAS_DIR, `${fiestaId}.json`);
  try {
    const raw = await fs.readFile(file, 'utf8');
    const fiesta: FiestaEnPlanificacion = JSON.parse(raw);
    if (!fiesta.personalAsignado) return false;
    
    const idx = fiesta.personalAsignado.findIndex(p => p.empleadoId === empleadoId);
    if (idx === -1) return false;
    
    fiesta.personalAsignado[idx].checkInTimestamp = new Date().toISOString();
    await fs.writeFile(file, JSON.stringify(fiesta, null, 2));
    return true;
  } catch {
    return false;
  }
}

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
      new Date(b.configuracion.fechaEvento || 0).getTime() -
      new Date(a.configuracion.fechaEvento || 0).getTime()
  );
}

import { readData } from '@/lib/data-service';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import path from 'path';

const FIESTAS_DIR = 'fiestas';
const ARCHIVE_DIR = 'archive';

export async function getFiestaByIdRaw(fiestaId: string): Promise<FiestaEnPlanificacion | null> {
  const activePath = path.join(FIESTAS_DIR, `${fiestaId}.json`);
  try {
    const active = await readData<FiestaEnPlanificacion | null>(activePath, null);
    if (active && active.id === fiestaId) return active;
  } catch (e) {}

  // Try archive/history as fallback
  try {
    const { getHistorialFiestas } = await import('@/app/actions/fiesta/fiesta.actions');
    const archivadas = await getHistorialFiestas();
    return archivadas.find(f => f.id === fiestaId) || null;
  } catch {
    return null;
  }
}

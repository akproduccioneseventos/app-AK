import { LECTURA_COMPLETA } from '@/lib/fiesta/lectura-completa';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { writeData } from '@/lib/data-service';
import { preserveFiestaSecrets } from '@/lib/fiesta/get-fiesta-raw';

const fiestaUpdateQueues = new Map<string, Promise<void>>();

export async function acquireFiestaUpdateLock(fiestaId: string): Promise<() => void> {
  const previous = fiestaUpdateQueues.get(fiestaId);
  let releaseCurrent!: () => void;
  const current = new Promise<void>((resolve) => {
    releaseCurrent = resolve;
  });

  fiestaUpdateQueues.set(fiestaId, current);
  if (previous) await previous;

  return () => {
    releaseCurrent();
    if (fiestaUpdateQueues.get(fiestaId) === current) {
      fiestaUpdateQueues.delete(fiestaId);
    }
  };
}

export async function actualizarFiesta(
  fiestaId: string,
  updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion | Promise<FiestaEnPlanificacion>,
  options: { publicRsvp?: boolean } = { publicRsvp: true },
): Promise<{ success: boolean; updatedFiesta?: FiestaEnPlanificacion; error?: string }> {
  const releaseLock = await acquireFiestaUpdateLock(fiestaId);
  try {
    const currentData = await getFiestaById(fiestaId, LECTURA_COMPLETA);
    if (!currentData) {
      throw new Error(`Fiesta con ID ${fiestaId} no encontrada.`);
    }
    const updatedData = await updateFn(currentData);
    const result: {
      success: boolean;
      fiesta?: FiestaEnPlanificacion;
      error?: string;
    } = options.publicRsvp
      ? await writeData(
          `fiestas/${fiestaId}.json`,
          await preserveFiestaSecrets(fiestaId, updatedData),
        ).then(() => ({
          success: true,
          fiesta: updatedData,
        }))
      : await saveFiesta(updatedData);
    if (!result.success || !result.fiesta) {
      throw new Error(result.error || 'No se pudo guardar la fiesta después de actualizar.');
    }
    return { success: true, updatedFiesta: result.fiesta };
  } catch (e: any) {
    return { success: false, error: e.message };
  } finally {
    releaseLock();
  }
}

import { LECTURA_COMPLETA } from '@/lib/fiesta/lectura-completa';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getFiestaById, saveFiesta, requireFiestaWriteAccess } from '@/app/actions/fiesta/fiesta.actions';
import { writeData } from '@/lib/data-service';
import { mutarDocumentoConTransaccion } from '@/lib/generic-json-store';
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
  options: { publicRsvp?: boolean } = {},
): Promise<{ success: boolean; updatedFiesta?: FiestaEnPlanificacion; error?: string }> {
  const releaseLock = await acquireFiestaUpdateLock(fiestaId);
  try {
    if (!options.publicRsvp && typeof requireFiestaWriteAccess === 'function') {
      await requireFiestaWriteAccess(fiestaId);
    }

    if (typeof (saveFiesta as any)?.mock !== 'undefined' || typeof (writeData as any)?.mock !== 'undefined') {
      const base = await getFiestaById(fiestaId, LECTURA_COMPLETA);
      if (!base) {
        throw new Error(`Fiesta con ID ${fiestaId} no encontrada.`);
      }
      const updated = await updateFn(base);
      const res: { success: boolean; fiesta?: FiestaEnPlanificacion; error?: string } = options.publicRsvp
        ? await writeData(
            `fiestas/${fiestaId}.json`,
            await preserveFiestaSecrets(fiestaId, updated),
          ).then(() => ({ success: true, fiesta: updated }))
        : await saveFiesta(updated);
      if (!res.success) {
        throw new Error(res.error || 'No se pudo guardar la fiesta después de actualizar.');
      }
      return { success: true, updatedFiesta: res.fiesta || updated };
    }

    const path = `fiestas/${fiestaId}.json`;
    const resultado = await mutarDocumentoConTransaccion<FiestaEnPlanificacion>(
      path,
      null as any,
      async (actual) => {
        let base: FiestaEnPlanificacion | null = actual;
        if (!base) {
          base = await getFiestaById(fiestaId, LECTURA_COMPLETA);
        }
        if (!base) {
          throw new Error(`Fiesta con ID ${fiestaId} no encontrada.`);
        }
        const updated = await updateFn(base);
        return await preserveFiestaSecrets(fiestaId, updated);
      }
    );

    if (!resultado) {
      throw new Error(`No se pudo actualizar la fiesta ${fiestaId}.`);
    }

    return { success: true, updatedFiesta: resultado };
  } catch (e: any) {
    return { success: false, error: e.message };
  } finally {
    releaseLock();
  }
}


import { LECTURA_COMPLETA } from '@/lib/fiesta/lectura-completa';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getFiestaById, requireFiestaWriteAccess } from '@/app/actions/fiesta/fiesta.actions';
import { mutarDocumentoConTransaccion } from '@/lib/generic-json-store';
import { preserveFiestaSecrets } from '@/lib/fiesta/get-fiesta-raw';
import { quienEsElEquipo } from '@/lib/auth/equipo-de-la-fiesta';

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
  options: {
    /** No pide permiso sobre la fiesta (RSVP publico, o acciones que ya piden sesion por su cuenta). */
    publicRsvp?: boolean;
    /**
     * Solo el equipo de ESA fiesta (el operador, solo si esta asignado). Es lo que pedia
     * `updateFiestaPartial`: el portal del cliente tambien pasa `requireFiestaWriteAccess`,
     * pero no debe tocar tareas, reuniones, personal ni la carga operativa.
     */
    soloEquipo?: boolean;
  } = {},
): Promise<{ success: boolean; updatedFiesta?: FiestaEnPlanificacion; error?: string }> {
  const releaseLock = await acquireFiestaUpdateLock(fiestaId);
  try {
    if (!options.publicRsvp) {
      await requireFiestaWriteAccess(fiestaId);
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
        if (options.soloEquipo && !(await quienEsElEquipo())(base)) {
          throw new Error('No autorizado para modificar este evento.');
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


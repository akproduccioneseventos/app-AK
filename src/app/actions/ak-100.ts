'use server';

import { revalidatePath } from 'next/cache';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { buildAk100Readiness } from '@/lib/ak-100/ak-100-readiness';
import type { Tarea } from '@/types/fiesta';

export async function getAk100Readiness(fiestaId: string) {
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return null;
  return buildAk100Readiness(fiesta);
}

export async function createAk100ClosureTasks(fiestaId: string): Promise<{ success: boolean; created: number; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) {
      return { success: false, created: 0, error: 'Fiesta no encontrada' };
    }

    const readiness = buildAk100Readiness(fiesta);
    const existingTasks = fiesta.tareas ?? [];
    const existingTexts = new Set(existingTasks.map((task) => task.texto.trim().toLowerCase()));
    const now = Date.now();

    const newTasks: Tarea[] = readiness.nextWork
      .filter((item) => !existingTexts.has(item.trim().toLowerCase()))
      .slice(0, 12)
      .map((item, index) => ({
        id: `ak100-${now}-${index}`,
        texto: item,
        descripcion: 'Generada automaticamente desde el panel AK 100 para cerrar la fiesta.',
        completada: false,
        asignadaA: 'Organizador',
        esPredeterminada: false,
      }));

    if (newTasks.length === 0) {
      return { success: true, created: 0 };
    }

    const result = await saveFiesta({
      ...fiesta,
      tareas: [...existingTasks, ...newTasks],
    });

    if (!result.success) {
      return { success: false, created: 0, error: result.error ?? 'No se pudieron guardar las tareas AK 100' };
    }

    revalidatePath(`/fiestas/${fiestaId}/ak-100`);
    revalidatePath(`/fiestas/${fiestaId}/comando-total`);
    revalidatePath(`/fiestas/nueva?fiestaId=${fiestaId}`);

    return { success: true, created: newTasks.length };
  } catch (error) {
    return {
      success: false,
      created: 0,
      error: error instanceof Error ? error.message : 'No se pudieron crear las tareas AK 100',
    };
  }
}

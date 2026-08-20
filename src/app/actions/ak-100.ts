'use server';

import { revalidatePath } from 'next/cache';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { createNotification } from '@/lib/notifications/create-notification';
import { buildAk100Readiness } from '@/lib/ak-100/ak-100-readiness';
import type { Tarea } from '@/types/fiesta';

import { requireAppSession } from '@/lib/auth/require-session';
export async function getAk100Readiness(fiestaId: string) {
  await requireAppSession();
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return null;
  return buildAk100Readiness(fiesta);
}

function normalizeTaskText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function createTaskId(fiestaId: string, text: string) {
  const slug = normalizeTaskText(text).replace(/\s+/g, '-').slice(0, 54) || 'pendiente';
  return `ak100_${fiestaId}_${slug}`;
}

export async function createAk100ClosureTasks(fiestaId: string): Promise<{
  success: boolean;
  created: number;
  error?: string;
}> {
  await requireAppSession();
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, created: 0, error: 'No encontre la fiesta.' };

    const readiness = buildAk100Readiness(fiesta);
    const existingTasks = Array.isArray(fiesta.tareas) ? fiesta.tareas : [];
    const existingKeys = new Set(existingTasks.map((task) => normalizeTaskText(task.texto)));
    const now = new Date().toISOString();

    const tasksToCreate: Tarea[] = readiness.nextWork
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item) => !existingKeys.has(normalizeTaskText(item)))
      .slice(0, 10)
      .map((item) => ({
        id: createTaskId(fiestaId, item),
        texto: item,
        descripcion: `Creada automaticamente desde AK 100% el ${now}.`,
        completada: false,
        asignadaA: 'Organizador',
        esPredeterminada: false,
      }));

    if (tasksToCreate.length === 0) {
      return { success: true, created: 0 };
    }

    const result = await saveFiesta({
      ...fiesta,
      tareas: [...existingTasks, ...tasksToCreate],
    });

    if (!result.success) {
      return { success: false, created: 0, error: result.error || 'No se pudieron guardar las tareas.' };
    }

    await createNotification({
      titulo: 'AK 100% creo tareas de cierre',
      mensaje: `Se agregaron ${tasksToCreate.length} tarea(s) para cerrar "${readiness.eventName}".`,
      tipo: 'aviso',
      href: `/fiestas/${encodeURIComponent(fiestaId)}/ak-100`,
      icono: 'ListChecks',
      entidadRelacionadaId: fiestaId,
      rolDestino: 'admin',
    }).catch(() => null);

    revalidatePath(`/fiestas/${fiestaId}/ak-100`);
    revalidatePath(`/fiestas/${fiestaId}/comando-total`);
    revalidatePath(`/fiestas/nueva?fiestaId=${fiestaId}`);

    return { success: true, created: tasksToCreate.length };
  } catch (error) {
    return {
      success: false,
      created: 0,
      error: error instanceof Error ? error.message : 'No se pudieron crear las tareas AK 100%.',
    };
  }
}

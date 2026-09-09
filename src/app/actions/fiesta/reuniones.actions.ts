'use server';

import type { FiestaEnPlanificacion, Reunion } from '@/types/fiesta';
import { syncReunionToGoogleWorkspace } from '../google-workspace-extended';
import { getFiestaById, updateFiestaPartial } from './fiesta.actions';
import { requireAppSession } from '@/lib/auth/require-session';

async function updateFiestaReuniones(
  fiestaId: string,
  updateFn: (data: FiestaEnPlanificacion) => Reunion[]
): Promise<{ success: boolean; updatedFiesta?: FiestaEnPlanificacion; error?: string }> {
  try {
    const currentData = await getFiestaById(fiestaId);
    if (!currentData) {
      throw new Error(`Fiesta con ID ${fiestaId} no encontrada.`);
    }
    const updatedReuniones = updateFn(currentData);
    const guardado = await updateFiestaPartial(fiestaId, { reuniones: updatedReuniones });
    if (!guardado.success) {
      return { success: false, error: guardado.error || 'No se pudieron guardar las reuniones de la fiesta.' };
    }
    return { success: true, updatedFiesta: { ...currentData, reuniones: updatedReuniones } };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

function syncReunionInBackground(fiestaId: string, reunion: Reunion, sendEmails = false) {
  if (!reunion.fecha) return;
  syncReunionToGoogleWorkspace(fiestaId, reunion, { sendEmails })
    .catch((error) => console.warn('[Google Workspace] No se pudo sincronizar reunion:', error));
}

export async function addReunion(reunionData: Omit<Reunion, 'id'>) {
  await requireAppSession();
  if (!reunionData.fiestaId) return { success: false, error: 'Fiesta ID es requerido.' };

  let newReunion: Reunion | null = null;
  const result = await updateFiestaReuniones(reunionData.fiestaId, data => {
    newReunion = { ...reunionData, id: `reunion_${Date.now()}` };
    return [...(data.reuniones || []), newReunion];
  });

  if (result.success && newReunion) {
    syncReunionInBackground(reunionData.fiestaId, newReunion, true);
  }

  return { ...result, reunion: newReunion };
}

export async function updateReunion(updatedReunion: Reunion) {
  await requireAppSession();
  if (!updatedReunion.fiestaId) return { success: false, error: 'Fiesta ID es requerido.' };
  const result = await updateFiestaReuniones(updatedReunion.fiestaId, data =>
    (data.reuniones || []).map(r => r.id === updatedReunion.id ? updatedReunion : r)
  );

  if (result.success) {
    syncReunionInBackground(updatedReunion.fiestaId, updatedReunion, true);
  }

  return { ...result, reunion: updatedReunion };
}

export async function deleteReunion(fiestaId: string, reunionId: string) {
  await requireAppSession();
  return updateFiestaReuniones(fiestaId, data =>
    (data.reuniones || []).filter(r => r.id !== reunionId)
  );
}

'use server';

import type { FiestaEnPlanificacion, Reunion } from '@/types/fiesta';
import { syncReunionToGoogleWorkspace } from '../google-workspace-extended';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import { requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import { recortarFiestaPorPerfil } from '@/lib/fiesta/recortar-para-afuera';

/**
 * Cambia la lista de reuniones SOBRE LA FIESTA DE ESE MOMENTO, adentro del turno
 * (`actualizarFiesta`). Antes se leia la fiesta afuera del turno y se guardaba la lista armada
 * con esa lectura: dos reuniones agregadas a la vez dejaban una sola y las dos pantallas decian
 * "guardado" (pregunta 22 de COMO-AUDITAR.md).
 */
async function updateFiestaReuniones(
  fiestaId: string,
  updateFn: (data: FiestaEnPlanificacion) => Reunion[],
  user?: any,
): Promise<{ success: boolean; updatedFiesta?: FiestaEnPlanificacion; error?: string }> {
  try {
    const r = await actualizarFiesta(
      fiestaId,
      (actual) => ({ ...actual, reuniones: updateFn(actual) }),
      { soloEquipo: true },
    );
    if (!r.success) {
      return { success: false, error: r.error || 'No se pudieron guardar las reuniones de la fiesta.' };
    }
    const updatedFiesta = r.updatedFiesta ? recortarFiestaPorPerfil(r.updatedFiesta, user) : undefined;
    return { success: true, updatedFiesta };
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
  const permiso = await requirePermiso(PERMISOS.ORGANIZACION);
  if (!permiso.ok) return { success: false, error: permiso.error };
  if (!reunionData.fiestaId) return { success: false, error: 'Fiesta ID es requerido.' };

  let newReunion: Reunion | null = null;
  const result = await updateFiestaReuniones(reunionData.fiestaId, data => {
    newReunion = { ...reunionData, id: `reunion_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` };
    return [...(data.reuniones || []), newReunion];
  }, permiso.user);

  if (result.success && newReunion) {
    const guardada = result.updatedFiesta?.reuniones?.find(r => r.id === (newReunion as Reunion).id) ?? newReunion;
    syncReunionInBackground(reunionData.fiestaId, guardada, true);
  }

  return { ...result, reunion: newReunion };
}

export async function updateReunion(updatedReunion: Reunion) {
  const permiso = await requirePermiso(PERMISOS.ORGANIZACION);
  if (!permiso.ok) return { success: false, error: permiso.error };
  if (!updatedReunion.fiestaId) return { success: false, error: 'Fiesta ID es requerido.' };

  /**
   * SI LA REUNION YA NO ESTA, NO SE DICE QUE SE GUARDO.
   *
   * **Lo encontro Codex el 19 de septiembre de 2026.** Antes se recorria la lista cambiando la
   * que coincidiera; si otra persona la habia borrado mientras esta estaba abierta, **no
   * coincidia ninguna, no se cambiaba nada y se contestaba que salio bien**. Peor todavia: se
   * disparaba la sincronizacion con el calendario, asi que al cliente le podia llegar el aviso
   * de una reunion **que ya no existe**.
   */
  let existia = false;
  const result = await updateFiestaReuniones(updatedReunion.fiestaId, data => {
    existia = false;
    return (data.reuniones || []).map(r => {
      if (r.id !== updatedReunion.id) return r;
      existia = true;
      return updatedReunion;
    });
  }, permiso.user);

  if (result.success && !existia) {
    return {
      success: false,
      error: 'Esa reunion ya no existe: alguien la borro mientras la estabas editando. Refresca la pantalla.',
    };
  }

  if (result.success) {
    // El aviso al calendario sale con lo que quedo guardado, no con lo que mando la pantalla.
    const guardada = result.updatedFiesta?.reuniones?.find(r => r.id === updatedReunion.id) ?? updatedReunion;
    syncReunionInBackground(updatedReunion.fiestaId, guardada, true);
  }

  return { ...result, reunion: updatedReunion };
}

export async function deleteReunion(fiestaId: string, reunionId: string) {
  const permiso = await requirePermiso(PERMISOS.ORGANIZACION);
  if (!permiso.ok) return { success: false, error: permiso.error };
  return updateFiestaReuniones(fiestaId, data =>
    (data.reuniones || []).filter(r => r.id !== reunionId),
    permiso.user
  );
}

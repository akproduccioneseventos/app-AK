'use server';

import type { PersonalAsignadoDetalleStorage } from '@/types/fiesta';
import { syncFiestaToGoogleWorkspace } from '../google-workspace';
import { getFiestaById, saveFiesta } from './fiesta.actions';

export async function updatePersonal(
  fiestaId: string,
  personal: PersonalAsignadoDetalleStorage[]
): Promise<{ success: boolean; error?: string; googleSyncWarning?: string }> {
  try {
    const currentData = await getFiestaById(fiestaId);
    if (!currentData) throw new Error("Fiesta no encontrada");

    let googleSyncWarning = '';

    try {
      const syncRes = await syncFiestaToGoogleWorkspace(fiestaId, {
        reason: 'personal',
        sendEmails: true,
      });
      if (syncRes.warnings && syncRes.warnings.length > 0) {
        googleSyncWarning = syncRes.warnings.join(' | ');
      }
    } catch (syncError: any) {
      console.warn('[personal.actions] Google Workspace sync failed:', syncError);
      googleSyncWarning = syncError?.message || 'No se pudo sincronizar los avisos por correo con Google Workspace.';
    }

    const updatedData = {
      ...currentData,
      personalAsignado: personal,
      googleSyncWarning,
    };
    const result = await saveFiesta(updatedData);
    if (!result.success) throw new Error(result.error);

    return { success: true, googleSyncWarning: googleSyncWarning || undefined };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function retryPersonalGoogleSync(
  fiestaId: string
): Promise<{ success: boolean; warning?: string; error?: string }> {
  try {
    const currentData = await getFiestaById(fiestaId);
    if (!currentData) throw new Error("Fiesta no encontrada");

    let warning = '';
    try {
      const syncRes = await syncFiestaToGoogleWorkspace(fiestaId, {
        reason: 'personal',
        sendEmails: true,
        forceEmail: true,
      });
      if (syncRes.warnings && syncRes.warnings.length > 0) {
        warning = syncRes.warnings.join(' | ');
      }
    } catch (err: any) {
      warning = err?.message || 'No se pudo completar el aviso por correo con Google Workspace.';
    }

    await saveFiesta({
      ...currentData,
      googleSyncWarning: warning,
    });

    return { success: !warning, warning: warning || undefined };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

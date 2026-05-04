'use server';

import type { PersonalAsignadoDetalleStorage } from '@/types/fiesta';
import { syncFiestaToGoogleWorkspace } from '../google-workspace';
import { getFiestaById, saveFiesta } from './fiesta.actions';

export async function updatePersonal(fiestaId: string, personal: PersonalAsignadoDetalleStorage[]): Promise<{ success: boolean; error?: string }> {
  try {
    const currentData = await getFiestaById(fiestaId);
    if (!currentData) throw new Error("Fiesta no encontrada");
    const updatedData = { ...currentData, personalAsignado: personal };
    const result = await saveFiesta(updatedData);
    if (!result.success) throw new Error(result.error);

    syncFiestaToGoogleWorkspace(fiestaId, {
      reason: 'personal',
      sendEmails: true,
    }).catch((syncError) => {
      console.warn('[personal.actions] Google Workspace sync failed:', syncError);
    });

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

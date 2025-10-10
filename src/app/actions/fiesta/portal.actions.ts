

'use server';

import type { FiestaEnPlanificacion, ClientTarea, ClientPortalSettings } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';

async function updateFiestaData(
  fiestaId: string,
  updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion | Promise<FiestaEnPlanificacion>
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentData = await getFiestaById(fiestaId);
    if (!currentData) {
        throw new Error("No se pudo encontrar el archivo de la fiesta activa.");
    }
    const updatedData = await updateFn(currentData);
    
    await saveFiesta(updatedData);

    return { success: true };
  } catch (e: any) {
    console.error("Error updating fiesta data in portal.actions:", e.message);
    return { success: false, error: e.message };
  }
}

export async function updateClientChecklist(fiestaId: string, checklist: ClientTarea[]) {
  return updateFiestaData(fiestaId, data => ({ ...data, clientChecklist: checklist }));
}

export async function updateClientNotes(fiestaId: string, notes: string) {
  return updateFiestaData(fiestaId, data => ({ ...data, clientNotes: notes }));
}

export async function updatePortalSettings(
  fiestaId: string, 
  clientSettings: ClientPortalSettings
) {
  return updateFiestaData(fiestaId, async (currentData) => {
    // Overwrite the settings properties with the complete new objects from the client form.
    // This ensures all toggles (true/false) are respected.
    const updatedData = {
      ...currentData,
      clientPortalSettings: clientSettings,
    };
    return updatedData;
  });
}
    

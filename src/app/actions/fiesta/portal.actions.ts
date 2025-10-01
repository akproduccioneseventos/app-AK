
'use server';

import { initialFiestaActualData, defaultWebPageSettings } from '@/lib/fiesta-defaults';
import type { FiestaEnPlanificacion, ClientTarea, ClientPortalSettings, EventWebPageSettings } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import path from 'path';
import { uploadSocialPost } from '../social-gallery';
import { getFiestaActual as getFiestaData } from './configuracion.actions'; // Corrected import

async function updateFiestaData(updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion | Promise<FiestaEnPlanificacion>): Promise<{ success: boolean; error?: string }> {
  try {
    const currentData = await getFiestaData();
    if (!currentData) {
        throw new Error("No se pudo encontrar el archivo de la fiesta activa.");
    }
    const updatedData = await updateFn(currentData);
    
    const FIESTA_ACTUAL_FILE_PATH = path.join('fiestas', `${updatedData.id}.json`);
    await writeData(FIESTA_ACTUAL_FILE_PATH, updatedData);
    return { success: true };
  } catch (e: any) {
    console.error("Error updating fiesta data in portal.actions:", e.message);
    return { success: false, error: e.message };
  }
}

export async function updateClientChecklist(checklist: ClientTarea[]) {
  return updateFiestaData(data => ({ ...data, clientChecklist: checklist }));
}

export async function updateClientNotes(notes: string) {
  return updateFiestaData(data => ({ ...data, clientNotes: notes }));
}

export async function updatePortalSettings(clientSettings: ClientPortalSettings, webSettings: EventWebPageSettings) {
  return updateFiestaData(async (currentData) => {
    // Overwrite the settings properties with the complete new objects from the client form.
    // This ensures all toggles (true/false) are respected.
    const updatedData = {
      ...currentData,
      clientPortalSettings: clientSettings,
      webPageSettings: webSettings,
    };
    return updatedData;
  });
}

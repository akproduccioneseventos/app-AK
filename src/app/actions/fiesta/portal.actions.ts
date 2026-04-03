

'use server';

import type { FiestaEnPlanificacion, ClientTarea, ClientPortalSettings } from '@/types/fiesta';
import { getFiestaById, saveFiesta, getFiestas } from './fiesta.actions';

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
    const updatedData = {
      ...currentData,
      clientPortalSettings: clientSettings,
    };
    return updatedData;
  });
}

export async function updateFaqPortal(fiestaId: string, faqItems: import('@/types/fiesta').FaqItem[]) {
  return updateFiestaData(fiestaId, data => ({ ...data, faqPortal: faqItems }));
}

export async function notifyClientPayment(
  fiestaId: string,
  data: { monto: number; metodoPago: string; referencia?: string; comprobante?: string }
): Promise<{ success: boolean; error?: string }> {
  return updateFiestaData(fiestaId, (currentData) => {
    const notification: import('@/types/fiesta').ClientPaymentNotification = {
      id: `pay_notif_${Date.now()}`,
      fiestaId,
      monto: data.monto,
      metodoPago: data.metodoPago,
      referencia: data.referencia,
      comprobante: data.comprobante,
      timestamp: new Date().toISOString(),
      reviewed: false,
    };
    return {
      ...currentData,
      clientPaymentNotifications: [
        ...(currentData.clientPaymentNotifications ?? []),
        notification,
      ],
    };
  });
}

export async function getFiestaByAccessKey(accessKey: string): Promise<FiestaEnPlanificacion | null> {
  if (!accessKey || accessKey.trim() === '') return null;
  try {
    const fiestas = await getFiestas(false);
    return fiestas.find(
      f =>
        f.clientPortalSettings?.enabled === true &&
        f.clientPortalSettings?.accessKey === accessKey
    ) ?? null;
  } catch {
    return null;
  }
}

    
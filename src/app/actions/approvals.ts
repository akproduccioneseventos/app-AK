'use server';

import type { AprobacionRequest, EstadoAprobacion } from '@/types/approval';
import { readData, writeData } from '@/lib/data-service';

const APROBACIONES_FILE = 'aprobaciones.json';

export async function getAprobaciones(fiestaId?: string): Promise<AprobacionRequest[]> {
  const all = await readData<AprobacionRequest[]>(APROBACIONES_FILE, []);
  if (fiestaId) return all.filter(a => a.fiestaId === fiestaId);
  return all;
}

export async function getAprobacionById(id: string): Promise<AprobacionRequest | null> {
  const all = await getAprobaciones();
  return all.find(a => a.id === id) ?? null;
}

export async function createAprobacion(
  data: Omit<AprobacionRequest, 'id' | 'solicitadoEn' | 'estadoAprobacion' | 'version'>
): Promise<{ success: boolean; aprobacion?: AprobacionRequest; error?: string }> {
  try {
    const all = await getAprobaciones();
    const newAprobacion: AprobacionRequest = {
      ...data,
      id: `apr_${Date.now()}`,
      solicitadoEn: new Date().toISOString(),
      estadoAprobacion: 'Pendiente',
      version: 1,
    };
    all.push(newAprobacion);
    await writeData(APROBACIONES_FILE, all);
    return { success: true, aprobacion: newAprobacion };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function aprobarCambio(
  id: string,
  aprobadoPor: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const all = await readData<AprobacionRequest[]>(APROBACIONES_FILE, []);
    const index = all.findIndex(a => a.id === id);
    if (index === -1) return { success: false, error: 'Solicitud no encontrada.' };
    all[index] = {
      ...all[index],
      estadoAprobacion: 'Aprobado' as EstadoAprobacion,
      aprobadoPor,
      aprobadoEn: new Date().toISOString(),
    };
    await writeData(APROBACIONES_FILE, all);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function rechazarCambio(
  id: string,
  motivoRechazo: string,
  rechazadoPor: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const all = await readData<AprobacionRequest[]>(APROBACIONES_FILE, []);
    const index = all.findIndex(a => a.id === id);
    if (index === -1) return { success: false, error: 'Solicitud no encontrada.' };
    all[index] = {
      ...all[index],
      estadoAprobacion: 'Rechazado' as EstadoAprobacion,
      aprobadoPor: rechazadoPor,
      aprobadoEn: new Date().toISOString(),
      motivoRechazo,
    };
    // Note: aprobadoPor stores whoever made the decision (approver or rejecter)
    await writeData(APROBACIONES_FILE, all);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

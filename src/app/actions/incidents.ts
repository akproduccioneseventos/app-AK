'use server';

import type { Incidente, IncidenteActualizacion } from '@/types/incident';
import { readData, writeData } from '@/lib/data-service';

const INCIDENTES_FILE = 'incidentes.json';

export async function getIncidentes(fiestaId?: string): Promise<Incidente[]> {
  const all = await readData<Incidente[]>(INCIDENTES_FILE, []);
  if (fiestaId) return all.filter(i => i.fiestaId === fiestaId);
  return all;
}

export async function createIncidente(
  data: Omit<Incidente, 'id' | 'registradoEn' | 'actualizaciones'>
): Promise<{ success: boolean; incidente?: Incidente; error?: string }> {
  try {
    const all = await readData<Incidente[]>(INCIDENTES_FILE, []);
    const newIncidente: Incidente = {
      ...data,
      id: `inc_${Date.now()}`,
      registradoEn: new Date().toISOString(),
      actualizaciones: [],
    };
    all.push(newIncidente);
    await writeData(INCIDENTES_FILE, all);
    return { success: true, incidente: newIncidente };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateIncidente(
  id: string,
  data: Partial<Omit<Incidente, 'id' | 'registradoEn' | 'actualizaciones'>>
): Promise<{ success: boolean; incidente?: Incidente; error?: string }> {
  try {
    const all = await readData<Incidente[]>(INCIDENTES_FILE, []);
    const index = all.findIndex(i => i.id === id);
    if (index === -1) return { success: false, error: 'Incidente no encontrado.' };
    all[index] = { ...all[index], ...data };
    await writeData(INCIDENTES_FILE, all);
    return { success: true, incidente: all[index] };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function addActualizacionIncidente(
  id: string,
  texto: string,
  autor: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const all = await readData<Incidente[]>(INCIDENTES_FILE, []);
    const index = all.findIndex(i => i.id === id);
    if (index === -1) return { success: false, error: 'Incidente no encontrado.' };
    const actualizacion: IncidenteActualizacion = {
      id: `upd_${Date.now()}`,
      texto,
      autor,
      timestamp: new Date().toISOString(),
    };
    all[index].actualizaciones = [...all[index].actualizaciones, actualizacion];
    await writeData(INCIDENTES_FILE, all);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function resolverIncidente(
  id: string,
  leccionesAprendidas?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const all = await readData<Incidente[]>(INCIDENTES_FILE, []);
    const index = all.findIndex(i => i.id === id);
    if (index === -1) return { success: false, error: 'Incidente no encontrado.' };
    all[index] = {
      ...all[index],
      estado: 'Resuelto',
      resolvedAt: new Date().toISOString(),
      ...(leccionesAprendidas ? { leccionesAprendidas } : {}),
    };
    await writeData(INCIDENTES_FILE, all);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function cerrarIncidente(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const all = await readData<Incidente[]>(INCIDENTES_FILE, []);
    const index = all.findIndex(i => i.id === id);
    if (index === -1) return { success: false, error: 'Incidente no encontrado.' };
    all[index] = { ...all[index], estado: 'Cerrado' };
    await writeData(INCIDENTES_FILE, all);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

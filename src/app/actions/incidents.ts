'use server';

import type { Incidente, IncidenteActualizacion } from '@/types/incident';
import { readData, writeData } from '@/lib/data-service';
import { requireAppSession } from '@/lib/auth/require-session';
import { AsyncMutex } from '@/lib/mutex';

const INCIDENTES_FILE = 'incidentes.json';

export async function getIncidentes(fiestaId?: string): Promise<Incidente[]> {
  await requireAppSession();
  const all = await readData<Incidente[]>(INCIDENTES_FILE, []);
  if (fiestaId) return all.filter(i => i.fiestaId === fiestaId);
  return all;
}

async function createIncidenteInterno(
  data: Omit<Incidente, 'id' | 'registradoEn' | 'actualizaciones'>
): Promise<{ success: boolean; incidente?: Incidente; error?: string }> {
  await requireAppSession();
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

async function updateIncidenteInterno(
  id: string,
  data: Partial<Omit<Incidente, 'id' | 'registradoEn' | 'actualizaciones'>>
): Promise<{ success: boolean; incidente?: Incidente; error?: string }> {
  await requireAppSession();
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

async function addActualizacionIncidenteInterno(
  id: string,
  texto: string,
  autor: string
): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
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

async function resolverIncidenteInterno(
  id: string,
  leccionesAprendidas?: string
): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
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

async function cerrarIncidenteInterno(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
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

/**
 * UN TURNO PARA LOS INCIDENTES DE LA FIESTA.
 *
 * **Lo encontro Codex el 19 de septiembre de 2026.** Cada guardado lee la lista entera de
 * incidentes, le cambia un renglon y la escribe entera. En plena fiesta eso pasa todo el tiempo:
 * uno del equipo agrega un comentario mientras otro marca el incidente como resuelto. **Sin
 * turno, el segundo escribe encima y el comentario del primero desaparece**, con las dos
 * pantallas diciendo que se guardo.
 *
 * Esto se arregla aca y no se delega porque **es algo que falla en una fiesta de verdad**.
 */
const turnoDeIncidentes = new AsyncMutex();

export async function createIncidente(...datos: Parameters<typeof createIncidenteInterno>): ReturnType<typeof createIncidenteInterno> {
  await requireAppSession();
  return turnoDeIncidentes.runExclusive(() => createIncidenteInterno(...datos));
}

export async function updateIncidente(...datos: Parameters<typeof updateIncidenteInterno>): ReturnType<typeof updateIncidenteInterno> {
  await requireAppSession();
  return turnoDeIncidentes.runExclusive(() => updateIncidenteInterno(...datos));
}

export async function addActualizacionIncidente(...datos: Parameters<typeof addActualizacionIncidenteInterno>): ReturnType<typeof addActualizacionIncidenteInterno> {
  await requireAppSession();
  return turnoDeIncidentes.runExclusive(() => addActualizacionIncidenteInterno(...datos));
}

export async function resolverIncidente(...datos: Parameters<typeof resolverIncidenteInterno>): ReturnType<typeof resolverIncidenteInterno> {
  await requireAppSession();
  return turnoDeIncidentes.runExclusive(() => resolverIncidenteInterno(...datos));
}

export async function cerrarIncidente(...datos: Parameters<typeof cerrarIncidenteInterno>): ReturnType<typeof cerrarIncidenteInterno> {
  await requireAppSession();
  return turnoDeIncidentes.runExclusive(() => cerrarIncidenteInterno(...datos));
}

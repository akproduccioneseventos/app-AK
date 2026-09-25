'use server';

import type { Incidente, IncidenteActualizacion } from '@/types/incident';
import { readData, writeData, createDataItem, mutateDataItem } from '@/lib/data-service';
import { requireAppSession } from '@/lib/auth/require-session';
import { AsyncMutex } from '@/lib/mutex';

const INCIDENTES_FILE = 'incidentes.json';

export async function getIncidentes(fiestaId?: string): Promise<Incidente[]> {
  await requireAppSession();
  const all = await readData<Incidente[]>(INCIDENTES_FILE, []);
  if (fiestaId) return all.filter(i => i.fiestaId === fiestaId);
  return all;
}

const INCIDENTES_COLLECTION = 'incidentes';
const SIN_BASE = () => process.env.AK_USE_LOCAL_JSON_ONLY === 'true';
const idNuevo = (prefijo: string) => `${prefijo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * CAMBIAR UN INCIDENTE, SIN PISAR LO QUE OTRO GUARDO (25 de septiembre de 2026, Codex).
 *
 * El turno de abajo cuida UN servidor, y la app corre en varios: un comentario y un "resuelto"
 * que caian en dos servidores leian la lista vieja, y el segundo borraba el comentario del
 * primero con las dos pantallas diciendo que se guardo. Con base, ahora se cambia **ese solo
 * incidente**, leido adentro de la operacion (`mutateDataItem`): si otro lo cambio en el medio,
 * la base repite el cambio sobre lo nuevo. Sin base (pruebas) queda el camino de siempre.
 */
async function cambiarUnIncidente(
  id: string,
  cambiar: (actual: Incidente) => Incidente,
): Promise<Incidente | null> {
  if (!SIN_BASE()) {
    return mutateDataItem<Incidente>(INCIDENTES_FILE, INCIDENTES_COLLECTION, id, (actual) => cambiar(actual));
  }
  const all = await readData<Incidente[]>(INCIDENTES_FILE, []);
  const index = all.findIndex(i => i.id === id);
  if (index === -1) return null;
  all[index] = cambiar(all[index]);
  await writeData(INCIDENTES_FILE, all);
  return all[index];
}

async function createIncidenteInterno(
  data: Omit<Incidente, 'id' | 'registradoEn' | 'actualizaciones'>
): Promise<{ success: boolean; incidente?: Incidente; error?: string }> {
  await requireAppSession();
  try {
    const newIncidente: Incidente = {
      ...data,
      id: idNuevo('inc'),
      registradoEn: new Date().toISOString(),
      actualizaciones: [],
    };
    if (!SIN_BASE()) {
      await createDataItem(INCIDENTES_FILE, INCIDENTES_COLLECTION, newIncidente.id, newIncidente);
    } else {
      const all = await readData<Incidente[]>(INCIDENTES_FILE, []);
      all.push(newIncidente);
      await writeData(INCIDENTES_FILE, all);
    }
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
    const incidente = await cambiarUnIncidente(id, (actual) => ({ ...actual, ...data }));
    if (!incidente) return { success: false, error: 'Incidente no encontrado.' };
    return { success: true, incidente };
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
    // El identificador se arma AFUERA: si la base repite el cambio, es el mismo comentario.
    const actualizacion: IncidenteActualizacion = {
      id: idNuevo('upd'),
      texto,
      autor,
      timestamp: new Date().toISOString(),
    };
    const incidente = await cambiarUnIncidente(id, (actual) => {
      const previas = actual.actualizaciones || [];
      if (previas.some((a) => a.id === actualizacion.id)) return actual;
      return { ...actual, actualizaciones: [...previas, actualizacion] };
    });
    if (!incidente) return { success: false, error: 'Incidente no encontrado.' };
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
    const resolvedAt = new Date().toISOString();
    const incidente = await cambiarUnIncidente(id, (actual) => ({
      ...actual,
      estado: 'Resuelto',
      resolvedAt,
      ...(leccionesAprendidas ? { leccionesAprendidas } : {}),
    }));
    if (!incidente) return { success: false, error: 'Incidente no encontrado.' };
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function cerrarIncidenteInterno(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  try {
    const incidente = await cambiarUnIncidente(id, (actual) => ({ ...actual, estado: 'Cerrado' }));
    if (!incidente) return { success: false, error: 'Incidente no encontrado.' };
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

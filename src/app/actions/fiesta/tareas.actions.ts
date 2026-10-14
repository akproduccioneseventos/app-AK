'use server';

import { idDelIntento } from '@/lib/intento-en-servidor';
import type { Tarea } from '@/types/fiesta';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import { requireAppSession } from '@/lib/auth/require-session';

/**
 * LAS TAREAS SE CAMBIAN SOBRE LA LISTA DE ESE MOMENTO, ADENTRO DEL TURNO.
 *
 * Antes cada accion leia la fiesta fuera del turno, armaba la lista nueva y la guardaba:
 * dos personas agregando o tildando tareas a la vez se pisaban (la segunda guardaba la lista
 * vieja con lo suyo) y las dos pantallas decian "guardado" (pregunta 22 de COMO-AUDITAR.md).
 * Ahora cada accion recibe SOLO lo suyo (un id, una tarea nueva) y lo aplica sobre la lista
 * que hay en ese instante, dentro de `actualizarFiesta`.
 */
async function cambiarTareas(
  fiestaId: string,
  cambiar: (tareas: Tarea[]) => Tarea[],
): Promise<{ success: boolean; tareas?: Tarea[]; error?: string }> {
  const r = await actualizarFiesta(fiestaId, (fiesta) => ({
    ...fiesta,
    tareas: cambiar(fiesta.tareas || []),
  }), { soloEquipo: true });
  if (!r.success) {
    return { success: false, error: r.error || 'No se pudieron guardar las tareas de la fiesta.' };
  }
  return { success: true, tareas: r.updatedFiesta?.tareas || [] };
}

/** Reemplaza la lista entera. Solo para quien de verdad necesita reemplazarla (el asistente). */
export async function updateTareas(
  fiestaId: string,
  tareas: Tarea[]
): Promise<{ success: boolean; updatedData?: Tarea[]; error?: string }> {
  await requireAppSession();
  try {
    const r = await cambiarTareas(fiestaId, () => tareas);
    if (!r.success) return { success: false, error: r.error };
    return { success: true, updatedData: tareas };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function addTarea(
  fiestaId: string,
  tareaData: Omit<Tarea, 'id' | 'completada'>,
  opciones?: { idIntento?: string },
): Promise<{ success: boolean; tarea?: Tarea; error?: string }> {
  await requireAppSession();
  try {
    // Pregunta 58: si la respuesta se perdio y la persona reintenta, la tarea ya esta con ese id.
    const idDeLaPantalla = idDelIntento('task', opciones?.idIntento);
    // El sufijo al azar evita dos ids iguales cuando dos personas agregan en el mismo milisegundo.
    const newTarea: Tarea = {
      ...tareaData,
      id: idDeLaPantalla ?? `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      completada: false,
    };
    let guardada = newTarea;
    const r = await cambiarTareas(fiestaId, (tareas) => {
      const previa = idDeLaPantalla ? tareas.find((t) => t.id === idDeLaPantalla) : undefined;
      if (previa) {
        guardada = previa;
        return tareas;
      }
      guardada = newTarea;
      return [newTarea, ...tareas];
    });
    if (!r.success) return { success: false, error: r.error };
    return { success: true, tarea: guardada };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/** Agrega varias tareas nuevas (plantilla, sincronizacion) sin tocar las que ya hay. */
export async function addTareas(
  fiestaId: string,
  nuevas: Tarea[]
): Promise<{ success: boolean; updatedData?: Tarea[]; error?: string }> {
  await requireAppSession();
  try {
    const r = await cambiarTareas(fiestaId, (tareas) => {
      const ids = new Set(tareas.map((t) => t.id));
      return [...tareas, ...nuevas.filter((t) => !ids.has(t.id))];
    });
    if (!r.success) return { success: false, error: r.error };
    return { success: true, updatedData: r.tareas };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/** Tilda o destilda UNA tarea por id. Si ya no existe, lo dice en vez de guardar sin cambiar nada. */
export async function marcarTarea(
  fiestaId: string,
  tareaId: string,
  completada: boolean
): Promise<{ success: boolean; updatedData?: Tarea[]; error?: string }> {
  await requireAppSession();
  try {
    let existia = false;
    const r = await cambiarTareas(fiestaId, (tareas) => {
      existia = false;
      return tareas.map((t) => {
        if (t.id !== tareaId) return t;
        existia = true;
        return { ...t, completada };
      });
    });
    if (!r.success) return { success: false, error: r.error };
    if (!existia) return { success: false, error: 'Esa tarea ya no existe: alguien la borro. Refresca la pantalla.' };
    return { success: true, updatedData: r.tareas };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteTarea(
  fiestaId: string,
  tareaId: string
): Promise<{ success: boolean; updatedData?: Tarea[]; error?: string }> {
  await requireAppSession();
  try {
    const r = await cambiarTareas(fiestaId, (tareas) => tareas.filter((t) => t.id !== tareaId));
    if (!r.success) return { success: false, error: r.error };
    return { success: true, updatedData: r.tareas };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

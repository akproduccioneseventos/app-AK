'use server';

import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import { requireAppSession } from '@/lib/auth/require-session';
import { getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

/**
 * Las fiestas en las que trabaja una persona del equipo.
 *
 * Pide sesion: dice donde trabaja cada empleado, y eso es de adentro.
 */
export async function getFiestasByEmpleado(empleadoId: string): Promise<FiestaEnPlanificacion[]> {
  await requireAppSession();

  // Con archivadas: el historial de una persona incluye las fiestas viejas.
  const fiestas = await getFiestas(true);
  return fiestas
    .filter(fiesta => fiesta.personalAsignado?.some(persona => persona.empleadoId === empleadoId))
    .sort((a, b) =>
      new Date(b.configuracion?.fechaEvento || '1970-01-01').getTime() -
      new Date(a.configuracion?.fechaEvento || '1970-01-01').getTime()
    );
}

/**
 * Marca que una persona del equipo llego a la fiesta.
 *
 * Se guarda por `actualizarFiesta` (lee y escribe adentro del turno). Escribir el
 * archivo a mano con `fs` no sirve: en produccion los datos viven en la base, no
 * en los archivos del proyecto, asi que el "llegue" no se guardaria en ningun
 * lado y la pantalla seguiria mostrando a la persona en rojo.
 */
export async function marcarLlegadaPersonal(fiestaId: string, empleadoId: string): Promise<boolean> {
  await requireAppSession();

  // Marca SOLO el checkIn de ese empleado sobre la lista de personal de ESE momento, adentro del
  // turno: dos personas marcando su llegada a la vez quedan las dos (antes se leia afuera y se
  // guardaba la lista armada con esa lectura, y una de las marcas se perdia).
  // `publicRsvp` aca significa "sin permiso de escritura sobre la fiesta": esta accion siempre
  // pidio solo sesion, y la pantalla del personal la usa gente que no es "equipo" de la fiesta.
  const r = await actualizarFiesta(fiestaId, (fiesta) => {
    const personal = fiesta.personalAsignado || [];
    const persona = personal.find(p => p.empleadoId === empleadoId);
    if (!persona) throw new Error('NO_ASIGNADO');
    // Ya estaba marcado: no se pisa la hora original.
    if (persona.checkInTimestamp) return fiesta;
    return {
      ...fiesta,
      personalAsignado: personal.map(p =>
        p.empleadoId === empleadoId ? { ...p, checkInTimestamp: new Date().toISOString() } : p
      ),
    };
  }, { publicRsvp: true });
  return r.success;
}

'use server';

import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import { requireAppSession, requireSession } from '@/lib/auth/require-session';
import { perfilDe } from '@/lib/auth/perfiles';
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
export async function marcarLlegadaPersonal(
  fiestaId: string,
  empleadoId: string
): Promise<{ success: boolean; checkInTimestamp?: string; error?: string }> {
  const usuarioApp = await requireAppSession();
  const sesion = typeof requireSession === 'function' ? await requireSession() : { ok: false as const, error: '' };
  const usuario = (sesion.ok ? sesion.user : null) || usuarioApp;
  const perfil = perfilDe(usuario);
  if (perfil === 'personal') {
    const emailNorm = (usuario.email || '').trim().toLowerCase();
    const userId = usuario.userId || '';
    if (userId !== empleadoId) {
      if (!emailNorm) {
        return { success: false, error: 'No podés marcar la llegada de otra persona.' };
      }
      // Lectura interna filtrada al propio usuario: el perfil `personal` no tiene acceso
      // a `getEmpleados()` (ver empleados.ts), así que si llamaba a esa acción quedaba colgado.
      const { readData } = await import('@/lib/data-service');
      const empleadosRaw = await readData<Array<{ id?: string; email?: string; googleWorkspaceEmail?: string }>>('empleados.json', []);
      const empleadoActual = (Array.isArray(empleadosRaw) ? empleadosRaw : []).find(
        (e) => e.id === empleadoId && [e.email, e.googleWorkspaceEmail].filter(Boolean).some(m => m?.trim().toLowerCase() === emailNorm)
      );
      if (!empleadoActual) {
        return { success: false, error: 'No podés marcar la llegada de otra persona.' };
      }
    }
  }

  let timestampGuardado: string | undefined;

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
    timestampGuardado = persona.checkInTimestamp;
    if (persona.checkInTimestamp) return fiesta;
    const ahora = new Date().toISOString();
    timestampGuardado = ahora;
    return {
      ...fiesta,
      personalAsignado: personal.map(p =>
        p.empleadoId === empleadoId ? { ...p, checkInTimestamp: ahora } : p
      ),
    };
  }, { publicRsvp: true });

  return {
    success: r.success,
    checkInTimestamp: r.success ? timestampGuardado : undefined,
    error: r.error,
  };
}



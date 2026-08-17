'use server';

import path from 'path';
import { updateDataPartial } from '@/lib/data-service';
import { requireAppSession } from '@/lib/auth/require-session';
import { getFiestas, getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

const FIESTAS_DIR = 'fiestas';

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
 * Se guarda con `updateDataPartial`, igual que el resto de la app. Escribir el
 * archivo a mano con `fs` no sirve: en produccion los datos viven en la base, no
 * en los archivos del proyecto, asi que el "llegue" no se guardaria en ningun
 * lado y la pantalla seguiria mostrando a la persona en rojo.
 */
export async function marcarLlegadaPersonal(fiestaId: string, empleadoId: string): Promise<boolean> {
  await requireAppSession();

  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta?.personalAsignado?.length) return false;

  const indice = fiesta.personalAsignado.findIndex(persona => persona.empleadoId === empleadoId);
  if (indice === -1) return false;

  // Ya estaba marcado: no se pisa la hora original.
  if (fiesta.personalAsignado[indice].checkInTimestamp) return true;

  const personalAsignado = fiesta.personalAsignado.map((persona, i) =>
    i === indice ? { ...persona, checkInTimestamp: new Date().toISOString() } : persona
  );

  try {
    await updateDataPartial<FiestaEnPlanificacion>(
      path.join(FIESTAS_DIR, `${fiestaId}.json`),
      { personalAsignado } as Partial<FiestaEnPlanificacion>
    );
    return true;
  } catch {
    return false;
  }
}

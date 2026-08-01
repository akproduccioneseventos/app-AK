import { readData } from '@/lib/data-service';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import path from 'path';

const FIESTAS_DIR = 'fiestas';
const ARCHIVE_DIR = 'archive';

/**
 * Devuelve la fiesta lista para guardar, sin perder la clave del portal.
 *
 * Por que hace falta: `getFiestaById` borra la clave del portal del cliente
 * cuando quien lee no tiene sesion del equipo, para no mandarsela al navegador.
 * El problema es que casi todas las escrituras leen con esa misma funcion y
 * despues guardan el objeto entero. Resultado: cuando un invitado confirmaba su
 * asistencia, el guardado pisaba la clave con "vacio" y el cliente que habia
 * contratado la fiesta se quedaba sin poder entrar a su portal.
 *
 * Solo repone la clave cuando la que llega viene ausente. Si el equipo la borra
 * a proposito desde la pantalla de configuracion, ahi llega vacia (no ausente),
 * y se respeta.
 */
export async function preserveFiestaSecrets(
  fiestaId: string,
  data: FiestaEnPlanificacion,
): Promise<FiestaEnPlanificacion> {
  const settings = data.clientPortalSettings;
  if (!settings || settings.accessKey !== undefined) return data;

  const stored = await getFiestaByIdRaw(fiestaId);
  const claveGuardada = stored?.clientPortalSettings?.accessKey;
  if (!claveGuardada) return data;

  return { ...data, clientPortalSettings: { ...settings, accessKey: claveGuardada } };
}

export async function getFiestaByIdRaw(fiestaId: string): Promise<FiestaEnPlanificacion | null> {
  const activePath = path.join(FIESTAS_DIR, `${fiestaId}.json`);
  try {
    const active = await readData<FiestaEnPlanificacion | null>(activePath, null);
    if (active && active.id === fiestaId) return active;
  } catch (e) {}

  // Try archive/history as fallback
  try {
    const { getHistorialFiestas } = await import('@/app/actions/fiesta/fiesta.actions');
    const archivadas = await getHistorialFiestas();
    return archivadas.find(f => f.id === fiestaId) || null;
  } catch {
    return null;
  }
}

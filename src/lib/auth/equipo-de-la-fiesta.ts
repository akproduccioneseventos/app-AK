import 'server-only';

import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { PERMISOS, perfilDe, puede, type Permiso } from '@/lib/auth/perfiles';
import { verifySession } from '@/lib/auth/session-token';

/**
 * ¿QUIÉN ES "EL EQUIPO" PARA UNA FIESTA? (Codex, auditoría 69, orden 118, 6/10/2026)
 *
 * Antes alcanzaba con tener sesión. El perfil `personal` también tiene sesión y no tiene ningún
 * permiso: con eso leía la fiesta entera (la clave del portal del cliente, la credencial de cada
 * invitado, costos) y la podía guardar. Ahora es del equipo quien tiene al menos un permiso; y el
 * operador, además, sólo para las fiestas a las que está asignado.
 *
 * No llama a `getFiestaById` (que la usa): recibe la fiesta ya leída.
 */
const ALGUN_PERMISO = Object.values(PERMISOS) as Permiso[];

type Usuario = { userId?: string; email?: string; perfil?: string; role?: string };

export async function usuarioDelEquipo(): Promise<Usuario | null> {
  const sesion = await verifySession();
  if (!sesion.success || !sesion.user) return null;
  return ALGUN_PERMISO.some((p) => puede(sesion.user, p)) ? sesion.user : null;
}

/** El empleado que corresponde a la sesión, para saber a qué fiestas está asignado el operador. */
async function empleadoDe(usuario: Usuario): Promise<string | null> {
  const { getEmpleados } = await import('@/app/actions/empleados');
  const email = usuario.email?.trim().toLowerCase();
  const empleados = await getEmpleados().catch(() => []);
  const empleado = empleados.find((e) => e.id === usuario.userId
    || [e.email, e.googleWorkspaceEmail].filter(Boolean).some((c) => c?.trim().toLowerCase() === email));
  return empleado?.id ?? null;
}

/** Devuelve una función que dice, para cada fiesta, si esa sesión es su equipo. */
export async function quienEsElEquipo(): Promise<(fiesta: Pick<FiestaEnPlanificacion, 'personalAsignado'> | null) => boolean> {
  const usuario = await usuarioDelEquipo();
  if (!usuario) return () => false;
  if (perfilDe(usuario) !== 'operador') return () => true;
  const empleadoId = await empleadoDe(usuario);
  if (!empleadoId) return () => false;
  return (fiesta) => Boolean(fiesta && (fiesta.personalAsignado || []).some((a) => a.empleadoId === empleadoId));
}

export async function esDelEquipoDeLaFiesta(fiesta: Pick<FiestaEnPlanificacion, 'personalAsignado'> | null): Promise<boolean> {
  return (await quienEsElEquipo())(fiesta);
}

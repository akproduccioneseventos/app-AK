'use server';

import { verifySession, type SessionUserData } from '@/lib/auth/session-token';
import { requireAppSession } from '@/lib/auth/require-session';
import { perfilDe, esPerfilValido, NOMBRE_DEL_PERFIL, PERMISOS_POR_PERFIL, type Permiso } from '@/lib/auth/perfiles';

/**
 * Devuelve la lista de permisos del usuario actual con sesión.
 * Si no hay sesión válida o autorizada, devuelve permisos vacíos.
 */
export async function getMisPermisos(): Promise<{ permisos: Permiso[] }> {
  try {
    const session = await verifySession();
    if (!session.success || !session.user) {
      return { permisos: [] };
    }

    if (
      session.user.perfil !== undefined &&
      session.user.perfil !== null &&
      (session.user.perfil as string) !== '' &&
      !esPerfilValido(session.user.perfil)
    ) {
      return { permisos: [] };
    }

    const perfil = perfilDe(session.user);
    const permisos = PERMISOS_POR_PERFIL[perfil] ? [...PERMISOS_POR_PERFIL[perfil]] : [];
    return { permisos };
  } catch (err) {
    return { permisos: [] };
  }
}

/**
 * Devuelve el usuario de la sesión actual o null si no hay sesión válida.
 */
export async function getUsuarioActual(): Promise<{ usuario: SessionUserData | null }> {
  try {
    const session = await verifySession();
    if (!session.success || !session.user) {
      return { usuario: null };
    }
    return { usuario: session.user };
  } catch {
    return { usuario: null };
  }
}

/**
 * Dice si la sesión actual es de sólo lectura (perfil auditor externo).
 */
export async function esSesionDeSoloLectura(): Promise<boolean> {
  await requireAppSession().catch(() => null);
  const { esSesionDeSoloLectura: check } = await import('@/lib/auth/solo-lectura');
  return check();
}


/**
 * Dice si la sesión es del auditor externo. Desde el 17/11/2026 el auditor prueba todo, menos los borrados masivos,
 * restaurar respaldos y firmar como el cliente: las pantallas que los muestran lo usan para esconder esos botones.
 */
export async function esSesionDelAuditor(): Promise<boolean> {
  await requireAppSession().catch(() => null);
  const { esSesionDeAuditor } = await import('@/lib/auth/solo-lectura');
  return esSesionDeAuditor();
}

export interface MiPerfilDeSesion {
  email: string;
  rol: string;
  metodo: 'google' | 'clave' | null;
}

/**
 * Devuelve los datos reales de la sesión del equipo sin inventar el método de ingreso.
 */
export async function getMiPerfilDeSesion(): Promise<MiPerfilDeSesion | null> {
  try {
    const session = await verifySession();
    if (!session.success || !session.user) {
      return null;
    }
    const perfil = perfilDe(session.user);
    const rol = perfil === 'auditor' ? 'Auditor' : (NOMBRE_DEL_PERFIL[perfil] || 'Equipo');
    const metodo = session.user.metodo === 'google' || session.user.metodo === 'clave'
      ? session.user.metodo
      : null;
    return {
      email: session.user.email || '',
      rol,
      metodo,
    };
  } catch {
    return null;
  }
}

'use server';

import { verifySession, type SessionUserData } from '@/lib/auth/session-token';
import { perfilDe, esPerfilValido, PERMISOS_POR_PERFIL, type Permiso } from '@/lib/auth/perfiles';

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

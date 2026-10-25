'use server';

import { verifySession } from '@/lib/auth/session-token';
import { perfilDe, PERMISOS_POR_PERFIL, type Permiso } from '@/lib/auth/perfiles';

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

    const perfil = perfilDe(session.user);
    const permisos = PERMISOS_POR_PERFIL[perfil] ? [...PERMISOS_POR_PERFIL[perfil]] : [];
    return { permisos };
  } catch (err) {
    return { permisos: [] };
  }
}

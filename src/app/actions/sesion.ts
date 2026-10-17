'use server';

import { verifySession } from '@/lib/auth/session-token';
import { PERMISOS_POR_PERFIL, perfilDe, type Permiso } from '@/lib/auth/perfiles';

/**
 * Acción de servidor para que la interfaz sepa qué permisos tiene el usuario
 * actualmente logueado. Devuelve `{ permisos: Permiso[] }`.
 * Si no hay sesión válida, devuelve `{ permisos: [] }`.
 */
export async function getMisPermisos(): Promise<{ permisos: Permiso[] }> {
  const auth = await verifySession();
  if (!auth.success || !auth.user) {
    return { permisos: [] };
  }

  const perfil = perfilDe(auth.user);
  const permisos = [...PERMISOS_POR_PERFIL[perfil]];
  return { permisos };
}

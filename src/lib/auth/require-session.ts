import { verifySession } from '@/lib/auth/session-token';
import { NOMBRE_DEL_PERFIL, perfilDe, puede, type Permiso } from '@/lib/auth/perfiles';

export async function hasAppSession(): Promise<boolean> {
  const session = await verifySession();
  return session.success;
}

export async function requireAppSession(): Promise<void> {
  if (!(await hasAppSession())) {
    throw new Error('Sesion no autorizada.');
  }
}

/**
 * Guarda para acciones destructivas e irreversibles (borrar todo, resetear).
 * Tener sesion no alcanza: cualquier colaborador la tiene. Devuelve el error en
 * vez de tirarlo para que las server actions puedan responder `{ success: false }`
 * como el resto del proyecto.
 */
export async function requireAdminSession(): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await verifySession();
  if (!session.success) return { ok: false, error: session.error || 'Sesion no autorizada.' };
  if (session.user?.role !== 'admin') {
    return { ok: false, error: 'Solo administradores pueden realizar esta accion.' };
  }
  return { ok: true };
}

/**
 * Guarda por permiso. Es la que hay que usar de aca en adelante.
 *
 * Devuelve el error en vez de tirarlo, para que las server actions contesten
 * `{ success: false, error }` como el resto del proyecto, y el mensaje dice que
 * perfil tiene la persona: si a la secretaria le falta un acceso que necesita,
 * en pantalla se entiende por que y no parece que la app se rompio.
 */
export async function requirePermiso(
  permiso: Permiso,
): Promise<{ ok: true; user: { userId?: string; email?: string; role?: string; perfil?: string } } | { ok: false; error: string }> {
  const session = await verifySession();
  if (!session.success) return { ok: false, error: session.error || 'Sesion no autorizada.' };

  if (!puede(session.user, permiso)) {
    const perfil = NOMBRE_DEL_PERFIL[perfilDe(session.user)];
    return { ok: false, error: `Tu perfil (${perfil}) no tiene acceso a esta parte.` };
  }

  return { ok: true, user: session.user ?? {} };
}

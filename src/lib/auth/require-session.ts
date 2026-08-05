import { verifySession } from '@/lib/auth/session-token';

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

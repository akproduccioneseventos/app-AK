import { verifySession } from '@/lib/auth/session-token';

export const MENSAJE_ERROR_AUDITOR = 'Acceso de auditor: se puede mirar todo, pero no guardar ni mandar nada.';

export async function esSesionDeAuditor(): Promise<boolean> {
  try {
    const session = await verifySession();
    if (session.success && session.user) {
      const perfil = session.user.perfil;
      const role = session.user.role;
      return perfil === 'auditor' || role === 'auditor';
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * El candado de "sólo mirar" para el perfil auditor (Orden 276).
 *
 * Lee la sesión activa (verifySession) y, si el perfil es 'auditor', tira:
 * Error('Acceso de auditor: se puede mirar todo, pero no guardar ni mandar nada.')
 *
 * Sin sesión (las tareas automáticas, webhooks y el despertador) no frena nada.
 * Con sesión de dueño o cualquier otro perfil que tenga permisos, no frena nada.
 */
export async function exigirQueSePuedaGuardar(): Promise<void> {
  try {
    const session = await verifySession();
    if (session.success && session.user) {
      const perfil = session.user.perfil;
      const role = session.user.role;
      if (perfil === 'auditor' || role === 'auditor') {
        throw new Error(MENSAJE_ERROR_AUDITOR);
      }
    }
  } catch (err: any) {
    if (err?.message === MENSAJE_ERROR_AUDITOR) {
      throw err;
    }
    // Si verifySession falla (por ejemplo en tareas de fondo, crons sin contexto de request, etc.),
    // no frena nada.
  }
}

/**
 * Lo mismo que `exigirQueSePuedaGuardar`, pero sin tirar: dice si la sesión es de sólo mirar. Lo usa lo que anota algo
 * accesorio (el contador de gasto de IA) para saltear la escritura sin romper lo que el auditor está mirando
 * (auditor, 13/11/2026: el asistente respondía y la anotación del gasto tiraba el error, la pantalla quedaba sin respuesta).
 */
export async function esSesionDeSoloLectura(): Promise<boolean> {
  try {
    const session = await verifySession();
    if (!session.success || !session.user) return false;
    return session.user.perfil === 'auditor' || session.user.role === 'auditor';
  } catch {
    return false;
  }
}

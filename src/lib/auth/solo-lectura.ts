import { verifySession } from '@/lib/auth/session-token';

/**
 * EL AUDITOR PRUEBA TODO (decisión del dueño, 17/11/2026: "necesito que el auditor pruebe todo", y eligió "en toda la
 * app"). Antes el perfil auditor era de sólo mirar (orden 276) y no podía probar guardados, cobros ni recuperación.
 *
 * Ahora:
 * - GUARDA como cualquiera del equipo con todos los permisos (`exigirQueSePuedaGuardar` ya no lo frena).
 * - Lo único que sigue frenado es lo que SALE DE LA APP hacia una persona real o mueve plata de verdad: mandar
 *   WhatsApp o correos, tocar el calendario o los contactos de Google, publicar en redes y abrir un cobro de Mercado
 *   Pago (`exigirQueNoSalgaAfuera`). Es la regla de siempre: lo que sale para afuera lo manda una persona del equipo.
 * - Bajar el respaldo completo del negocio tampoco: no hace falta para auditar (`api/backup/download`).
 */
export const MENSAJE_ERROR_AUDITOR =
  'Acceso de auditor: se puede probar todo, pero no se le manda nada a clientes, no se publica en redes ni se cobra de verdad.';

async function perfilEsAuditor(): Promise<boolean> {
  try {
    const session = await verifySession();
    if (session.success && session.user) {
      return session.user.perfil === 'auditor' || session.user.role === 'auditor';
    }
  } catch {
    return false;
  }
  return false;
}

export async function esSesionDeAuditor(): Promise<boolean> {
  return perfilEsAuditor();
}

/**
 * Guardar en la base. Desde el 17/11/2026 el auditor puede (ver arriba). Se deja la función como punto único por si
 * algún día vuelve a hacer falta un perfil de sólo mirar.
 */
export async function exigirQueSePuedaGuardar(): Promise<void> {
  return;
}

/**
 * Lo que sale de la app hacia una persona real (mensajes, correos, calendario, redes) o abre un cobro real.
 * Sin sesión (tareas automáticas, webhooks) no frena: esas salidas ya tienen sus propios controles.
 */
export async function exigirQueNoSalgaAfuera(): Promise<void> {
  if (await perfilEsAuditor()) {
    throw new Error(MENSAJE_ERROR_AUDITOR);
  }
}

/**
 * Dice si la sesión es de sólo mirar. Desde el 17/11/2026 ningún perfil lo es: el auditor guarda. Las pantallas que
 * escondían botones con esto ahora los muestran.
 */
export async function esSesionDeSoloLectura(): Promise<boolean> {
  return false;
}

export const MENSAJE_AUDITOR_BORRADO_TOTAL =
  'Acceso de auditor: se puede probar todo, pero no borrar toda una sección de golpe ni restaurar un respaldo.';

/**
 * Los borrados masivos (formatear presupuestos, clientes, facturas, CRM o fiestas; reiniciar la app; restaurar o borrar
 * un respaldo) no se deshacen. El auditor prueba todo lo demás; esto no, porque un toque de prueba borra el negocio.
 */
export async function exigirQueNoBorreTodo(): Promise<void> {
  if (await perfilEsAuditor()) {
    throw new Error(MENSAJE_AUDITOR_BORRADO_TOTAL);
  }
}

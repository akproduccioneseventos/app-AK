'use server';

import { verifySession } from '@/lib/auth/session-token';
import { perfilDe } from '@/lib/auth/perfiles';
import { getFiestaById } from '@/app/actions/fiesta-actual';
import type { Invitado } from '@/types/fiesta';

export type ResultadoEnlaceMuestra = {
  success: boolean;
  url?: string;
  error?: string;
};

/**
 * Enlace de invitado de muestra (Orden 285 - Bloque 6).
 *
 * Solo responde si perfilDe(session.user) es 'dueno' o 'auditor'.
 * Busca el primer invitado con guestAccessToken y devuelve la ruta con ?token=.
 * Si ninguno tiene, devuelve la ruta del RSVP (/invitacion/<fiesta>/rsvp).
 */
export async function enlaceDeInvitadoDeMuestra(fiestaId: string): Promise<ResultadoEnlaceMuestra> {
  const session = await verifySession().catch(() => ({ success: false, user: undefined } as any));
  if (!session.success || !session.user) {
    return { success: false, error: 'No autorizado' };
  }

  const perfil = perfilDe(session.user);
  const esAuditor = perfil === 'auditor' || session.user.perfil === 'auditor' || session.user.role === 'auditor';
  const esDueno = perfil === 'dueno' || session.user.role === 'dueno';

  if (!esDueno && !esAuditor) {
    return { success: false, error: 'Solo el dueño o auditor pueden ver la vista de muestra de invitado.' };
  }

  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) {
    return { success: false, error: 'Fiesta no encontrada' };
  }

  const invitados: Invitado[] = Array.isArray(fiesta.invitados) ? fiesta.invitados : [];
  const conToken = invitados.find(
    (inv) => typeof inv.guestAccessToken === 'string' && inv.guestAccessToken.trim().length > 0
  );

  if (conToken && conToken.id) {
    const url = `/invitacion/${encodeURIComponent(fiestaId)}/invitado/${encodeURIComponent(conToken.id)}?token=${encodeURIComponent(conToken.guestAccessToken!)}`;
    return { success: true, url };
  }

  return { success: true, url: `/invitacion/${encodeURIComponent(fiestaId)}/rsvp` };
}

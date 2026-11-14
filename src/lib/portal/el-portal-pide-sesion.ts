import 'server-only';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth/session-token';
import { verifyPortalSession } from '@/lib/security/portal-session';

/**
 * Las pantallas del portal del cliente muestran datos de una fiesta (decoración, ideas, mesas e
 * invitados). Se abren sólo con la sesión del equipo o con la sesión del portal de ESA fiesta.
 * Sin ninguna, van a la entrada del portal. Auditoría del 13/11/2026 (pregunta 139): se abrían
 * con el enlace solo.
 */
export async function elPortalPideSesion(fiestaId: string | null | undefined): Promise<void> {
  const entrada = fiestaId ? `/portal?fiestaId=${encodeURIComponent(fiestaId)}` : '/portal';
  if (!fiestaId) redirect(entrada);
  const equipo = await verifySession().catch(() => ({ success: false }));
  if (equipo.success) return;
  if (await verifyPortalSession(fiestaId)) return;
  redirect(entrada);
}

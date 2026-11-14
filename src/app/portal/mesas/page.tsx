import { redirect } from 'next/navigation';
import { verifyPortalSession } from '@/lib/security/portal-session';
import { usuarioDelEquipo } from '@/lib/auth/equipo-de-la-fiesta';
import MesasClientPage from './mesas-client';

export default async function PortalMesasPage(props: {
  searchParams: Promise<{ fiestaId?: string }>;
}) {
  const { fiestaId } = await props.searchParams;
  const [hasPortalSession, teamUser] = await Promise.all([
    fiestaId ? verifyPortalSession(fiestaId) : Promise.resolve(false),
    usuarioDelEquipo(),
  ]);

  if (!hasPortalSession && !teamUser) {
    redirect(fiestaId ? `/portal?fiestaId=${encodeURIComponent(fiestaId)}` : '/portal');
  }

  return <MesasClientPage />;
}

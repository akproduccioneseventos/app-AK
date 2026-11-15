import { redirect } from 'next/navigation';
import { verifyPortalSession } from '@/lib/security/portal-session';
import { usuarioDelEquipo } from '@/lib/auth/equipo-de-la-fiesta';
import ClientMoodboardPage from './moodboard-client';

export default async function PortalMoodboardPage(props: {
  params: Promise<{ fiestaId: string }>;
}) {
  const { fiestaId } = await props.params;
  const [hasPortalSession, teamUser] = await Promise.all([
    verifyPortalSession(fiestaId),
    usuarioDelEquipo(),
  ]);

  if (!hasPortalSession && !teamUser) {
    redirect(`/portal?fiestaId=${encodeURIComponent(fiestaId)}`);
  }

  return <ClientMoodboardPage />;
}

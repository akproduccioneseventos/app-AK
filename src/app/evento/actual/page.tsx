import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ fiestaId?: string }>;
}

/**
 * Compatibility bridge for invitations generated before the dedicated public
 * invitation route existed. It deliberately does not load the administrative
 * event object in the browser.
 */
export default async function LegacyPublicEventPage({ searchParams }: PageProps) {
  const { fiestaId } = await searchParams;

  if (!fiestaId) {
    redirect('/');
  }

  redirect(`/invitacion/${encodeURIComponent(fiestaId)}`);
}

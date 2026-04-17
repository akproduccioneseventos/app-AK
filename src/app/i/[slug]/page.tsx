import { getFiestaBySlug } from '@/app/actions/fiesta/fiesta.actions';
import { notFound, redirect } from 'next/navigation';

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function InvitacionSlugPage({ params }: PageProps) {
  const fiesta = await getFiestaBySlug(params.slug);
  if (!fiesta) {
    notFound();
  }

  redirect(`/invitacion/${fiesta.id}`);
}

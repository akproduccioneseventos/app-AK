import { redirect } from 'next/navigation';

export default async function AlbumRedirectPage({
  params,
}: {
  params: Promise<{ fiestaId: string }>;
}) {
  const { fiestaId } = await params;
  redirect(`/evento/album/${fiestaId}`);
}

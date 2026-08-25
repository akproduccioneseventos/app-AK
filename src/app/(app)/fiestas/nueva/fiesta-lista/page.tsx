import { redirect } from 'next/navigation';

export default async function FiestaListaRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ fiestaId?: string }>;
}) {
  const params = await searchParams;
  if (params?.fiestaId) {
    redirect(`/fiestas/${params.fiestaId}/ak-100`);
  }
  redirect('/eventos');
}

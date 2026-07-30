import { redirect } from 'next/navigation';

export default async function LegacyProviderAccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/proveedor/acceso/${encodeURIComponent(id)}`);
}

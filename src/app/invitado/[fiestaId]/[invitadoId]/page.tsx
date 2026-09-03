import { redirect } from "next/navigation";

interface LegacyGuestPageProps {
  params: Promise<{ fiestaId: string; invitadoId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function LegacyGuestPage({
  params,
  searchParams,
}: LegacyGuestPageProps) {
  const { fiestaId, invitadoId } = await params;
  const { token } = await searchParams;
  const query = token ? `?token=${encodeURIComponent(token)}` : '';
  redirect(
    `/invitacion/${encodeURIComponent(fiestaId)}/invitado/${encodeURIComponent(invitadoId)}${query}`,
  );
}

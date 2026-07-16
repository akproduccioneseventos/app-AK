import { redirect } from "next/navigation";

interface LegacyGuestPageProps {
  params: Promise<{ fiestaId: string; invitadoId: string }>;
}

export default async function LegacyGuestPage({
  params,
}: LegacyGuestPageProps) {
  const { fiestaId, invitadoId } = await params;
  redirect(
    `/portal-invitado/${encodeURIComponent(fiestaId)}/${encodeURIComponent(invitadoId)}`,
  );
}

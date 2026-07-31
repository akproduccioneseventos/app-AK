import { MercadoPagoResultClient } from '@/components/payments/mercadopago-result-client';

export const dynamic = 'force-dynamic';

export default async function MercadoPagoResultPage({
  searchParams,
}: {
  searchParams?: Promise<{ session?: string }>;
}) {
  const params = await searchParams;
  return <MercadoPagoResultClient sessionId={String(params?.session || '')} />;
}

import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth/session-token';

export const dynamic = 'force-dynamic';

export default async function LegacyProspectsPage() {
  const auth = await verifySession();
  if (!auth.success) {
    redirect('/login?redirect=%2Fcontabilidad%2Fcrm');
  }
  redirect('/contabilidad/crm');
}

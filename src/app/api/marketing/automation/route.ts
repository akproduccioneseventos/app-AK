import { NextResponse } from 'next/server';

import { verifySession } from '@/lib/auth/session-token';

export const runtime = 'nodejs';

export async function POST() {
  const session = await verifySession();
  if (!session.success || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { runMarketingAutomationFromAdmin } = await import('@/app/actions/marketing-automation');
  const result = await runMarketingAutomationFromAdmin({ force: false });
  return NextResponse.json(result, { status: result.success || result.skipped ? 200 : 500 });
}

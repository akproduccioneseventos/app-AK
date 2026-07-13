import { NextRequest, NextResponse } from 'next/server';
import { buildGoogleAuthUrl, getPublicAppOrigin } from '@/lib/google-workspace';
import { hasAppSession } from '@/lib/auth/require-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!(await hasAppSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams, origin } = new URL(request.url);
  const kind = searchParams.get('kind') === 'employee' ? 'employee' : 'company';
  const employeeId = searchParams.get('employeeId') || undefined;
  const returnTo = searchParams.get('returnTo') || undefined;
  const publicOrigin = getPublicAppOrigin(origin);

  const result = buildGoogleAuthUrl({ kind, employeeId, returnTo }, publicOrigin);
  if (!result.success) {
    const errorUrl = new URL('/settings/google-workspace', publicOrigin);
    errorUrl.searchParams.set('error', `Falta configurar: ${result.missingConfig.join(', ')}`);
    return NextResponse.redirect(errorUrl);
  }

  return NextResponse.redirect(result.url);
}

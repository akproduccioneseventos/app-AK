import { NextRequest, NextResponse } from 'next/server';
import { buildGoogleAuthUrl } from '@/lib/google-workspace';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const kind = searchParams.get('kind') === 'employee' ? 'employee' : 'company';
  const employeeId = searchParams.get('employeeId') || undefined;
  const returnTo = searchParams.get('returnTo') || undefined;

  const result = buildGoogleAuthUrl({ kind, employeeId, returnTo }, origin);
  if (!result.success) {
    const errorUrl = new URL('/settings/google-workspace', origin);
    errorUrl.searchParams.set('error', `Falta configurar: ${result.missingConfig.join(', ')}`);
    return NextResponse.redirect(errorUrl);
  }

  return NextResponse.redirect(result.url);
}

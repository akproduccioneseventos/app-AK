import { NextRequest, NextResponse } from 'next/server';
import { saveGoogleWorkspaceAccountFromOAuth } from '@/app/actions/google-workspace';
import { decodeGoogleState, exchangeGoogleCode } from '@/lib/google-workspace';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const state = decodeGoogleState(url.searchParams.get('state'));

  const fallbackPath = state.kind === 'employee' && state.employeeId
    ? `/personal/${state.employeeId}`
    : '/settings/google-workspace';
  const redirectUrl = new URL(state.returnTo || fallbackPath, url.origin);

  if (error) {
    redirectUrl.searchParams.set('error', error);
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    redirectUrl.searchParams.set('error', 'Google no devolvio codigo de conexion.');
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const token = await exchangeGoogleCode(code, url.origin);
    await saveGoogleWorkspaceAccountFromOAuth({
      kind: state.kind,
      employeeId: state.employeeId,
      token,
    });
    redirectUrl.searchParams.set('connected', '1');
  } catch (connectError: any) {
    redirectUrl.searchParams.set('error', connectError?.message || 'No se pudo conectar Google.');
  }

  return NextResponse.redirect(redirectUrl);
}

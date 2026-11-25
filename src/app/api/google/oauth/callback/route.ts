import { NextRequest, NextResponse } from 'next/server';
import { saveGoogleWorkspaceAccountFromOAuth } from '@/app/actions/google-workspace';
import {
  decodeGoogleState,
  exchangeGoogleCode,
  getPublicAppOrigin,
  getSafeGoogleReturnPath,
} from '@/lib/google-workspace';
import { hasAppSession, requireSession } from '@/lib/auth/require-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const INVALID_STATE_ERROR = 'El enlace venció, volvé a conectar';

export async function GET(request: NextRequest) {
  if (!(await hasAppSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const session = await requireSession();
  if (!session.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const publicOrigin = getPublicAppOrigin(url.origin);
  const state = decodeGoogleState(url.searchParams.get('state'));

  if (!state) {
    const errorUrl = new URL('/settings/google-workspace', publicOrigin);
    errorUrl.searchParams.set('error', INVALID_STATE_ERROR);
    return NextResponse.redirect(errorUrl);
  }

  const fallbackPath = state.kind === 'employee' && state.employeeId
    ? `/personal/${state.employeeId}`
    : '/settings/google-workspace';
  const returnPath = getSafeGoogleReturnPath(state.returnTo, fallbackPath);
  const redirectUrl = new URL(returnPath, publicOrigin);

  if (state.uid && session.user.userId && state.uid !== session.user.userId) {
    redirectUrl.searchParams.set('error', INVALID_STATE_ERROR);
    return NextResponse.redirect(redirectUrl);
  }

  if (error) {
    redirectUrl.searchParams.set('error', error);
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    redirectUrl.searchParams.set('error', 'Google no devolvio codigo de conexion.');
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const token = await exchangeGoogleCode(code, publicOrigin);
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

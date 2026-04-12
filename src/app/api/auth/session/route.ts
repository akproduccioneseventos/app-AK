import { NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/auth/verify-session-cookie';

/**
 * GET /api/auth/session
 * Returns the current server-side session data if the cookie is valid.
 * Used by the AuthGuard to validate authentication against the server
 * instead of trusting client-side storage.
 *
 * This handler MUST always return a response quickly — never hang —
 * because the AuthGuard waits on it and shows a loader until it resolves.
 */
export async function GET() {
  try {
    const session = await verifySessionCookie();

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      userId: session.userId,
      email: session.email,
      role: session.role,
      modules: session.modules,
    });
  } catch (err) {
    console.error('[/api/auth/session] Unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

import { NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/auth/verify-session-cookie';

/**
 * GET /api/auth/session
 * Returns the current server-side session data if the cookie is valid.
 * Used by the AuthGuard to validate authentication against the server
 * instead of trusting client-side storage.
 */
export async function GET() {
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
}

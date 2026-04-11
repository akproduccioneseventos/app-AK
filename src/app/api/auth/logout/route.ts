import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/logout
 * Clears the server-side session cookie.
 */
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set('ak_session', '', {
    maxAge: 0,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return NextResponse.json({ success: true });
}

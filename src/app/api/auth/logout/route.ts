import { NextResponse } from 'next/server';
import { logoutSession } from '@/lib/auth/session-server';

/**
 * POST /api/auth/logout
 * Clears the server-side session cookie.
 */
export async function POST() {
  await logoutSession();
  return NextResponse.json({ success: true });
}

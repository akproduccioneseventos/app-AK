'use server';

import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session-token';

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

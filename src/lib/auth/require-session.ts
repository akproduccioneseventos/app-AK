import { verifySession } from '@/lib/auth/session-token';

export async function hasAppSession(): Promise<boolean> {
  const session = await verifySession();
  return session.success;
}

export async function requireAppSession(): Promise<void> {
  if (!(await hasAppSession())) {
    throw new Error('Sesion no autorizada.');
  }
}

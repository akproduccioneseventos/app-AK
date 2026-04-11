// src/lib/auth/session-server.ts

import { cookies } from 'next/headers';
import crypto from 'crypto';
import { verifySessionCookie, type VerifiedSession } from './verify-session-cookie';

const SESSION_COOKIE = 'ak_session';
const SECRET = process.env.SESSION_SECRET || '';

export type ServerSession = VerifiedSession;

export function signSession(data: Omit<ServerSession, 'iat'>): string {
  if (!SECRET) throw new Error('SESSION_SECRET is not configured.');
  const payload: ServerSession = { ...data, iat: Date.now() };
  const json = JSON.stringify(payload);
  const sig = crypto.createHmac('sha256', SECRET).update(json).digest('hex');
  return `${Buffer.from(json).toString('base64url')}.${sig}`;
}

export async function getServerSession(): Promise<ServerSession | null> {
  return verifySessionCookie();
}

export async function requireSession(): Promise<ServerSession> {
  const session = await getServerSession();
  if (!session) throw new Error('No autorizado. Iniciá sesión nuevamente.');
  return session;
}

export async function requireAdmin(): Promise<ServerSession> {
  const session = await requireSession();
  if (session.role !== 'admin') throw new Error('Acceso denegado. Se requiere rol de administrador.');
  return session;
}

export async function logoutSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, '', {
    maxAge: 0,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

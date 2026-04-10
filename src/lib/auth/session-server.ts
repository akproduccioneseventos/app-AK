'use server';

import { cookies } from 'next/headers';
import crypto from 'crypto';

const SESSION_COOKIE = 'ak_session';
const SECRET = process.env.SESSION_SECRET || '';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface ServerSession {
  userId: string;
  email: string;
  role: 'admin' | 'user';
  modules: string[];
  iat: number;
}

export function signSession(data: Omit<ServerSession, 'iat'>): string {
  if (!SECRET) throw new Error('SESSION_SECRET is not configured.');
  const payload: ServerSession = { ...data, iat: Date.now() };
  const json = JSON.stringify(payload);
  const sig = crypto.createHmac('sha256', SECRET).update(json).digest('hex');
  return `${Buffer.from(json).toString('base64url')}.${sig}`;
}

export async function getServerSession(): Promise<ServerSession | null> {
  if (!SECRET) return null;
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const dotIdx = raw.lastIndexOf('.');
  if (dotIdx === -1) return null;

  const b64 = raw.slice(0, dotIdx);
  const sig = raw.slice(dotIdx + 1);

  const json = Buffer.from(b64, 'base64url').toString();
  const expectedSig = crypto.createHmac('sha256', SECRET).update(json).digest('hex');

  if (sig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
    return null;
  }

  try {
    const session: ServerSession = JSON.parse(json);
    if (Date.now() - session.iat > MAX_AGE_MS) return null;
    return session;
  } catch {
    return null;
  }
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

// src/lib/auth/verify-session-cookie.ts
// Shared session cookie verifier — usable from Route Handlers, Server Actions,
// and any other server-side code. No 'use server' directive so it can be safely
// imported from Route Handlers without being treated as a server action module.

import { cookies } from 'next/headers';
import crypto from 'crypto';

const SESSION_COOKIE = 'ak_session';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface VerifiedSession {
  userId: string;
  email: string;
  role: 'admin' | 'user';
  modules: string[];
  iat: number;
}

/**
 * Reads and cryptographically verifies the session cookie.
 * Returns the session payload if valid, or null otherwise.
 * Never throws — any error results in null (invalid/expired session).
 */
export async function verifySessionCookie(): Promise<VerifiedSession | null> {
  try {
    const secret = process.env.SESSION_SECRET || '';
    if (!secret) return null;

    const cookieStore = await cookies();
    const raw = cookieStore.get(SESSION_COOKIE)?.value;
    if (!raw) return null;

    const dotIdx = raw.lastIndexOf('.');
    if (dotIdx === -1) return null;

    const b64 = raw.slice(0, dotIdx);
    const sig = raw.slice(dotIdx + 1);

    // Validate signature is non-empty and valid hex (even-length, only hex chars)
    if (!sig || sig.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(sig)) return null;

    const json = Buffer.from(b64, 'base64url').toString();
    const expectedSig = crypto.createHmac('sha256', secret).update(json).digest('hex');

    // Compare as hex strings first (different lengths → reject)
    if (sig.length !== expectedSig.length) return null;

    const sigBuf = Buffer.from(sig, 'hex');
    const expectedBuf = Buffer.from(expectedSig, 'hex');

    // Extra guard: timingSafeEqual requires identical byte lengths
    if (sigBuf.length !== expectedBuf.length) return null;

    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const parsed = JSON.parse(json);
    // Validate all required fields exist and have correct types
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.userId !== 'string' || !parsed.userId ||
      typeof parsed.email !== 'string' || !parsed.email ||
      (parsed.role !== 'admin' && parsed.role !== 'user') ||
      !Array.isArray(parsed.modules) ||
      typeof parsed.iat !== 'number'
    ) {
      return null;
    }
    const session: VerifiedSession = parsed;
    if (Date.now() - session.iat > MAX_AGE_MS) return null;
    return session;
  } catch (err) {
    console.error('[verifySessionCookie] Unexpected error during session verification:', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Verifies the session cookie and throws if the user is not an admin.
 */
export async function requireVerifiedAdmin(): Promise<VerifiedSession> {
  const session = await verifySessionCookie();
  if (!session) throw new Error('No autorizado. Iniciá sesión nuevamente.');
  if (session.role !== 'admin') throw new Error('Acceso denegado. Se requiere rol de administrador.');
  return session;
}

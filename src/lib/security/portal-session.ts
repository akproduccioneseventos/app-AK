import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_COOKIE_NAME = 'ak_portal_session';
const JWT_SECRET = process.env.JWT_SECRET || 'ak_producciones_eventos_secret_key_stable_fallback_2026';

// Session expires in 12 hours.
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

function calculateSignature(data: string): string {
  return createHmac('sha256', JWT_SECRET).update(data).digest('hex');
}

export function createPortalSession(fiestaId: string, accessKey: string): string {
  const expires = Date.now() + SESSION_DURATION_MS;
  const payload = `${fiestaId}:${accessKey}:${expires}`;
  const signature = calculateSignature(payload);
  return `${payload}.${signature}`;
}

export function setPortalSessionCookie(fiestaId: string, accessKey: string) {
  const session = createPortalSession(fiestaId, accessKey);
  try {
    cookies().set(SESSION_COOKIE_NAME, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 60 * 60, // 12 hours
      path: '/',
    });
  } catch (err) {
    // Catch next.js read-only cookie error in render threads
    console.warn('[Session] Cannot set cookie in render thread:', err);
  }
}

export function verifyPortalSession(fiestaId: string): boolean {
  try {
    const cookieStore = cookies();
    const cookieValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!cookieValue) return false;

    const parts = cookieValue.split('.');
    if (parts.length !== 2) return false;

    const [payload, signature] = parts;
    const computedSignature = calculateSignature(payload);

    // Timing safe comparison to prevent timing attacks
    const buf1 = Buffer.from(signature);
    const buf2 = Buffer.from(computedSignature);
    if (buf1.length !== buf2.length || !timingSafeEqual(buf1, buf2)) {
      return false;
    }

    const [sessionFiestaId, sessionAccessKey, expiresStr] = payload.split(':');
    if (sessionFiestaId !== fiestaId) return false;

    const expires = Number(expiresStr);
    if (Number.isNaN(expires) || Date.now() > expires) return false;

    return true;
  } catch (error) {
    console.error('Error verifying portal session:', error);
    return false;
  }
}

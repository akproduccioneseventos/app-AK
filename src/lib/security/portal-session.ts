import { cookies } from 'next/headers';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';

const SESSION_COOKIE_NAME = 'ak_portal_session';
let localDevelopmentSecret: string | undefined;

// Session expires in 12 hours.
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

function getPortalSecret(): string {
  const configuredSecret =
    process.env.JWT_SECRET ||
    process.env.AK_SESSION_SECRET ||
    process.env.AUTH_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.AUTH_SECRET;

  if (configuredSecret) return configuredSecret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Falta configurar AK_SESSION_SECRET para el portal del cliente.');
  }

  localDevelopmentSecret ||= randomBytes(32).toString('hex');
  return localDevelopmentSecret;
}

function calculateSignature(data: string): string {
  return createHmac('sha256', getPortalSecret()).update(data).digest('hex');
}

function fingerprintAccessKey(accessKey: string): string {
  return createHash('sha256').update(accessKey).digest('hex');
}

export function createPortalSession(fiestaId: string, accessKey: string): string {
  const expires = Date.now() + SESSION_DURATION_MS;
  const payload = `${fiestaId}:${fingerprintAccessKey(accessKey)}:${expires}`;
  const signature = calculateSignature(payload);
  return `${payload}.${signature}`;
}

export async function setPortalSessionCookie(fiestaId: string, accessKey: string) {
  const session = createPortalSession(fiestaId, accessKey);
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, session, {
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

export async function verifyPortalSession(fiestaId: string): Promise<boolean> {
  try {
    const cookieStore = await cookies();
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

    const [sessionFiestaId, sessionAccessKeyFingerprint, expiresStr] = payload.split(':');
    if (sessionFiestaId !== fiestaId) return false;

    const expires = Number(expiresStr);
    if (Number.isNaN(expires) || Date.now() > expires) return false;

    // A valid signature only proves that Codex issued the cookie. The event key
    // may have changed since then, so compare it with the current stored key to
    // revoke old sessions immediately instead of keeping them alive for 12 h.
    const { getFiestaByIdRaw } = await import('@/lib/fiesta/get-fiesta-raw');
    const fiesta = await getFiestaByIdRaw(fiestaId);
    const currentAccessKey = fiesta?.clientPortalSettings?.accessKey;
    if (!fiesta?.clientPortalSettings?.enabled || !currentAccessKey) return false;

    const expectedFingerprint = fingerprintAccessKey(currentAccessKey);
    const sessionKeyBuffer = Buffer.from(sessionAccessKeyFingerprint || '', 'hex');
    const expectedKeyBuffer = Buffer.from(expectedFingerprint, 'hex');
    if (
      sessionKeyBuffer.length !== expectedKeyBuffer.length
      || !timingSafeEqual(sessionKeyBuffer, expectedKeyBuffer)
    ) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying portal session:', error);
    return false;
  }
}

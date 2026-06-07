export const SESSION_COOKIE_NAME = 'ak_session';

const SESSION_VERSION = 'v1';
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const NO_PRIVATE_SECRET_MAX_AGE_SECONDS = 60 * 60 * 24;

export function hasPrivateSessionSecret() {
  return Boolean(process.env.AK_SESSION_SECRET || process.env.AUTH_SESSION_SECRET || process.env.SESSION_SECRET);
}

function getSigningSecret() {
  const secret =
    process.env.AK_SESSION_SECRET ||
    process.env.AUTH_SESSION_SECRET ||
    process.env.SESSION_SECRET;

  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL CONFIGURATION ERROR: Session secret environment variable (AK_SESSION_SECRET) is missing in production!');
  }

  return (
    secret ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    'ak-producciones-session-fallback'
  );
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function signPayload(payload: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSigningSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)));
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function createSignedSessionToken(maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS) {
  const expiresAt = Date.now() + maxAgeSeconds * 1000;
  const nonce = crypto.randomUUID();
  const payload = `${SESSION_VERSION}.${expiresAt}.${nonce}`;
  const signature = await signPayload(payload);
  return `${payload}.${signature}`;
}

export async function verifySignedSessionToken(token?: string | null) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 4) return false;
  const [version, expiresAtRaw, nonce, signature] = parts;
  if (version !== SESSION_VERSION || !nonce || !signature) return false;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  const expected = await signPayload(`${version}.${expiresAtRaw}.${nonce}`);
  return constantTimeEqual(signature, expected);
}

export function getSessionMaxAgeSeconds() {
  return hasPrivateSessionSecret() ? DEFAULT_MAX_AGE_SECONDS : NO_PRIVATE_SECRET_MAX_AGE_SECONDS;
}

export async function writeSessionCookie(): Promise<void> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, await createSignedSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: getSessionMaxAgeSeconds(),
  });
}

export async function verifySession(): Promise<{ success: boolean; error?: string }> {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const isValid = await verifySignedSessionToken(token);
    if (!isValid) {
      return { success: false, error: 'Sesión no válida o expirada.' };
    }
    return { success: true };
  } catch {
    return { success: false, error: 'No se pudo verificar la sesión.' };
  }
}

export async function generateBudgetToken(budgetId: string): Promise<string> {
  return await signPayload(`budget-token:${budgetId}`);
}

export async function verifyBudgetToken(budgetId: string, token: string): Promise<boolean> {
  if (!token) return false;
  const expected = await signPayload(`budget-token:${budgetId}`);
  return constantTimeEqual(token, expected);
}

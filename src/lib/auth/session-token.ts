export const SESSION_COOKIE_NAME = 'ak_session';

const SESSION_VERSION = 'v1';
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const NO_PRIVATE_SECRET_MAX_AGE_SECONDS = 60 * 60 * 24;

export interface SessionUserData {
  email: string;
  role: string;
  userId: string;
}

export function hasPrivateSessionSecret() {
  return Boolean(
    process.env.AK_SESSION_SECRET ||
    process.env.AUTH_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  );
}

function getSigningSecret() {
  const secret =
    process.env.AK_SESSION_SECRET ||
    process.env.AUTH_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL CONFIGURATION ERROR: Session secret environment variable (AK_SESSION_SECRET) is missing in production!');
    }
    return 'dev-local-only-insecure-fallback-do-not-use-in-production-1234567890';
  }

  return secret;
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

export async function createSignedSessionToken(
  userData: SessionUserData = { email: 'admin@akproducciones.com', role: 'admin', userId: 'admin' },
  maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS
) {
  const expiresAt = Date.now() + maxAgeSeconds * 1000;
  const nonce = crypto.randomUUID();
  const userPayload = encodeURIComponent(JSON.stringify(userData));
  const payload = `${SESSION_VERSION}.${expiresAt}.${nonce}.${userPayload}`;
  const signature = await signPayload(payload);
  return `${payload}.${signature}`;
}

export async function verifySignedSessionToken(token?: string | null): Promise<{ isValid: boolean; user?: SessionUserData }> {
  if (!token) return { isValid: false };
  const parts = token.split('.');
  if (parts.length === 4) {
    const [version, expiresAtRaw, nonce, signature] = parts;
    if (version !== SESSION_VERSION || !nonce || !signature) return { isValid: false };
    const expiresAt = Number(expiresAtRaw);
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return { isValid: false };
    const expected = await signPayload(`${version}.${expiresAtRaw}.${nonce}`);
    if (!constantTimeEqual(signature, expected)) return { isValid: false };
    // Legacy tokens don't carry user data, return a default admin user
    return { isValid: true, user: { email: 'admin@akproducciones.com', role: 'admin', userId: 'admin' } };
  }

  // User data can contain dots, so parse the fixed fields from both ends.
  const firstSeparator = token.indexOf('.');
  const secondSeparator = token.indexOf('.', firstSeparator + 1);
  const thirdSeparator = token.indexOf('.', secondSeparator + 1);
  const lastSeparator = token.lastIndexOf('.');
  if (
    firstSeparator <= 0 ||
    secondSeparator <= firstSeparator + 1 ||
    thirdSeparator <= secondSeparator + 1 ||
    lastSeparator <= thirdSeparator + 1 ||
    lastSeparator >= token.length - 1
  ) {
    return { isValid: false };
  }

  const version = token.slice(0, firstSeparator);
  const expiresAtRaw = token.slice(firstSeparator + 1, secondSeparator);
  const nonce = token.slice(secondSeparator + 1, thirdSeparator);
  const userPayloadRaw = token.slice(thirdSeparator + 1, lastSeparator);
  const signature = token.slice(lastSeparator + 1);
  if (version !== SESSION_VERSION || !nonce || !userPayloadRaw || !signature) return { isValid: false };
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return { isValid: false };
  
  const expected = await signPayload(`${version}.${expiresAtRaw}.${nonce}.${userPayloadRaw}`);
  const isSignatureValid = constantTimeEqual(signature, expected);
  if (!isSignatureValid) return { isValid: false };

  try {
    const user = JSON.parse(decodeURIComponent(userPayloadRaw)) as SessionUserData;
    return { isValid: true, user };
  } catch {
    return { isValid: false };
  }
}

export function getSessionMaxAgeSeconds() {
  return hasPrivateSessionSecret() ? DEFAULT_MAX_AGE_SECONDS : NO_PRIVATE_SECRET_MAX_AGE_SECONDS;
}

export async function writeSessionCookie(userData?: SessionUserData): Promise<void> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = await createSignedSessionToken(userData);
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: getSessionMaxAgeSeconds(),
  });
}

export async function verifySession(): Promise<{ success: boolean; error?: string; user?: SessionUserData }> {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const { isValid, user } = await verifySignedSessionToken(token);
    if (!isValid) {
      return { success: false, error: 'Sesión no válida o expirada.' };
    }
    return { success: true, user };
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

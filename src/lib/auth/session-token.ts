export const SESSION_COOKIE_NAME = 'ak_session';

const SESSION_VERSION = 'v1';
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const NO_PRIVATE_SECRET_MAX_AGE_SECONDS = 60 * 60 * 24;

export function hasPrivateSessionSecret() {
  return Boolean(process.env.AK_SESSION_SECRET || process.env.AUTH_SESSION_SECRET || process.env.SESSION_SECRET);
}

function getSigningSecret() {
  return (
    process.env.AK_SESSION_SECRET ||
    process.env.AUTH_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
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

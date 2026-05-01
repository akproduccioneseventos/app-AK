export const SESSION_COOKIE = 'ak_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const TOKEN_VERSION = 1;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

interface SessionTokenPayload {
  v: typeof TOKEN_VERSION;
  iat: number;
  exp: number;
  nonce: string;
}

function getSessionSigningSecret(): string {
  const secret =
    process.env.AUTH_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.GOOGLE_API_KEY;

  if (secret?.trim()) {
    return secret;
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'ak-dev-session-secret';
  }

  throw new Error('AUTH_SESSION_SECRET is required to sign production sessions.');
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function stringToBase64Url(value: string): string {
  return bytesToBase64Url(encoder.encode(value));
}

function base64UrlToString(value: string): string {
  const base64 = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return decoder.decode(bytes);
}

function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

function decodePayload(payloadPart: string): SessionTokenPayload | null {
  try {
    const payload = JSON.parse(base64UrlToString(payloadPart)) as Partial<SessionTokenPayload>;
    if (
      payload.v !== TOKEN_VERSION ||
      typeof payload.iat !== 'number' ||
      typeof payload.exp !== 'number' ||
      typeof payload.nonce !== 'string'
    ) {
      return null;
    }

    return payload as SessionTokenPayload;
  } catch {
    return null;
  }
}

export async function createSessionToken(now = Date.now()): Promise<string> {
  const payload: SessionTokenPayload = {
    v: TOKEN_VERSION,
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS * 1000,
    nonce: createNonce(),
  };

  const payloadPart = stringToBase64Url(JSON.stringify(payload));
  const signaturePart = await sign(payloadPart, getSessionSigningSecret());

  return `${payloadPart}.${signaturePart}`;
}

export async function verifySessionToken(token: string | null | undefined, now = Date.now()): Promise<boolean> {
  try {
    if (!token || token.length > 2048) return false;

    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [payloadPart, signaturePart] = parts;
    if (!payloadPart || !signaturePart) return false;

    const expectedSignature = await sign(payloadPart, getSessionSigningSecret());
    if (!safeEqual(signaturePart, expectedSignature)) return false;

    const payload = decodePayload(payloadPart);
    if (!payload) return false;

    const clockSkewMs = 60 * 1000;
    if (payload.iat > now + clockSkewMs) return false;
    if (payload.exp <= now - clockSkewMs) return false;

    return true;
  } catch {
    return false;
  }
}

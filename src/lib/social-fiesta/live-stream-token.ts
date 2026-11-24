import crypto from 'crypto';

const STREAM_TOKEN_MAX_AGE_MS = 18 * 60 * 60 * 1000;
let localLiveStreamSecret: string | undefined;

function getLiveStreamSecret(): string {
  const configured =
    process.env.AK_ENTERTAINMENT_SECRET ||
    process.env.AK_SESSION_SECRET ||
    process.env.AUTH_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.AUTH_SECRET;
  if (configured) return configured;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Falta configurar AK_SESSION_SECRET para la transmisión en vivo.');
  }
  localLiveStreamSecret ||= crypto.randomBytes(32).toString('hex');
  return localLiveStreamSecret;
}

function signLiveTokenPayload(payloadB64: string): string {
  return crypto.createHmac('sha256', getLiveStreamSecret()).update(payloadB64).digest('base64url');
}

function timingSafeMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

function createSignedStreamToken(claims: Record<string, unknown>): string {
  const payload = Buffer.from(
    JSON.stringify({ ...claims, exp: Date.now() + STREAM_TOKEN_MAX_AGE_MS }),
  ).toString('base64url');
  return `${payload}.${signLiveTokenPayload(payload)}`;
}

function verifySignedStreamToken(token: string | null | undefined): Record<string, unknown> | null {
  if (!token || typeof token !== 'string') return null;
  const idx = token.lastIndexOf('.');
  if (idx <= 0) return null;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  if (!timingSafeMatch(sig, signLiveTokenPayload(payload))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>;
    if (Number(parsed.exp) <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function createLiveStreamScreenToken(fiestaId: string): string {
  return createSignedStreamToken({ kind: 'live-screen', fiestaId });
}

export function verifyLiveStreamScreenToken(token: string | null | undefined, fiestaId: string): boolean {
  const parsed = verifySignedStreamToken(token);
  return Boolean(parsed && parsed.kind === 'live-screen' && parsed.fiestaId === fiestaId);
}

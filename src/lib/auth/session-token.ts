import crypto from 'crypto';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session-constants';

const SESSION_VERSION = 'v1';
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const NO_PRIVATE_SECRET_MAX_AGE_SECONDS = 60 * 60 * 24;

let localDevelopmentSecret: string | undefined;

export interface SessionUserData {
  email: string;
  role: string;
  userId: string;
  /**
   * Perfil de la persona: dueno, secretaria, operador o personal. Es lo que
   * decide a que entra. `role` queda para las cuentas viejas que todavia no
   * tienen perfil cargado; ver `perfilDesdeRolViejo`.
   */
  perfil?: string;
  modules?: string[];
}

export function hasPrivateSessionSecret() {
  return Boolean(
    process.env.AK_SESSION_SECRET ||
    process.env.AUTH_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.AUTH_SECRET
  );
}

function getSigningSecret() {
  const secret =
    process.env.AK_SESSION_SECRET ||
    process.env.AUTH_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.AUTH_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Falta configurar AK_SESSION_SECRET para firmar las sesiones.');
    }

    localDevelopmentSecret ||= crypto.randomBytes(32).toString('hex');
    return localDevelopmentSecret;
  }

  return secret;
}

async function signPayload(payload: string) {
  return crypto.createHmac('sha256', getSigningSecret()).update(payload).digest('hex');
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
    if (!constantTimeEqual(signature, expected)) {
      console.error('[verifySignedSessionToken] Legacy signature mismatch.');
      return { isValid: false };
    }
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
  if (!isSignatureValid) {
    console.error('[verifySignedSessionToken] Signature mismatch. Expected length:', expected.length, 'Received signature length:', signature.length);
    return { isValid: false };
  }

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
  } catch (error) {
    console.error('[verifySession] Error verifying session:', error);
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

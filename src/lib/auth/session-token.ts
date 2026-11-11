import crypto from 'crypto';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session-constants';

const SESSION_VERSION = 'v1';
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const NO_PRIVATE_SECRET_MAX_AGE_SECONDS = 60 * 60 * 24;

let localDevelopmentSecret: string | undefined;

const listaAccesosAuditorCortados = new Set<string>();

interface AuditorCacheEntry {
  valido: boolean;
  expiraEn: number;
}
const cacheEstadoAuditor = new Map<string, AuditorCacheEntry>();

export function limpiarCacheAuditor(identificador?: string) {
  if (identificador) {
    cacheEstadoAuditor.delete(identificador.toLowerCase().trim());
  } else {
    cacheEstadoAuditor.clear();
  }
}

export function registrarAuditorCortado(identificador: string) {
  if (identificador) {
    const key = identificador.toLowerCase().trim();
    listaAccesosAuditorCortados.add(key);
    cacheEstadoAuditor.delete(key);
  }
}

export function limpiarAuditorCortado(identificador?: string) {
  if (identificador) {
    const key = identificador.toLowerCase().trim();
    listaAccesosAuditorCortados.delete(key);
    cacheEstadoAuditor.delete(key);
  } else {
    listaAccesosAuditorCortados.clear();
    cacheEstadoAuditor.clear();
  }
}

export function estaAuditorCortadoEnMemoria(identificador: string): boolean {
  return listaAccesosAuditorCortados.has(identificador.toLowerCase().trim());
}

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
  versionDeSesion?: number;
}

export function hasPrivateSessionSecret() {
  return Boolean(
    process.env.AK_SESSION_SECRET ||
    process.env.AUTH_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.AUTH_SECRET
  );
}

function getSigningSecret(): string {
  const secret =
    process.env.AK_SESSION_SECRET ||
    process.env.AUTH_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.AUTH_SECRET;

  if (secret) {
    return secret;
  }

  // En el servidor, si falta la variable explícita, podemos derivar de forma segura
  // y determinista a partir de la clave privada de servicio de Firebase (alta entropía,
  // sólo accesible en servidor y compartida entre todas las instancias de Cloud Run).
  const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (firebasePrivateKey && firebasePrivateKey.length >= 32) {
    return crypto.createHash('sha256').update(`ak-session-secret-derivation:${firebasePrivateKey}`).digest('hex');
  }

  // En producción, la ausencia de un secreto privado del servidor debe emitir un
  // diagnóstico de configuración estricto en lugar de generar una clave insegura
  // o una clave aleatoria en memoria que rompería la sesión entre instancias.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Diagnóstico de configuración: Falta configurar una clave privada de sesión (AK_SESSION_SECRET) en el servidor de producción.');
  }

  localDevelopmentSecret ||= crypto.randomBytes(32).toString('hex');
  return localDevelopmentSecret;
}

export async function signPayload(payload: string) {
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
  const tokenUserData: SessionUserData = {
    ...userData,
    ...(typeof userData.versionDeSesion === 'number' ? { versionDeSesion: userData.versionDeSesion } : {}),
  };
  const userPayload = encodeURIComponent(JSON.stringify(tokenUserData));
  const payload = `${SESSION_VERSION}.${expiresAt}.${nonce}.${userPayload}`;
  const signature = await signPayload(payload);
  return `${payload}.${signature}`;
}

export async function verifySignedSessionToken(token?: string | null): Promise<{ isValid: boolean; user?: SessionUserData }> {
  if (!token) return { isValid: false };

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
    if (user && (user.perfil === 'auditor' || user.role === 'auditor')) {
      const email = user.email?.toLowerCase().trim() || '';
      const userId = user.userId?.toLowerCase().trim() || '';
      if ((email && listaAccesosAuditorCortados.has(email)) || (userId && listaAccesosAuditorCortados.has(userId))) {
        return { success: false, error: 'El acceso de auditor fue cerrado.' };
      }

      // Bloque 1 (Orden 279): La base de datos es la autoridad para el acceso del auditor.
      // Cachear el resultado 60 segundos en memoria por usuario para no saturar lecturas.
      const cacheKey = (userId || email).toLowerCase().trim();
      const ahora = Date.now();
      const cached = cacheKey ? cacheEstadoAuditor.get(cacheKey) : undefined;

      if (cached && cached.expiraEn > ahora) {
        if (!cached.valido) {
          return { success: false, error: 'El acceso de auditor fue cerrado.' };
        }
      } else {
        try {
          const { dbAdmin } = await import('@/lib/firebase/server');
          if (!dbAdmin) {
            return { success: false, error: 'Base de datos no disponible para verificar auditor.' };
          }
          const idDoc = user.userId || user.email;
          if (!idDoc) {
            return { success: false, error: 'Usuario auditor sin identificador válido.' };
          }
          const docSnap = await dbAdmin.collection('users').doc(idDoc).get();
          if (!docSnap.exists) {
            if (cacheKey) cacheEstadoAuditor.set(cacheKey, { valido: false, expiraEn: ahora + 60_000 });
            return { success: false, error: 'El acceso de auditor fue cerrado.' };
          }
          const data = docSnap.data();
          const esValido = Boolean(data && data.activo === true && !data.cerradoEl);
          if (cacheKey) {
            cacheEstadoAuditor.set(cacheKey, { valido: esValido, expiraEn: ahora + 60_000 });
          }
          if (!esValido) {
            return { success: false, error: 'El acceso de auditor fue cerrado.' };
          }
        } catch {
          // Pregunta 78: lo roto da menos permisos. Si la lectura falla, no deja pasar.
          return { success: false, error: 'No se pudo verificar el estado del usuario auditor.' };
        }
      }
    }
    return { success: true, user };
  } catch (error: any) {
    if (!error?.message?.includes('outside a request scope')) {
      console.error('[verifySession] Error verifying session:', error);
    }
    return { success: false, error: 'No se pudo verificar la sesión.' };
  }
}

export async function generateBudgetToken(budgetId: string, versionDeEnlace: number = 0): Promise<string> {
  const version = Number(versionDeEnlace) || 0;
  return await signPayload(`budget-token:${budgetId}:${version}`);
}

export async function verifyBudgetToken(budgetId: string, token: string, versionDeEnlace: number = 0): Promise<boolean> {
  if (!token) return false;
  const version = Number(versionDeEnlace) || 0;
  const expected = await signPayload(`budget-token:${budgetId}:${version}`);
  if (constantTimeEqual(token, expected)) return true;
  if (version === 0) {
    const legacy = await signPayload(`budget-token:${budgetId}`);
    if (constantTimeEqual(token, legacy)) return true;
  }
  return false;
}

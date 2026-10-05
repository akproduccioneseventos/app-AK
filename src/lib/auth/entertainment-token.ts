import 'server-only';

import crypto from 'crypto';

import { hasAppSession } from '@/lib/auth/require-session';
import { requireEventPermission } from '@/lib/auth/event-access';
import { PERMISOS } from '@/lib/auth/perfiles';
import type { EntertainmentModuleId } from '@/lib/entertainment/station-config';

const TOKEN_VERSION = 'ent-v2';
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 18;
let localDevelopmentSecret: string | undefined;

export type EntertainmentAccessScope = 'guest' | 'operator';

function getSecret() {
  const configuredSecret =
    process.env.AK_ENTERTAINMENT_SECRET ||
    process.env.AK_SESSION_SECRET ||
    process.env.AUTH_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.AUTH_SECRET;

  if (configuredSecret) return configuredSecret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Falta configurar AK_SESSION_SECRET para las estaciones de entretenimiento.');
  }

  localDevelopmentSecret ||= crypto.randomBytes(32).toString('hex');
  return localDevelopmentSecret;
}

function sign(payload: string) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

function signaturesMatch(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export function createEntertainmentAccessToken(
  fiestaId: string,
  moduleId: EntertainmentModuleId,
  scope: EntertainmentAccessScope,
  maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS
) {
  const payload = Buffer.from(
    JSON.stringify({
      version: TOKEN_VERSION,
      fiestaId,
      moduleId,
      scope,
      expiresAt: Date.now() + maxAgeSeconds * 1000,
      nonce: crypto.randomUUID(),
    })
  ).toString('base64url');

  return `${payload}.${sign(payload)}`;
}

export function verifyEntertainmentAccessToken(
  token: string | null | undefined,
  fiestaId: string,
  moduleId: string,
  expectedScope: EntertainmentAccessScope
) {
  if (!token) return false;
  const separator = token.lastIndexOf('.');
  if (separator <= 0) return false;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!signaturesMatch(signature, sign(payload))) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return (
      parsed.version === TOKEN_VERSION &&
      parsed.fiestaId === fiestaId &&
      parsed.moduleId === moduleId &&
      (parsed.scope === expectedScope ||
        (expectedScope === 'guest' && parsed.scope === 'operator')) &&
      Number(parsed.expiresAt) > Date.now()
    );
  } catch {
    return false;
  }
}

export async function hasEntertainmentControlAccess(
  fiestaId: string,
  moduleId: string,
  token?: string | null
) {
  // Tener sesión no alcanza (Codex, auditoría 66): el personal y el operador de otra fiesta también
  // la tienen. Desde la sesión, hace falta la noche o la organización y, si es operador, estar
  // asignado a esta fiesta. Sin sesión, sigue valiendo el permiso de operador de la estación.
  if (await hasAppSession()) {
    try {
      await requireEventPermission(fiestaId, [PERMISOS.NOCHE, PERMISOS.ORGANIZACION]);
      return true;
    } catch {
      // cae al permiso de la estación
    }
  }
  return verifyEntertainmentAccessToken(token, fiestaId, moduleId, 'operator');
}

export async function hasEntertainmentGuestAccess(
  fiestaId: string,
  moduleId: string,
  token?: string | null
) {
  if (await hasAppSession()) return true;
  return verifyEntertainmentAccessToken(token, fiestaId, moduleId, 'guest');
}

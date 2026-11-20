import crypto from 'crypto';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

const TOKEN_VERSION = 'mod-v1';
const DEFAULT_DURATION_MS = 18 * 60 * 60 * 1000;
let localDevSecret: string | undefined;

function getModeratorSecret(): string {
  const configured =
    process.env.AK_ENTERTAINMENT_SECRET ||
    process.env.AK_SESSION_SECRET ||
    process.env.AUTH_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.AUTH_SECRET;

  if (configured) return configured;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Falta configurar AK_SESSION_SECRET para enlaces de moderación.');
  }
  localDevSecret ||= crypto.randomBytes(32).toString('hex');
  return localDevSecret;
}

function signPayload(payload: string): string {
  return crypto.createHmac('sha256', getModeratorSecret()).update(payload).digest('base64url');
}

function signaturesEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

function parseMinutes(hhmm?: string): number | null {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm.trim())) return null;
  const [h, m] = hhmm.trim().split(':').map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

/**
 * Calcula cuándo termina la fiesta en milisegundos UTC (zona horaria Uruguay -03:00).
 * Si la fiesta ya fue cancelada, suspendida o finalizada, devuelve 0.
 */
export function computePartyExpirationMs(
  fiesta?: Pick<FiestaEnPlanificacion, 'configuracion' | 'estado'> | null,
  nowMs: number = Date.now(),
): number {
  if (!fiesta) return nowMs + DEFAULT_DURATION_MS;
  const estado = (fiesta.estado || '').trim().toLowerCase();
  if (estado === 'cancelada' || estado === 'suspendida' || estado === 'finalizada') {
    return 0;
  }

  const rawDate = fiesta.configuracion?.fechaEvento?.trim();
  if (!rawDate) {
    return nowMs + DEFAULT_DURATION_MS;
  }

  const dateMatch = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!dateMatch) {
    const parsed = Date.parse(rawDate);
    return Number.isFinite(parsed) ? parsed + DEFAULT_DURATION_MS : nowMs + DEFAULT_DURATION_MS;
  }

  const [, yStr, mStr, dStr] = dateMatch;
  const startMin = parseMinutes(fiesta.configuracion?.horaInicio) ?? 20 * 60;
  const endMin = parseMinutes(fiesta.configuracion?.horaFin) ?? 5 * 60;

  // Hora Uruguay UTC-3 (sin horario de verano actualmente)
  const baseDateUtcMs = Date.UTC(Number(yStr), Number(mStr) - 1, Number(dStr), 3, 0, 0, 0);
  const crossesMidnight = endMin <= startMin;
  const dayOffsetMs = crossesMidnight ? 24 * 60 * 60 * 1000 : 0;
  return baseDateUtcMs + dayOffsetMs + endMin * 60 * 1000;
}

/**
 * Crea un enlace/token temporal HMAC exclusivo para moderación familiar de UNA fiesta.
 * Sólo habilita aprobar, ocultar, borrar y bloquear en esa fiesta hasta que termine.
 */
export function createFamilyModeratorToken(
  fiestaId: string,
  expiresAtMs: number,
): string {
  const payload = Buffer.from(
    JSON.stringify({
      version: TOKEN_VERSION,
      fiestaId,
      scope: 'family-moderator',
      expiresAt: expiresAtMs,
      nonce: crypto.randomUUID(),
    }),
  ).toString('base64url');
  return `${payload}.${signPayload(payload)}`;
}

/**
 * Valida un token de moderador familiar contra la fiesta y la hora actual.
 * Nunca da acceso a otra fiesta ni al panel del equipo.
 */
export function verifyFamilyModeratorToken(
  token: string | null | undefined,
  fiestaId: string,
  fiesta?: Pick<FiestaEnPlanificacion, 'configuracion' | 'estado'> | null,
  nowMs: number = Date.now(),
): boolean {
  if (!token || !fiestaId) return false;
  const dotIdx = token.lastIndexOf('.');
  if (dotIdx <= 0) return false;

  const payload = token.slice(0, dotIdx);
  const signature = token.slice(dotIdx + 1);
  if (!signaturesEqual(signature, signPayload(payload))) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (
      parsed.version !== TOKEN_VERSION ||
      parsed.fiestaId !== fiestaId ||
      parsed.scope !== 'family-moderator'
    ) {
      return false;
    }

    const tokenExpiry = Number(parsed.expiresAt);
    if (!Number.isFinite(tokenExpiry) || tokenExpiry <= nowMs) {
      return false;
    }

    if (fiesta) {
      const partyExpiry = computePartyExpirationMs(fiesta, nowMs);
      if (partyExpiry <= nowMs) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

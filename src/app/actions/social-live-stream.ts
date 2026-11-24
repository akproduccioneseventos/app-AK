'use server';

import type { Firestore, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import crypto from 'crypto';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { LECTURA_COMPLETA } from '@/lib/fiesta/lectura-completa';
import { sinBaseDisponible } from '@/lib/firebase/modo-local';
import { readData, writeData } from '@/lib/data-service';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { requireEventPermission } from '@/lib/auth/event-access';
import { hasAppSession } from '@/lib/auth/require-session';
import { hasPublicGuestAccess } from '@/lib/guest-portal-public-data';
import { PERMISOS } from '@/lib/auth/perfiles';
import { sanitizeSocialText } from '@/lib/social-fiesta/content-review';
import { isZonaDigitalFeatureEnabled } from '@/lib/zona-digital-adolescentes';
import {
  LIVE_STREAM_MAX_DURATION_SECONDS,
  shouldDisplayLiveStreamOnScreen,
  type LiveStreamRequest,
} from '@/lib/social-fiesta/transmision-invitado';
import { isUploaderBlocked, type BlockedSocialGuest } from '@/lib/social-fiesta/moderacion-bloqueos';

const LIVE_STREAM_COLLECTION = 'social_live_streams';
const BLOCKED_GUESTS_COLLECTION = 'social_blocked_guests';
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

import {
  createLiveStreamScreenToken,
  verifyLiveStreamScreenToken,
} from '@/lib/social-fiesta/live-stream-token';

function createLiveStreamCallerToken(fiestaId: string, requestId: string, guestKey: string): string {
  return createSignedStreamToken({ kind: 'live-caller', fiestaId, requestId, guestKey });
}

function verifyLiveStreamCallerToken(
  token: string | null | undefined,
  fiestaId: string,
  requestId: string,
  guestKey: string,
): boolean {
  const parsed = verifySignedStreamToken(token);
  return Boolean(
    parsed &&
      parsed.kind === 'live-caller' &&
      parsed.fiestaId === fiestaId &&
      parsed.requestId === requestId &&
      parsed.guestKey === guestKey,
  );
}

async function isScreenAuthorizedForStream(fiestaId: string, screenToken?: string): Promise<boolean> {
  if (verifyLiveStreamScreenToken(screenToken, fiestaId)) return true;
  if (await hasAppSession()) {
    try {
      await requireEventPermission(fiestaId, [PERMISOS.NOCHE, PERMISOS.ORGANIZACION]);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

async function isGuestAuthorizedForStream(
  fiestaId: string,
  current: LiveStreamRequest,
  credentials?: { guestId?: string; guestAccessToken?: string; callerToken?: string },
): Promise<boolean> {
  if (await hasAppSession()) return true;
  if (
    credentials?.callerToken &&
    verifyLiveStreamCallerToken(credentials.callerToken, fiestaId, current.id, current.guestKey)
  ) {
    return true;
  }
  const token = credentials?.guestAccessToken?.trim();
  if (!token) return false;
  const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
  if (!fiesta) return false;
  const candidateGuestId = credentials?.guestId?.trim() || current.guestKey;
  if (candidateGuestId !== current.guestKey) return false;
  const guest = fiesta.invitados?.find((item) => item.id === candidateGuestId);
  return hasPublicGuestAccess(guest, candidateGuestId, token);
}

export async function getLiveStreamScreenToken(
  fiestaId: string,
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    await requireEventPermission(fiestaId, [PERMISOS.NOCHE, PERMISOS.ORGANIZACION]);
    return { success: true, token: createLiveStreamScreenToken(fiestaId) };
  } catch (e: any) {
    return { success: false, error: e?.message || 'No autorizado.' };
  }
}

async function getDb(): Promise<Firestore> {
  const { dbAdmin } = await import('@/lib/firebase/server');
  if (!dbAdmin) throw new Error('Firestore no disponible.');
  return dbAdmin as Firestore;
}

async function readEventStreams(fiestaId: string): Promise<LiveStreamRequest[]> {
  if (sinBaseDisponible()) {
    return readData<LiveStreamRequest[]>(`social-gallery/live-streams-${fiestaId}.json`, []);
  }
  const db = await getDb();
  const snap = await db
    .collection(LIVE_STREAM_COLLECTION)
    .where('fiestaId', '==', fiestaId)
    .get();
  return snap.docs.map((doc: QueryDocumentSnapshot) => doc.data() as LiveStreamRequest);
}

async function writeEventStream(req: LiveStreamRequest): Promise<void> {
  if (sinBaseDisponible()) {
    const list = await readEventStreams(req.fiestaId);
    const filtered = list.filter((item) => item.id !== req.id);
    await writeData(`social-gallery/live-streams-${req.fiestaId}.json`, [req, ...filtered]);
    return;
  }
  const db = await getDb();
  await db.collection(LIVE_STREAM_COLLECTION).doc(req.id).set(req);
}

async function getBlockedList(fiestaId: string): Promise<BlockedSocialGuest[]> {
  if (sinBaseDisponible()) {
    return readData<BlockedSocialGuest[]>(`social-gallery/blocked-${fiestaId}.json`, []);
  }
  const db = await getDb();
  const snap = await db
    .collection(BLOCKED_GUESTS_COLLECTION)
    .where('fiestaId', '==', fiestaId)
    .get();
  return snap.docs.map((doc: QueryDocumentSnapshot) => doc.data() as BlockedSocialGuest);
}

/**
 * El invitado solicita salir en vivo en la pantalla gigante (envía su offer SDP WebRTC).
 * Queda en estado 'pending' hasta que el operador acepte manualmente.
 */
export async function requestLiveStream(
  fiestaId: string,
  input: {
    authorName: string;
    offerSdp: string;
    guestId?: string;
    guestAccessToken?: string;
    dispositivoId?: string;
  },
): Promise<{ success: boolean; request?: LiveStreamRequest; callerToken?: string; error?: string }> {
  try {
    const guestKey = input.guestId?.trim() || input.dispositivoId?.trim() || 'anon';
    await enforcePublicRateLimit({
      scope: 'social-live-stream-request',
      identity: `${fiestaId}:${guestKey}`,
      limit: 10,
      windowMs: 60_000,
    });

    const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };

    if (input.guestId?.trim() && !(await hasAppSession())) {
      const guest = fiesta.invitados?.find((item) => item.id === input.guestId!.trim());
      if (!hasPublicGuestAccess(guest, input.guestId.trim(), input.guestAccessToken || '')) {
        return { success: false, error: 'Credencial de invitado no válida.' };
      }
    }

    if (!isZonaDigitalFeatureEnabled(fiesta.zonaDigitalAdolescentes, 'transmision_invitado')) {
      return {
        success: false,
        error: 'La transmisión en vivo desde celular no está habilitada para este evento.',
      };
    }

    const authorName = sanitizeSocialText(input.authorName || 'Invitado') || 'Invitado';
    const blocked = await getBlockedList(fiestaId).catch(() => []);
    if (
      isUploaderBlocked(blocked, {
        guestId: input.guestId,
        dispositivoId: input.dispositivoId,
        authorName,
      })
    ) {
      return {
        success: false,
        error: 'Tu contenido fue reportado y no podés solicitar transmisión en esta fiesta.',
      };
    }

    if (!input.offerSdp || input.offerSdp.length > 32_000) {
      return { success: false, error: 'Señal WebRTC inválida.' };
    }

    const req: LiveStreamRequest = {
      id: `live_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      fiestaId,
      guestKey,
      authorName,
      status: 'pending',
      offerSdp: input.offerSdp,
      callerCandidates: [],
      calleeCandidates: [],
      createdAt: new Date().toISOString(),
      maxDurationSeconds: LIVE_STREAM_MAX_DURATION_SECONDS,
    };

    await writeEventStream(req);
    const callerToken = createLiveStreamCallerToken(fiestaId, req.id, guestKey);
    return { success: true, request: req, callerToken };
  } catch (e: any) {
    return { success: false, error: e.message || 'No se pudo enviar el pedido en vivo.' };
  }
}

export async function pushLiveStreamIceCandidate(
  fiestaId: string,
  requestId: string,
  role: 'caller' | 'callee',
  candidateJson: string,
  credentials?: { guestId?: string; guestAccessToken?: string; callerToken?: string; screenToken?: string },
): Promise<{ success: boolean }> {
  try {
    await enforcePublicRateLimit({
      scope: 'social-live-stream-ice',
      identity: `${fiestaId}:${requestId}:${role}`,
      limit: 60,
      windowMs: 60_000,
    });

    if (!candidateJson || candidateJson.length > 4096) return { success: false };
    const list = await readEventStreams(fiestaId);
    const current = list.find((item) => item.id === requestId);
    if (!current) return { success: false };

    if (role === 'caller') {
      if (!(await isGuestAuthorizedForStream(fiestaId, current, credentials))) {
        return { success: false };
      }
    } else {
      if (!(await isScreenAuthorizedForStream(fiestaId, credentials?.screenToken))) {
        return { success: false };
      }
      if (current.status !== 'accepted' && current.status !== 'live') {
        return { success: false };
      }
    }

    const updated: LiveStreamRequest =
      role === 'caller'
        ? {
            ...current,
            callerCandidates: [...(current.callerCandidates ?? []).slice(-25), candidateJson],
          }
        : {
            ...current,
            calleeCandidates: [...(current.calleeCandidates ?? []).slice(-25), candidateJson],
          };

    await writeEventStream(updated);
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function getGuestLiveStreamStatus(
  fiestaId: string,
  requestId: string,
  credentials?: { guestId?: string; guestAccessToken?: string; callerToken?: string },
): Promise<{ success: boolean; request?: LiveStreamRequest | null }> {
  try {
    await enforcePublicRateLimit({
      scope: 'social-live-stream-status',
      identity: `${fiestaId}:${requestId}`,
      limit: 120,
      windowMs: 60_000,
    });
    const list = await readEventStreams(fiestaId);
    const current = list.find((item) => item.id === requestId) ?? null;
    if (!current || !(await isGuestAuthorizedForStream(fiestaId, current, credentials))) {
      return { success: false, request: null };
    }
    if (
      (current.status === 'accepted' || current.status === 'live') &&
      !shouldDisplayLiveStreamOnScreen(current)
    ) {
      const ended: LiveStreamRequest = {
        ...current,
        status: 'ended',
        endedAt: new Date().toISOString(),
      };
      await writeEventStream(ended);
      return { success: true, request: ended };
    }
    return { success: true, request: current };
  } catch {
    return { success: false, request: null };
  }
}

/**
 * Devuelve a la pantalla gigante (`/evento/muro-en-vivo`) únicamente la transmisión
 * que ya fue ACEPTADA por el operador y sigue dentro del tope de 60 segundos.
 */
export async function getActiveLiveStreamForScreen(
  fiestaId: string,
  screenToken?: string,
): Promise<LiveStreamRequest | null> {
  try {
    await enforcePublicRateLimit({
      scope: 'social-live-stream-screen-read',
      identity: fiestaId,
      limit: 180,
      windowMs: 60_000,
    });
    if (!(await isScreenAuthorizedForStream(fiestaId, screenToken))) {
      return null;
    }
    const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
    if (!fiesta || !isZonaDigitalFeatureEnabled(fiesta.zonaDigitalAdolescentes, 'transmision_invitado')) {
      return null;
    }

    const list = await readEventStreams(fiestaId);
    const candidates = list
      .filter((item) => item.status === 'accepted' || item.status === 'live')
      .sort((a, b) => Date.parse(b.acceptedAt || b.createdAt) - Date.parse(a.acceptedAt || a.createdAt));

    const active = candidates[0];
    if (!active) return null;

    if (!shouldDisplayLiveStreamOnScreen(active)) {
      await writeEventStream({
        ...active,
        status: 'ended',
        endedAt: new Date().toISOString(),
      });
      return null;
    }

    return active;
  } catch {
    return null;
  }
}

export async function submitScreenLiveStreamAnswer(
  fiestaId: string,
  requestId: string,
  answerSdp: string,
  calleeCandidates: string[] = [],
  screenToken?: string,
): Promise<{ success: boolean }> {
  try {
    await enforcePublicRateLimit({
      scope: 'social-live-stream-answer',
      identity: `${fiestaId}:${requestId}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!(await isScreenAuthorizedForStream(fiestaId, screenToken))) {
      return { success: false };
    }
    if (!answerSdp || answerSdp.length > 32_000) {
      return { success: false };
    }
    const list = await readEventStreams(fiestaId);
    const current = list.find((item) => item.id === requestId);
    if (!current || !shouldDisplayLiveStreamOnScreen(current)) return { success: false };

    await writeEventStream({
      ...current,
      status: 'live',
      answerSdp,
      calleeCandidates: calleeCandidates.slice(-25),
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Consola del operador (`/evento/control-pantalla`): lista pedidos pendientes y transmisión activa.
 */
export async function getLiveStreamRequestsForOperator(
  fiestaId: string,
): Promise<{ success: boolean; requests: LiveStreamRequest[]; featureEnabled: boolean; error?: string }> {
  try {
    const fiesta = await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    const featureEnabled = isZonaDigitalFeatureEnabled(
      fiesta.zonaDigitalAdolescentes,
      'transmision_invitado',
    );
    const list = await readEventStreams(fiestaId);
    const now = Date.now();
    const cleaned: LiveStreamRequest[] = [];

    for (const item of list) {
      if (
        (item.status === 'accepted' || item.status === 'live') &&
        !shouldDisplayLiveStreamOnScreen(item, now)
      ) {
        const ended: LiveStreamRequest = {
          ...item,
          status: 'ended',
          endedAt: new Date(now).toISOString(),
        };
        await writeEventStream(ended);
        cleaned.push(ended);
      } else {
        cleaned.push(item);
      }
    }

    const sorted = cleaned
      .filter((item) => item.status === 'pending' || item.status === 'accepted' || item.status === 'live')
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    return { success: true, requests: sorted, featureEnabled };
  } catch (e: any) {
    return { success: false, requests: [], featureEnabled: false, error: e.message };
  }
}

export async function acceptLiveStreamRequest(
  fiestaId: string,
  requestId: string,
): Promise<{ success: boolean; request?: LiveStreamRequest; error?: string }> {
  try {
    await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    const list = await readEventStreams(fiestaId);
    const target = list.find((item) => item.id === requestId);
    if (!target) return { success: false, error: 'Pedido no encontrado.' };

    const nowIso = new Date().toISOString();
    // Cortar cualquier transmisión activa previa
    for (const item of list) {
      if (item.id !== requestId && (item.status === 'accepted' || item.status === 'live')) {
        await writeEventStream({ ...item, status: 'ended', endedAt: nowIso });
      }
    }

    const accepted: LiveStreamRequest = {
      ...target,
      status: 'accepted',
      acceptedAt: nowIso,
      maxDurationSeconds: LIVE_STREAM_MAX_DURATION_SECONDS,
    };
    await writeEventStream(accepted);
    return { success: true, request: accepted };
  } catch (e: any) {
    return { success: false, error: e.message || 'No se pudo aceptar la transmisión.' };
  }
}

export async function rejectLiveStreamRequest(
  fiestaId: string,
  requestId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    const list = await readEventStreams(fiestaId);
    const target = list.find((item) => item.id === requestId);
    if (!target) return { success: false, error: 'Pedido no encontrado.' };

    await writeEventStream({
      ...target,
      status: 'rejected',
      endedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'No se pudo rechazar el pedido.' };
  }
}

export async function stopLiveStreamRequest(
  fiestaId: string,
  requestId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    const list = await readEventStreams(fiestaId);
    const target = list.find((item) => item.id === requestId);
    if (!target) return { success: false, error: 'Transmisión no encontrada.' };

    await writeEventStream({
      ...target,
      status: 'ended',
      endedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'No se pudo cortar la transmisión.' };
  }
}

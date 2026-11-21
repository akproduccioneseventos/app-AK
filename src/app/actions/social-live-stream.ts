'use server';

import type { Firestore, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { LECTURA_COMPLETA } from '@/lib/fiesta/lectura-completa';
import { sinBaseDisponible } from '@/lib/firebase/modo-local';
import { readData, writeData } from '@/lib/data-service';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { requireEventPermission } from '@/lib/auth/event-access';
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
): Promise<{ success: boolean; request?: LiveStreamRequest; error?: string }> {
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
    return { success: true, request: req };
  } catch (e: any) {
    return { success: false, error: e.message || 'No se pudo enviar el pedido en vivo.' };
  }
}

export async function pushLiveStreamIceCandidate(
  fiestaId: string,
  requestId: string,
  role: 'caller' | 'callee',
  candidateJson: string,
  credentials?: { guestAccessToken?: string },
): Promise<{ success: boolean }> {
  try {
    void credentials?.guestAccessToken;
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

    if (role === 'callee' && current.status !== 'accepted' && current.status !== 'live') {
      return { success: false };
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
  credentials?: { guestAccessToken?: string },
): Promise<{ success: boolean; request?: LiveStreamRequest | null }> {
  try {
    void credentials?.guestAccessToken;
    await enforcePublicRateLimit({
      scope: 'social-live-stream-status',
      identity: `${fiestaId}:${requestId}`,
      limit: 120,
      windowMs: 60_000,
    });
    const list = await readEventStreams(fiestaId);
    const current = list.find((item) => item.id === requestId) ?? null;
    if (
      current &&
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
): Promise<LiveStreamRequest | null> {
  try {
    await enforcePublicRateLimit({
      scope: 'social-live-stream-screen-read',
      identity: fiestaId,
      limit: 180,
      windowMs: 60_000,
    });
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
): Promise<{ success: boolean }> {
  try {
    await enforcePublicRateLimit({
      scope: 'social-live-stream-answer',
      identity: `${fiestaId}:${requestId}`,
      limit: 20,
      windowMs: 60_000,
    });
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

'use server';

import crypto from 'crypto';
import { Firestore } from 'firebase-admin/firestore';
import {
  hasEntertainmentControlAccess,
  hasEntertainmentGuestAccess,
} from '@/lib/auth/entertainment-token';
import {
  getEntertainmentStationConfig,
  isEntertainmentModuleId,
} from '@/lib/entertainment/station-config';
import { getFiestaById } from './fiesta.actions';

const SESIONES_COLLECTION = 'entretenimiento_sesiones';
const SESSION_MAX_AGE_MS = 12 * 60 * 1000;

const VALID_STATUS_TRANSITIONS: Record<EntertainmentSession['status'], EntertainmentSession['status'][]> = {
  idle: ['countdown'],
  countdown: ['recording', 'idle'],
  recording: ['processing', 'done', 'idle'],
  processing: ['done', 'idle'],
  done: ['processing', 'idle', 'countdown'],
};

async function getDb(): Promise<Firestore> {
  const { dbAdmin } = await import('@/lib/firebase/server');
  if (!dbAdmin) throw new Error('Firestore no disponible.');
  return dbAdmin as Firestore;
}

async function isStationEnabled(fiestaId: string, moduleId: string) {
  if (!isEntertainmentModuleId(moduleId)) return false;
  const fiesta = await getFiestaById(fiestaId);
  return Boolean(fiesta && getEntertainmentStationConfig(fiesta, moduleId).enabled);
}

export interface EntertainmentSession {
  fiestaId: string;
  moduleId: string;
  status: 'idle' | 'countdown' | 'recording' | 'processing' | 'done';
  timestamp: string;
  settings?: {
    duration?: number;
    frameId?: string;
    mode?: string;
    [key: string]: any;
  };
  mediaUrl?: string;
  reviewPending?: boolean;
  captureId?: string;
  version?: number;
  expiresAt?: string;
  lastUpdated: string;
}

function boundedText(value: unknown, maxLength: number): string | undefined {
  return typeof value === 'string' && value.length <= maxLength ? value : undefined;
}

function boundedNumber(value: unknown, min: number, max: number): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : undefined;
}

function sanitizeSessionSettings(input: unknown): EntertainmentSession['settings'] {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const source = input as Record<string, unknown>;
  return {
    duration: boundedNumber(source.duration, 1, 120),
    countdownSeconds: boundedNumber(source.countdownSeconds, 1, 15),
    frameCount: boundedNumber(source.frameCount, 1, 60),
    frameId: boundedText(source.frameId, 80),
    mode: boundedText(source.mode, 40),
    characterId: boundedText(source.characterId, 80),
    themeId: boundedText(source.themeId, 80),
    operatorName: boundedText(source.operatorName, 120),
    stationTitle: boundedText(source.stationTitle, 120),
  };
}

function sanitizeSessionUpdate(input: unknown): Pick<EntertainmentSession, 'mediaUrl' | 'reviewPending'> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const source = input as Record<string, unknown>;
  const mediaUrl = boundedText(source.mediaUrl, 2_048);
  const safeMediaUrl = mediaUrl && (/^https?:\/\//i.test(mediaUrl) || mediaUrl.startsWith('/'))
    ? mediaUrl
    : undefined;
  return {
    ...(safeMediaUrl ? { mediaUrl: safeMediaUrl } : {}),
    ...(typeof source.reviewPending === 'boolean' ? { reviewPending: source.reviewPending } : {}),
  };
}

export async function getEntertainmentSession(
  fiestaId: string,
  moduleId: string,
  accessToken?: string
): Promise<EntertainmentSession | null> {
  try {
    if (!fiestaId || fiestaId.length > 160 || !isEntertainmentModuleId(moduleId)) return null;
    if (!(await hasEntertainmentGuestAccess(fiestaId, moduleId, accessToken))) return null;
    if (!(await isStationEnabled(fiestaId, moduleId))) return null;
    if (process.env.AK_USE_LOCAL_JSON_ONLY === 'true') return null;
    const db = await getDb();
    const docId = `${fiestaId}_${moduleId}`;
    const snap = await db.collection(SESIONES_COLLECTION).doc(docId).get();
    if (!snap.exists) return null;
    return snap.data() as EntertainmentSession;
  } catch (e) {
    console.error(`[sesion-entretenimiento] Error en getEntertainmentSession:`, e);
    return null;
  }
}

export async function startEntertainmentSession(
  fiestaId: string,
  moduleId: string,
  settings: any = {},
  accessToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!fiestaId || fiestaId.length > 160 || !isEntertainmentModuleId(moduleId)) {
      return { success: false, error: 'Modulo de entretenimiento no valido.' };
    }
    if (!(await hasEntertainmentControlAccess(fiestaId, moduleId, accessToken))) {
      return { success: false, error: 'Acceso de operador no autorizado.' };
    }
    if (!(await isStationEnabled(fiestaId, moduleId))) {
      return { success: false, error: 'Esta estacion esta desactivada.' };
    }
    const db = await getDb();
    const docId = `${fiestaId}_${moduleId}`;
    const sessionData: EntertainmentSession = {
      fiestaId,
      moduleId,
      status: 'countdown',
      timestamp: new Date().toISOString(),
      settings: sanitizeSessionSettings(settings),
      captureId: crypto.randomUUID(),
      version: 1,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE_MS).toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    await db.collection(SESIONES_COLLECTION).doc(docId).set(sessionData);
    return { success: true };
  } catch (e: any) {
    console.error(`[sesion-entretenimiento] Error en startEntertainmentSession:`, e);
    return { success: false, error: e.message };
  }
}

export async function updateEntertainmentSessionStatus(
  fiestaId: string,
  moduleId: string,
  status: EntertainmentSession['status'],
  extraData: any = {},
  accessToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!fiestaId || fiestaId.length > 160 || !isEntertainmentModuleId(moduleId)) {
      return { success: false, error: 'Modulo de entretenimiento no valido.' };
    }
    if (!(await hasEntertainmentGuestAccess(fiestaId, moduleId, accessToken))) {
      return { success: false, error: 'Acceso de estacion no autorizado.' };
    }
    if (!(await isStationEnabled(fiestaId, moduleId))) {
      return { success: false, error: 'Esta estacion esta desactivada.' };
    }
    const db = await getDb();
    const docId = `${fiestaId}_${moduleId}`;
    const docRef = db.collection(SESIONES_COLLECTION).doc(docId);
    const result = await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      const current = snap.exists ? snap.data() as EntertainmentSession : null;
      if (current && (current.fiestaId !== fiestaId || current.moduleId !== moduleId)) return 'invalid-session';

      const now = new Date();
      const expired = current?.expiresAt
        ? new Date(current.expiresAt).getTime() <= now.getTime()
        : false;
      const currentStatus: EntertainmentSession['status'] = expired
        ? 'idle'
        : current?.status || 'idle';
      const isIdempotent = currentStatus === status;
      if (!isIdempotent && !VALID_STATUS_TRANSITIONS[currentStatus].includes(status)) {
        return 'invalid-transition';
      }

      const nowIso = now.toISOString();
      const startsCapture = currentStatus === 'idle' && status === 'countdown';
      transaction.set(docRef, {
        fiestaId,
        moduleId,
        status,
        timestamp: current?.timestamp || nowIso,
        captureId: startsCapture || !current?.captureId ? crypto.randomUUID() : current.captureId,
        version: (current?.version || 0) + 1,
        expiresAt: new Date(now.getTime() + SESSION_MAX_AGE_MS).toISOString(),
        lastUpdated: nowIso,
        ...sanitizeSessionUpdate(extraData),
      }, { merge: true });
      return 'updated';
    });
    if (result === 'invalid-session') {
      return { success: false, error: 'La sesion no corresponde a esta estacion.' };
    }
    if (result === 'invalid-transition') {
      return { success: false, error: 'La transicion solicitada no es valida para el estado actual.' };
    }
    return { success: true };
  } catch (e: any) {
    console.error(`[sesion-entretenimiento] Error en updateEntertainmentSessionStatus:`, e);
    return { success: false, error: e.message };
  }
}

export async function resetEntertainmentSession(
  fiestaId: string,
  moduleId: string,
  accessToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!fiestaId || fiestaId.length > 160 || !isEntertainmentModuleId(moduleId)) {
      return { success: false, error: 'Modulo de entretenimiento no valido.' };
    }
    if (!(await hasEntertainmentControlAccess(fiestaId, moduleId, accessToken))) {
      return { success: false, error: 'Acceso de operador no autorizado.' };
    }
    if (!(await isStationEnabled(fiestaId, moduleId))) {
      return { success: false, error: 'Esta estacion esta desactivada.' };
    }
    const db = await getDb();
    const docId = `${fiestaId}_${moduleId}`;
    await db.collection(SESIONES_COLLECTION).doc(docId).set({
      fiestaId,
      moduleId,
      status: 'idle',
      timestamp: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    });
    return { success: true };
  } catch (e: any) {
    console.error(`[sesion-entretenimiento] Error en resetEntertainmentSession:`, e);
    return { success: false, error: e.message };
  }
}

export async function completeEntertainmentSessionCycle(
  fiestaId: string,
  moduleId: string,
  accessToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!fiestaId || fiestaId.length > 160 || !isEntertainmentModuleId(moduleId)) {
      return { success: false, error: 'Modulo de entretenimiento no valido.' };
    }
    if (!(await hasEntertainmentGuestAccess(fiestaId, moduleId, accessToken))) {
      return { success: false, error: 'Acceso de estacion no autorizado.' };
    }
    if (!(await isStationEnabled(fiestaId, moduleId))) {
      return { success: false, error: 'Esta estacion esta desactivada.' };
    }

    const db = await getDb();
    const docId = `${fiestaId}_${moduleId}`;
    const docRef = db.collection(SESIONES_COLLECTION).doc(docId);
    const result = await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) return 'idle';

      const session = snap.data() as EntertainmentSession;
      if (session.fiestaId !== fiestaId || session.moduleId !== moduleId) return 'invalid';
      if (session.status === 'idle') return 'idle';
      if (session.status !== 'done') return 'active';

      const now = new Date().toISOString();
      transaction.set(docRef, {
        fiestaId,
        moduleId,
        status: 'idle',
        timestamp: now,
        lastUpdated: now,
      });
      return 'completed';
    });

    if (result === 'active') {
      return { success: false, error: 'La sesion todavia esta activa.' };
    }
    if (result === 'invalid') {
      return { success: false, error: 'La sesion no corresponde a esta estacion.' };
    }
    return { success: true };
  } catch (e: any) {
    console.error(`[sesion-entretenimiento] Error en completeEntertainmentSessionCycle:`, e);
    return { success: false, error: e.message };
  }
}

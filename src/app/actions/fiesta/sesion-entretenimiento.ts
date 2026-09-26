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
  /**
   * Ultimo problema que vio el invitado parado frente a la estacion.
   *
   * Existe porque el operador trabajaba a ciegas: si al invitado no le abria la
   * camara o le fallaba la subida, el lo veia en su pantalla y el equipo de AK
   * no se enteraba de nada. Se enteraban cuando alguien se acercaba a quejarse,
   * y para entonces ya se habian ido varios sin su foto. La sesion ya viaja
   * entre las dos pantallas, asi que el aviso viaja con ella.
   */
  lastError?: string | null;
  lastErrorAt?: string | null;
  captureId?: string;
  version?: number;
  expiresAt?: string;
  lastUpdated: string;
}

/**
 * Lo que ve el operador cuando la base falla.
 *
 * Antes se imprimia el error tal cual venia: ingles, nombres de campos y un
 * consejo de programador. En una fiesta eso no ayuda a nadie. El detalle
 * tecnico sigue quedando en el registro del servidor, que es donde sirve.
 */
const MENSAJE_DE_FALLA = 'No se pudo abrir la sesion de la estacion. Toca "Reiniciar sesion" y proba de nuevo; si sigue igual, avisa al equipo de AK.';

function boundedText(value: unknown, maxLength: number): string | undefined {
  return typeof value === 'string' && value.length <= maxLength ? value : undefined;
}

function boundedNumber(value: unknown, min: number, max: number): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : undefined;
}

/**
 * Deja afuera las claves vacias.
 *
 * La base rechaza el documento ENTERO si una sola clave llega vacia, y devuelve
 * un error en ingles que terminaba impreso en la pantalla del operador. Como
 * cada estacion manda solo los ajustes que usa —el 360 no manda `duration`, el
 * espejo no manda `frameCount`—, siempre sobraban claves vacias y **ninguna
 * estacion podia abrir su sesion**: se tocaba "Iniciar cuenta regresiva" y
 * aparecia el error en rojo.
 */
function sinClavesVacias<T extends Record<string, unknown>>(objeto: T): T {
  return Object.fromEntries(
    Object.entries(objeto).filter(([, valor]) => valor !== undefined),
  ) as T;
}

function sanitizeSessionSettings(input: unknown): EntertainmentSession['settings'] {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const source = input as Record<string, unknown>;
  return sinClavesVacias({
    duration: boundedNumber(source.duration, 1, 120),
    countdownSeconds: boundedNumber(source.countdownSeconds, 1, 15),
    frameCount: boundedNumber(source.frameCount, 1, 60),
    frameId: boundedText(source.frameId, 80),
    mode: boundedText(source.mode, 40),
    characterId: boundedText(source.characterId, 80),
    themeId: boundedText(source.themeId, 80),
    operatorName: boundedText(source.operatorName, 120),
    stationTitle: boundedText(source.stationTitle, 120),
  });
}

function sanitizeSessionUpdate(
  input: unknown,
): Pick<EntertainmentSession, 'mediaUrl' | 'reviewPending' | 'lastError' | 'lastErrorAt'> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const source = input as Record<string, unknown>;
  const mediaUrl = boundedText(source.mediaUrl, 2_048);
  const safeMediaUrl = mediaUrl && (/^https?:\/\//i.test(mediaUrl) || mediaUrl.startsWith('/'))
    ? mediaUrl
    : undefined;

  // `lastError: null` limpia el aviso; un texto lo enciende. Si no viene el
  // campo, el aviso queda como estaba.
  const traeError = Object.prototype.hasOwnProperty.call(source, 'lastError');
  const textoError = boundedText(source.lastError, 300);
  const errorLimpio = traeError
    ? { lastError: textoError || null, lastErrorAt: textoError ? new Date().toISOString() : null }
    : {};

  return {
    ...(safeMediaUrl ? { mediaUrl: safeMediaUrl } : {}),
    ...(typeof source.reviewPending === 'boolean' ? { reviewPending: source.reviewPending } : {}),
    ...errorLimpio,
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
    return { success: false, error: MENSAJE_DE_FALLA };
  }
}

export async function updateEntertainmentSessionStatus(
  fiestaId: string,
  moduleId: string,
  status: EntertainmentSession['status'],
  extraData: any = {},
  accessToken?: string
): Promise<{ success: boolean; error?: string; captureId?: string }> {
  try {
    if (!fiestaId || fiestaId.length > 160 || !isEntertainmentModuleId(moduleId)) {
      return { success: false, error: 'Modulo de entretenimiento no valido.' };
    }
    if (!(await hasEntertainmentGuestAccess(fiestaId, moduleId, accessToken))) {
      return { success: false, error: 'Esta estación todavía no está habilitada. Pedile al equipo de AK que la active desde el panel de la fiesta.' };
    }
    if (!(await isStationEnabled(fiestaId, moduleId))) {
      return { success: false, error: 'Esta estacion esta desactivada.' };
    }
    const db = await getDb();
    const docId = `${fiestaId}_${moduleId}`;
    const docRef = db.collection(SESIONES_COLLECTION).doc(docId);
    const capturaEsperada = extraData && typeof extraData === 'object' && typeof extraData.captureId === 'string'
      ? extraData.captureId.slice(0, 80)
      : '';
    // La captura de la que es este cambio: la pantalla que empieza a grabar la guarda para que el
    // trabajo que termine después diga de cuál salió (T89-05).
    let capturaVigente: string | undefined;
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
      // RESPUESTA TARDÍA (T89-05, Codex, 26 de septiembre de 2026). Un trabajo que termina
      // después (la IA de la cabina) manda la captura de la que salió. Si la estación ya está con
      // otra —el operador reinició o empezó la siguiente—, esa respuesta es vieja: no cierra ni
      // cambia el medio de la captura nueva. La foto de A ya quedó en la galería por su lado.
      if (capturaEsperada && (expired || current?.captureId !== capturaEsperada)) return 'obsolete';
      const isIdempotent = currentStatus === status;
      if (!isIdempotent && !VALID_STATUS_TRANSITIONS[currentStatus].includes(status)) {
        return 'invalid-transition';
      }

      const nowIso = now.toISOString();
      // Toda cuenta regresiva nueva es otra captura, venga de "libre" o de "lista": si no, el
      // siguiente heredaba la identidad del anterior y la respuesta tardía de A lo cerraba (T89-05).
      const startsCapture = status === 'countdown' && currentStatus !== 'countdown';
      const captureId = startsCapture || !current?.captureId ? crypto.randomUUID() : current.captureId;
      capturaVigente = captureId;
      transaction.set(docRef, {
        fiestaId,
        moduleId,
        status,
        timestamp: current?.timestamp || nowIso,
        captureId,
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
    if (result === 'obsolete') {
      return { success: false, error: 'Esa captura ya terminó: la estación está con la siguiente.' };
    }
    if (result === 'invalid-transition') {
      return { success: false, error: 'La transicion solicitada no es valida para el estado actual.' };
    }
    return { success: true, captureId: capturaVigente };
  } catch (e: any) {
    console.error(`[sesion-entretenimiento] Error en updateEntertainmentSessionStatus:`, e);
    return { success: false, error: MENSAJE_DE_FALLA };
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
    return { success: false, error: MENSAJE_DE_FALLA };
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
      return { success: false, error: 'Esta estación todavía no está habilitada. Pedile al equipo de AK que la active desde el panel de la fiesta.' };
    }
    if (!(await isStationEnabled(fiestaId, moduleId))) {
      return { success: false, error: 'Esta estacion esta desactivada.' };
    }

    if (process.env.AK_USE_LOCAL_JSON_ONLY === 'true') {
      return { success: true };
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
    return { success: false, error: MENSAJE_DE_FALLA };
  }
}

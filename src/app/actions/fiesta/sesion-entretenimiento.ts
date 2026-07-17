'use server';

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
  lastUpdated: string;
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
      settings,
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
    const updates: Partial<EntertainmentSession> = {
      status,
      lastUpdated: new Date().toISOString(),
      ...extraData,
    };
    await db.collection(SESIONES_COLLECTION).doc(docId).set(
      {
        fiestaId,
        moduleId,
        timestamp: new Date().toISOString(),
        ...updates,
      },
      { merge: true }
    );
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

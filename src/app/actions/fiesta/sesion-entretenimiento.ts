'use server';

import { Firestore } from 'firebase-admin/firestore';

const SESIONES_COLLECTION = 'entretenimiento_sesiones';

async function getDb(): Promise<Firestore> {
  const { dbAdmin } = await import('@/lib/firebase/server');
  if (!dbAdmin) throw new Error('Firestore no disponible.');
  return dbAdmin as Firestore;
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
  moduleId: string
): Promise<EntertainmentSession | null> {
  try {
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
  settings: any = {}
): Promise<{ success: boolean; error?: string }> {
  try {
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
  extraData: any = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb();
    const docId = `${fiestaId}_${moduleId}`;
    const updates: Partial<EntertainmentSession> = {
      status,
      lastUpdated: new Date().toISOString(),
      ...extraData,
    };
    await db.collection(SESIONES_COLLECTION).doc(docId).update(updates);
    return { success: true };
  } catch (e: any) {
    console.error(`[sesion-entretenimiento] Error en updateEntertainmentSessionStatus:`, e);
    return { success: false, error: e.message };
  }
}

export async function resetEntertainmentSession(
  fiestaId: string,
  moduleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
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

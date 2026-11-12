// src/lib/firebase/server.ts
// Server-side Firebase Admin SDK configuration.
import admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { exigirQueSePuedaGuardar } from '@/lib/auth/solo-lectura';

function isBuildTime() {
  return process.env.npm_lifecycle_event === 'build' || process.env.NEXT_PHASE === 'phase-production-build';
}

function shouldSkipApplicationDefaultCredentials() {
  return isBuildTime() && process.env.AK_ALLOW_FIRESTORE_DURING_BUILD !== 'true';
}

if (!admin.apps.length) {
  try {
    const projectId =
      process.env.FIREBASE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      'presupuestador-ak-producciones';

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log('Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS.');
    } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      console.log('Firebase Admin SDK initialized using service account environment variables.');
    } else if (shouldSkipApplicationDefaultCredentials()) {
      console.warn('Firebase Admin SDK skipped during next build. Firestore/Auth will be enabled at runtime.');
    } else {
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId,
        });
        console.log('Firebase Admin SDK initialized with Application Default Credentials.');

        if (process.env.FIRESTORE_EMULATOR_HOST) {
          console.log(`Firestore connected to emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
        }
      } catch (adcError: any) {
        console.warn(
          'Firebase Admin SDK: no credentials available. Firestore will be unavailable; falling back to local JSON when possible.',
          adcError?.message ?? adcError
        );
      }
    }
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.message);
    console.error('Full error:', error);
  }
} else {
  console.log(`Firebase Admin SDK already initialized (${admin.apps.length} app(s)).`);
}

let dbInstance: admin.firestore.Firestore | null = null;
let authInstance: admin.auth.Auth | null = null;

try {
  if (process.env.AK_USE_LOCAL_JSON_ONLY === 'true' && !process.env.FIRESTORE_EMULATOR_HOST) {
    // Modo local exclusivo sin emulador: Firestore no se expone para evitar timeouts de red
    dbInstance = null;
  } else if (admin.apps.length > 0) {
    dbInstance = admin.firestore();
    // Un campo `undefined` hacía rechazar la escritura entera ("Cannot use undefined as a
    // Firestore value"): una captura sin invitado perdía el recuerdo (orden 134). Se ignoran en
    // TODAS las escrituras, no sólo en la que se encontró.
    try {
      dbInstance.settings({ ignoreUndefinedProperties: true });
    } catch {
      // no pasa nada si falla: ya estaba configurada (recarga en desarrollo).
    }
    authInstance = admin.auth();
    console.log('Firestore and Auth instances obtained successfully.');

    if (process.env.FIRESTORE_EMULATOR_HOST) {
      console.log(`Firestore connected to emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
    }
  } else if (shouldSkipApplicationDefaultCredentials()) {
    console.warn('Firebase Admin SDK not initialized during build. Runtime will initialize Firestore/Auth.');
  } else {
    console.error('Firebase Admin SDK not initialized. Firestore/Auth are unavailable.');
  }
} catch (e: any) {
  console.error('Error getting Firestore/Auth instance:', e.message);
  console.error('Full error:', e);
}

function envolverDocRef(docRef: any): any {
  if (!docRef || typeof docRef !== 'object') return docRef;
  return new Proxy(docRef, {
    get(target, prop, receiver) {
      if (prop === 'set') {
        return async (...args: any[]) => {
          await exigirQueSePuedaGuardar();
          return target.set(...args);
        };
      }
      if (prop === 'update') {
        return async (...args: any[]) => {
          await exigirQueSePuedaGuardar();
          return target.update(...args);
        };
      }
      if (prop === 'delete') {
        return async (...args: any[]) => {
          await exigirQueSePuedaGuardar();
          return target.delete(...args);
        };
      }
      if (prop === 'collection') {
        return (...args: any[]) => envolverCollectionRef(target.collection(...args));
      }
      const val = Reflect.get(target, prop, receiver);
      if (typeof val === 'function') {
        return val.bind(target);
      }
      return val;
    },
  });
}

function envolverCollectionRef(colRef: any): any {
  if (!colRef || typeof colRef !== 'object') return colRef;
  return new Proxy(colRef, {
    get(target, prop, receiver) {
      if (prop === 'doc') {
        return (...args: any[]) => envolverDocRef(target.doc(...args));
      }
      if (prop === 'add') {
        return async (...args: any[]) => {
          await exigirQueSePuedaGuardar();
          return target.add(...args);
        };
      }
      if (
        prop === 'where' ||
        prop === 'orderBy' ||
        prop === 'limit' ||
        prop === 'offset' ||
        prop === 'startAt' ||
        prop === 'startAfter' ||
        prop === 'endAt' ||
        prop === 'endBefore'
      ) {
        return (...args: any[]) => {
          const res = target[prop](...args);
          return envolverCollectionRef(res);
        };
      }
      const val = Reflect.get(target, prop, receiver);
      if (typeof val === 'function') {
        return val.bind(target);
      }
      return val;
    },
  });
}

function envolverBatch(batch: any): any {
  if (!batch || typeof batch !== 'object') return batch;
  return new Proxy(batch, {
    get(target, prop, receiver) {
      if (prop === 'commit') {
        return async (...args: any[]) => {
          await exigirQueSePuedaGuardar();
          return target.commit(...args);
        };
      }
      const val = Reflect.get(target, prop, receiver);
      if (typeof val === 'function') {
        return val.bind(target);
      }
      return val;
    },
  });
}

export function wrapFirestoreWithReadOnlyLock<T extends admin.firestore.Firestore>(db: T): T {
  if (!db) return db;
  return new Proxy(db, {
    get(target, prop, receiver) {
      if (prop === 'collection') {
        return (...args: any[]) => envolverCollectionRef((target.collection as any)(...args));
      }
      if (prop === 'runTransaction') {
        return async (...args: any[]) => {
          await exigirQueSePuedaGuardar();
          return (target.runTransaction as any)(...args);
        };
      }
      if (prop === 'batch') {
        return (...args: any[]) => envolverBatch((target.batch as any)(...args));
      }
      const val = Reflect.get(target, prop, receiver);
      if (typeof val === 'function') {
        return val.bind(target);
      }
      return val;
    },
  }) as T;
}

export const dbAdmin: admin.firestore.Firestore | null = dbInstance
  ? (process.env.AK_DECORATION_SDK_QA === 'true' ? dbInstance : wrapFirestoreWithReadOnlyLock(dbInstance))
  : null;
export const authAdmin = authInstance;

export function isFirebaseAvailable(): boolean {
  return dbAdmin !== null;
}

export async function verifyIdToken(idToken: string): Promise<DecodedIdToken | null> {
  if (!authAdmin) {
    console.error('Auth Admin SDK not available for token verification.');
    return null;
  }
  try {
    return await authAdmin.verifyIdToken(idToken);
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return null;
  }
}

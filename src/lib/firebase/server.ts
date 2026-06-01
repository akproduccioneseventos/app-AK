// src/lib/firebase/server.ts
// Server-side Firebase Admin SDK configuration.
import admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

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
  if (admin.apps.length > 0) {
    dbInstance = admin.firestore();
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

export const dbAdmin = dbInstance;
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

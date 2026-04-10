// src/lib/firebase/server.ts
// Server-side Firebase Admin SDK configuration
import admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import * as logger from '@/lib/logger';

// Ensure Firebase app is initialized only once
if (!admin.apps.length) {
  try {
    const projectId =
      process.env.FIREBASE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      'presupuestador-ak-producciones';

    // Option 1: Using GOOGLE_APPLICATION_CREDENTIALS environment variable
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      logger.info('Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS.');
    }
    // Option 2: Using individual environment variables (service account)
    else if (
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      logger.info('Firebase Admin SDK initialized using individual environment variables.');
    }
    // Option 3: Application Default Credentials (Firebase App Hosting, GCP, Cloud Run, etc.)
    // ADC is provided automatically by the metadata server — no env var needed.
    else {
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId,
        });
        logger.info('Firebase Admin SDK initialized with Application Default Credentials.');

        if (process.env.FIRESTORE_EMULATOR_HOST) {
          logger.info(`Using Firestore Emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
        }
      } catch (adcError: any) {
        // ADC not available (e.g. local dev without gcloud auth).
        // Do NOT fall back to projectId-only initialization — that creates a zombie state
        // where dbAdmin appears non-null but ALL Firestore operations fail with auth errors.
        logger.info('Firebase Admin SDK: ADC not available, running without Firebase (no credentials configured).');
        // admin.apps remains empty → dbInstance stays null → all operations skip Firebase cleanly
      }
    }
  } catch (error: any) {
    logger.error('Firebase Admin SDK initialization error:', error.message);
  }
} else {
  logger.info(`Firebase Admin SDK already initialized (${admin.apps.length} app(s))`);
}

// Get Firestore and Auth instances
let dbInstance: admin.firestore.Firestore | null = null;
let authInstance: admin.auth.Auth | null = null;

try {
  if (admin.apps.length > 0) {
    dbInstance = admin.firestore();
    authInstance = admin.auth();
    logger.info('Firestore and Auth instances obtained successfully.');

    if (process.env.FIRESTORE_EMULATOR_HOST) {
      logger.info(`Firestore connected to emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
    }
  }
  // If no apps initialized, dbInstance/authInstance remain null — this is correct and expected
  // when Firebase credentials are not configured in this environment.
} catch (e: any) {
  logger.error('Error getting Firestore/Auth instance:', e.message);
}

export const dbAdmin = dbInstance;
export const authAdmin = authInstance;

/**
 * Verifica si Firebase está disponible y conectado
 */
export function isFirebaseAvailable(): boolean {
  return dbAdmin !== null;
}

/**
 * Verifica un ID token de Firebase Authentication
 */
export async function verifyIdToken(idToken: string): Promise<DecodedIdToken | null> {
  if (!authAdmin) {
    logger.error('Auth Admin SDK not available for token verification.');
    return null;
  }
  try {
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    logger.error('Error verifying ID token:', String(error));
    return null;
  }
}

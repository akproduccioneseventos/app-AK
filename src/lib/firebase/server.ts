// src/lib/firebase/server.ts
// Server-side Firebase Admin SDK configuration
import admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

// Ensure Firebase app is initialized only once
if (!admin.apps.length) {
  try {
    // Option 1: Using GOOGLE_APPLICATION_CREDENTIALS environment variable
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log('Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS.');
    }
    // Option 2: Using individual environment variables
    else if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      console.log('Firebase Admin SDK initialized using individual environment variables.');
    }
    // Option 3: Default initialization (works in Firebase Studio / GCP environments)
    else {
      try {
        admin.initializeApp({
          projectId: 'presupuestador-ak-producciones',
        });
        console.log('Firebase Admin SDK initialized with default project ID.');
      } catch (defaultInitError: any) {
        console.warn(
          'Firebase Admin SDK default initialization failed:',
          defaultInitError.message
        );
      }
    }
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.stack);
  }
}

// Get Firestore and Auth instances
let dbInstance: admin.firestore.Firestore | null = null;
let authInstance: admin.auth.Auth | null = null;

try {
  if (admin.apps.length > 0) {
    dbInstance = admin.firestore();
    authInstance = admin.auth();
  } else {
    console.warn('Firebase Admin SDK not initialized. Firestore/Auth not available server-side.');
  }
} catch (e: any) {
  console.error('Error getting Firestore/Auth instance:', e.message);
}

export const dbAdmin = dbInstance;
export const authAdmin = authInstance;

export async function verifyIdToken(idToken: string): Promise<DecodedIdToken | null> {
  if (!authAdmin) {
    console.error('Auth Admin SDK not available for token verification.');
    return null;
  }
  try {
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return null;
  }
}

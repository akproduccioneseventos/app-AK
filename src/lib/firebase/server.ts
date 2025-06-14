// src/lib/firebase/server.ts
// import admin from 'firebase-admin';
// import type { DecodedIdToken } from 'firebase-admin/auth';

// // Ensure Firebase app is initialized only once
// if (!admin.apps.length) {
//   try {
//     // Option 1: Using GOOGLE_APPLICATION_CREDENTIALS environment variable (path to JSON file)
//     // This is the recommended way for most environments.
//     // Ensure this env var is set in your deployment environment and local .env file if needed.
//     if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
//       admin.initializeApp({
//         credential: admin.credential.applicationDefault(),
//       });
//       console.log('Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS.');
//     }
//     // Option 2: Using individual environment variables (less common for admin SDK, but possible)
//     // Make sure these are set if GOOGLE_APPLICATION_CREDENTIALS is not.
//     else if (
//       process.env.FIREBASE_PROJECT_ID &&
//       process.env.FIREBASE_CLIENT_EMAIL &&
//       process.env.FIREBASE_PRIVATE_KEY
//     ) {
//       admin.initializeApp({
//         credential: admin.credential.cert({
//           projectId: process.env.FIREBASE_PROJECT_ID,
//           clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//           // Replace escaped newlines from environment variable
//           privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
//         }),
//       });
//       console.log('Firebase Admin SDK initialized using individual environment variables.');
//     } else {
//       // Fallback for Firebase Studio / Google Cloud managed environments that might auto-init
//       // or if no explicit credentials are provided, it might work in some GCP environments.
//       // If this still fails, explicit credentials are a must.
//       try {
//         admin.initializeApp();
//         console.log('Firebase Admin SDK initialized with default credentials (e.g., in GCP environment).');
//       } catch (defaultInitError: any) {
//         console.warn(
//           'Firebase Admin SDK initialization failed. Neither GOOGLE_APPLICATION_CREDENTIALS nor individual Firebase env vars (FIREBASE_PROJECT_ID, etc.) are set, and default initialization also failed.',
//           defaultInitError.message
//         );
//         // Not throwing an error here to allow app to potentially run in a restricted mode or show an error page.
//         // Depending on app requirements, you might want to throw here.
//       }
//     }
//   } catch (error: any) {
//     console.error('Firebase Admin SDK initialization error:', error.stack);
//     // Optionally, throw the error or handle it to prevent app from starting if Firebase is critical
//     // throw new Error('Failed to initialize Firebase Admin SDK: ' + error.message);
//   }
// }

// let dbInstance: admin.firestore.Firestore | null = null;
// let authInstance: admin.auth.Auth | null = null;

// try {
//   if (admin.apps.length > 0 && admin.app().options.credential) {
//     dbInstance = admin.firestore();
//     authInstance = admin.auth();
//   } else {
//      console.warn("Firebase Admin SDK not fully initialized, Firestore/Auth might not be available server-side.");
//   }
// } catch(e) {
//   console.error("Error getting Firestore/Auth instance after Firebase init:", e);
// }

// Firebase is temporarily disabled. Export nulls.
export const dbAdmin = null; // : admin.firestore.Firestore | null = dbInstance;
export const authAdmin = null; // : admin.auth.Auth | null = authInstance;

// export async function verifyIdToken(idToken: string): Promise<DecodedIdToken | null> {
//   if (!authAdmin) {
//     console.error("Auth Admin SDK not available for token verification.");
//     return null;
//   }
//   try {
//     const decodedToken = await authAdmin.verifyIdToken(idToken);
//     return decodedToken;
//   } catch (error) {
//     console.error('Error verifying ID token:', error);
//     return null;
//   }
// }

// Placeholder for when Firebase is re-enabled
export async function verifyIdToken(idToken: string): Promise<any | null> {
  console.warn("Firebase Auth is currently disabled. Token verification skipped.");
  // To simulate a decoded token structure if needed for other parts of the app:
  // return { uid: 'test-uid', email: 'test@example.com', name: 'Test User' };
  return null;
}

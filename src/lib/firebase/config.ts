// src/lib/firebase/config.ts
// Client-side Firebase configuration — Firestore only (Auth removed).
// Authentication is now handled by the custom auth system in src/lib/auth/.
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

// Only initialize Firebase client if a real API key is configured.
// Without a valid key, Firebase would throw API_KEY_INVALID errors.
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
if (apiKey && apiKey !== 'dummy-key-for-firestore') {
  const firebaseConfig = {
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'presupuestador-ak-producciones.firebaseapp.com',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'presupuestador-ak-producciones',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'presupuestador-ak-producciones.firebasestorage.app',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  };

  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
  } catch (error: any) {
    console.error('❌ Firebase client initialization error:', error.message);
  }
} else if (process.env.NODE_ENV === 'development') {
  // Warn in development so developers know Firebase is not configured.
  // In production this is intentionally silent to avoid breaking the UI.
  console.warn(
    '⚠️ [Firebase] NEXT_PUBLIC_FIREBASE_API_KEY is not set. ' +
    'Firestore client and FCM will be disabled. ' +
    'Set the NEXT_PUBLIC_FIREBASE_* variables to enable Firebase features.'
  );
}

export { app, db };

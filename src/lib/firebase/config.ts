// src/lib/firebase/config.ts
// Client-side Firebase configuration — Firestore only (Auth removed).
// Authentication is now handled by the custom auth system in src/lib/auth/.
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Only initialize Firebase synchronously when the API key is present at build time.
// During `next build` in CI (without secrets), this key is undefined and
// calling initializeApp could throw, breaking prerendering.
let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'presupuestador-ak-producciones',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
}

export { app, db };

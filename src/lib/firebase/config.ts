// src/lib/firebase/config.ts
// Client-side Firebase configuration — Firestore only (Auth removed).
// Authentication is now handled by the custom auth system in src/lib/auth/.
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const KNOWN_PROJECT_ID = 'presupuestador-ak-producciones';

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || KNOWN_PROJECT_ID;

// Only initialize Firebase if we have a real API key, OR if we're in the known
// Firebase App Hosting environment (credentials are injected automatically).
// Never use a dummy key — it initializes the SDK but causes all Firestore ops to fail.
const shouldInitialize = !!apiKey || projectId === KNOWN_PROJECT_ID;

const firebaseConfig: {
  apiKey?: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
} = {
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
  projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Only include apiKey when it's actually available — an empty string causes auth errors
if (apiKey) {
  firebaseConfig.apiKey = apiKey;
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (shouldInitialize) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
  } catch (error: any) {
    // Initialization failed — app and db stay null, Firebase unavailable
    if (process.env.NODE_ENV === 'development') {
      console.error('[AK] Firebase client initialization error:', error.message);
    }
  }
}

export { app, db };

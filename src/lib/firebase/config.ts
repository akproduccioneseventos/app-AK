// src/lib/firebase/config.ts
// Client-side Firebase configuration
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

// Only initialize Firebase synchronously when the API key is present at build time.
// During `next build` in CI (without secrets), this key is undefined and
// calling initializeApp would throw auth/invalid-api-key, breaking prerendering.
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

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
  auth = getAuth(app);
}

// Cached promise for async initialization via /__/firebase/init.json.
// Firebase App Hosting automatically serves this endpoint with the project's
// client-side configuration, so no manual env var setup is required.
let _authInitPromise: Promise<Auth | null> | null = null;

/**
 * Returns a Firebase Auth instance.
 *
 * - If `NEXT_PUBLIC_FIREBASE_API_KEY` was set at build time the instance is
 *   already available synchronously and resolves immediately.
 * - Otherwise (e.g. Firebase App Hosting without explicit env var config)
 *   the config is fetched from `/__/firebase/init.json`, which Firebase
 *   Hosting/App Hosting serves automatically for every project.
 */
export function resolveAuth(): Promise<Auth | null> {
  if (auth) return Promise.resolve(auth);
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (_authInitPromise) return _authInitPromise;

  _authInitPromise = fetch('/__/firebase/init.json')
    .then((res) => (res.ok ? res.json() : null))
    .then((config: Record<string, unknown> | null) => {
      if (!config?.apiKey) return null;
      const firebaseApp = !getApps().length ? initializeApp(config as FirebaseOptions) : getApp();
      app = firebaseApp;
      db = getFirestore(firebaseApp);
      auth = getAuth(firebaseApp);
      return auth;
    })
    .catch(() => null);

  return _authInitPromise;
}

export { app, db, auth };

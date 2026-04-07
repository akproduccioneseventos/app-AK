// src/lib/firebase/config.ts
// Client-side Firebase configuration
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

// The Firebase App Hosting origin that always serves /__/firebase/init.json.
// Used as a fallback when the app is accessed via a custom domain (e.g. akproducciones.uy)
// where the SDK config endpoint is not available.
// Override via NEXT_PUBLIC_FIREBASE_HOSTING_ORIGIN if the App Hosting URL ever changes.
const FIREBASE_HOSTED_ORIGIN =
  process.env.NEXT_PUBLIC_FIREBASE_HOSTING_ORIGIN ||
  'https://ak-producciones--presupuestador-ak-producciones.us-east4.hosted.app';

// LocalStorage key used to cache the fetched Firebase config so we only
// hit the network once per browser session (survives page reloads).
const FIREBASE_CONFIG_CACHE_KEY = 'ak_firebase_config_cache';
// Cache TTL: 7 days in milliseconds.
const FIREBASE_CONFIG_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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

// Cached promise for async initialization.
let _authInitPromise: Promise<Auth | null> | null = null;

/**
 * Attempts to load the Firebase client config from a /__/firebase/init.json
 * endpoint.  Returns the parsed config or null on failure.
 */
async function fetchFirebaseConfig(origin: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${origin}/__/firebase/init.json`);
    if (!res.ok) return null;
    const config = await res.json();
    return config?.apiKey ? config : null;
  } catch {
    return null;
  }
}

/**
 * Returns a Firebase Auth instance.
 *
 * Resolution order:
 * 1. If `NEXT_PUBLIC_FIREBASE_API_KEY` was set at build time the instance is
 *    already available synchronously and resolves immediately.
 * 2. Try `/__/firebase/init.json` on the current origin (works on *.hosted.app).
 * 3. If that fails (e.g. custom domain like akproducciones.uy), fetch the
 *    config from the known Firebase App Hosting origin and cache it in
 *    localStorage to avoid repeated network requests.
 */
export function resolveAuth(): Promise<Auth | null> {
  if (auth) return Promise.resolve(auth);
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (_authInitPromise) return _authInitPromise;

  _authInitPromise = (async (): Promise<Auth | null> => {
    let config: Record<string, unknown> | null = null;

    // 1. Try cached config from a previous session (valid for 7 days).
    try {
      const cached = localStorage.getItem(FIREBASE_CONFIG_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const age = Date.now() - (parsed?._cachedAt ?? 0);
        if (parsed?.apiKey && age < FIREBASE_CONFIG_CACHE_TTL_MS) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { _cachedAt: _ts, ...configWithoutMeta } = parsed;
          config = configWithoutMeta;
        }
      }
    } catch {
      // localStorage unavailable (SSR, private mode) — continue without cache.
    }

    // 2. Try /__/firebase/init.json on the current origin.
    if (!config) {
      config = await fetchFirebaseConfig(window.location.origin);
    }

    // 3. Fall back to the known Firebase App Hosting origin so the app works
    //    on any custom domain (e.g. akproducciones.uy) without env vars.
    if (!config) {
      config = await fetchFirebaseConfig(FIREBASE_HOSTED_ORIGIN);
      if (config) {
        // Cache so subsequent page loads skip the cross-origin fetch.
        try {
          localStorage.setItem(
            FIREBASE_CONFIG_CACHE_KEY,
            JSON.stringify({ ...config, _cachedAt: Date.now() }),
          );
        } catch {
          // ignore
        }
      }
    }

    if (!config) return null;

    const firebaseApp = !getApps().length ? initializeApp(config as FirebaseOptions) : getApp();
    app = firebaseApp;
    db = getFirestore(firebaseApp);
    auth = getAuth(firebaseApp);
    return auth;
  })();

  return _authInitPromise;
}

export { app, db, auth };

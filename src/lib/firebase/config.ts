// src/lib/firebase/config.ts
// Client-side Firebase configuration — Firestore only (Auth removed).
// Authentication is now handled by the custom auth system in src/lib/auth/.
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

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

    // CACHE EN EL NAVEGADOR. Dos motivos, y los dos importan en una fiesta:
    //
    // 1. **Si se corta internet en el salon, la app sigue mostrando lo ultimo
    //    que leyo** en vez de quedarse en blanco. En un salon de campo eso pasa.
    // 2. **Firebase cobra por lectura.** Con cache, la misma pantalla abierta
    //    veinte veces en la noche se lee una sola vez. Con 200 invitados mirando
    //    el muro, la diferencia se nota en la factura.
    //
    // `persistentMultipleTabManager` es porque el operador abre varias pestanas
    // a la vez —el tablero, la estacion y el muro— y sin eso se pelean por la
    // cache y una queda sin funcionar.
    //
    // Si el navegador no la deja (ventana privada, o dos versiones distintas de
    // la app abiertas), se cae a la conexion normal y no se rompe nada.
    if (typeof window !== 'undefined') {
      try {
        db = initializeFirestore(app, {
          localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
        });
      } catch {
        db = getFirestore(app);
      }
    } else {
      db = getFirestore(app);
    }
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

// src/lib/firebase/app-check.ts
// Firebase App Check initialization helper for client-side bot protection.

import { app } from './config';
import type { AppCheck } from 'firebase/app-check';

let appCheckInstance: AppCheck | null = null;

export async function initAppCheck(): Promise<AppCheck | null> {
  if (typeof window === 'undefined' || !app) return null;
  if (appCheckInstance) return appCheckInstance;

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) return null;

  try {
    const { initializeAppCheck, ReCaptchaV3Provider } = await import('firebase/app-check');
    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
    return appCheckInstance;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[AppCheck] Initialization error:', err);
    }
    return null;
  }
}

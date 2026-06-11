'use client';

import {
  browserSessionPersistence,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { app } from '@/lib/firebase/config';

function getGoogleAuth() {
  if (!app) {
    const error = new Error('Firebase no esta configurado para iniciar con Google.') as Error & { code?: string };
    error.code = 'auth/configuration-not-found';
    throw error;
  }
  return getAuth(app);
}

function createGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

async function prepareGoogleAuth() {
  const auth = getGoogleAuth();
  await setPersistence(auth, browserSessionPersistence);
  return auth;
}

export async function signInWithGooglePopup(): Promise<string> {
  const auth = await prepareGoogleAuth();
  const result = await signInWithPopup(auth, createGoogleProvider());
  return result.user.getIdToken(true);
}

export async function startGoogleSignInRedirect(): Promise<void> {
  const auth = await prepareGoogleAuth();
  await signInWithRedirect(auth, createGoogleProvider());
}

export async function consumeGoogleRedirectToken(): Promise<string | null> {
  const auth = await prepareGoogleAuth();
  const result = await getRedirectResult(auth);
  return result ? result.user.getIdToken(true) : null;
}

export async function clearGoogleAuthSession(): Promise<void> {
  if (!app) return;
  await signOut(getAuth(app)).catch(() => undefined);
}

export function shouldPreferGoogleRedirect(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 767px)').matches;
}

export function shouldFallbackToGoogleRedirect(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  return code === 'auth/popup-blocked'
    || code === 'auth/cancelled-popup-request'
    || code === 'auth/operation-not-supported-in-this-environment';
}

export function getGoogleAuthErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case 'auth/unauthorized-domain':
      return 'Este dominio todavia no esta autorizado en Firebase Authentication.';
    case 'auth/operation-not-allowed':
      return 'El acceso con Google todavia no esta habilitado en Firebase Authentication.';
    case 'auth/popup-closed-by-user':
      return 'Se cerro la ventana de Google antes de completar el ingreso.';
    case 'auth/network-request-failed':
      return 'No se pudo conectar con Google. Revisa internet e intenta nuevamente.';
    case 'auth/configuration-not-found':
      return 'Firebase no esta configurado para iniciar con Google.';
    default:
      return 'No se pudo completar el ingreso con Google.';
  }
}

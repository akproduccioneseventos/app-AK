// src/lib/firebase/auth-client.ts
// Firebase Auth helpers for client-side use

import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  onAuthStateChanged,
  type User,
  type ActionCodeSettings,
} from 'firebase/auth';
import { auth } from './config';

/**
 * Comma-separated list of allowed admin emails.
 * Override via NEXT_PUBLIC_ADMIN_EMAILS env var.
 * Default: akproduccionessalto@gmail.com
 */
const ADMIN_EMAILS_RAW =
  process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? 'akproduccionessalto@gmail.com';

export const ADMIN_EMAILS: string[] = ADMIN_EMAILS_RAW.split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Signs in with email and password.
 * Throws if Firebase is not initialized or the user is not in the admin whitelist.
 */
export async function signInAdmin(email: string, password: string): Promise<User> {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  const credential = await signInWithEmailAndPassword(auth, email, password);
  if (!isAdminEmail(credential.user.email)) {
    await firebaseSignOut(auth);
    throw new Error('UNAUTHORIZED');
  }
  return credential.user;
}

/** Signs out the current user. No-op when Firebase is not initialized. */
export async function signOut(): Promise<void> {
  if (!auth) return; // No active session to sign out of; safe to ignore.
  await firebaseSignOut(auth);
}

/**
 * Sends a password-reset email.
 * Uses NEXT_PUBLIC_APP_URL as the continue URL base; falls back to window.location.origin.
 */
export async function sendPasswordResetEmail(email: string): Promise<void> {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  const actionCodeSettings: ActionCodeSettings = {
    url: `${baseUrl}/login`,
    handleCodeInApp: false,
  };

  await firebaseSendPasswordResetEmail(auth, email, actionCodeSettings);
}

/** Subscribes to auth state changes. Returns an unsubscribe function. */
export function subscribeToAuthState(
  callback: (user: User | null) => void
): () => void {
  if (!auth) {
    // Firebase not initialized (e.g. build without env vars): treat as unauthenticated
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export { auth };

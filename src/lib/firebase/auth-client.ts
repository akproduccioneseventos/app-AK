// src/lib/firebase/auth-client.ts
// Auth helpers — now delegates to the custom session-based auth system.
// Firebase Auth has been removed; this file is kept as a compatibility shim.

export {
  getSession,
  setSession,
  clearSession,
  generateToken,
  isValidToken,
  SESSION_KEY,
} from '@/lib/auth';

export type { AuthSession } from '@/lib/auth';

/**
 * Signs out the current user by clearing the session.
 */
export async function signOut(): Promise<void> {
  const { clearSession } = await import('@/lib/auth');
  clearSession();
}

/**
 * Re-exported for backwards-compatibility with code that imported isAdminEmail.
 * In the new system every user with role="admin" is an admin.
 */
export function isAdminEmail(_email: string | null | undefined): boolean {
  // Not used in the new system — role is read from the session object.
  return true;
}

/**
 * Subscribes to auth state changes.
 * In the new session-based system there is no real-time subscription;
 * this function checks localStorage once and calls the callback synchronously.
 * Returns a no-op unsubscribe function.
 */
export function subscribeToAuthState(
  callback: (session: import('@/lib/auth').AuthSession | null) => void
): () => void {
  if (typeof window === 'undefined') {
    callback(null);
    return () => {};
  }

  const { getSession } = require('@/lib/auth');
  callback(getSession());

  return () => {};
}

// Re-export auth as null — nothing should be reading this directly.
export const auth = null;

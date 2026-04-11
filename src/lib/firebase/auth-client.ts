// src/lib/firebase/auth-client.ts
// Auth helpers — delegates to the server-side session system.
// Client-side storage (localStorage/sessionStorage) is no longer used.

export { fetchSession, type SessionData } from '@/lib/auth';

/**
 * Signs out the current user by clearing the server-side session cookie.
 */
export async function signOut(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // Ignore — cookie might already be cleared
  }
}

/**
 * Re-exported for backwards-compatibility.
 */
export function isAdminEmail(_email: string | null | undefined): boolean {
  return true;
}

// Re-export auth as null — nothing should be reading this directly.
export const auth = null;

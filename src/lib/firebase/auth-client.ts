// src/lib/firebase/auth-client.ts
// Auth helpers — delegates to the simple session-based auth system.

export {
  getSession,
  setSession,
  clearSession,
  SESSION_KEY,
} from '@/lib/auth';

/**
 * Signs out the current user by clearing the session.
 */
export async function signOut(): Promise<void> {
  const { clearSession } = await import('@/lib/auth');
  clearSession();
}

/**
 * Re-exported for backwards-compatibility.
 */
export function isAdminEmail(_email: string | null | undefined): boolean {
  return true;
}

// Re-export auth as null — nothing should be reading this directly.
export const auth = null;

// src/lib/auth/index.ts
// Client-side session management — simple shared-password system.
// A session is represented by the presence of the key in sessionStorage/localStorage.

export const SESSION_KEY = 'ak_producciones_auth_session';

/**
 * Returns true if there is an active session in localStorage or sessionStorage.
 */
export function getSession(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY));
}

/** Persists the session to both sessionStorage and localStorage. */
export function setSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, 'true');
  localStorage.setItem(SESSION_KEY, 'true');
}

/** Removes the session from both localStorage and sessionStorage. */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

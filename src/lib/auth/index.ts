const SESSION_KEY = 'ak_session';

export function getSession(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY));
}

export function setSession(): void {
  localStorage.setItem(SESSION_KEY, 'true');
  sessionStorage.setItem(SESSION_KEY, 'true');
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

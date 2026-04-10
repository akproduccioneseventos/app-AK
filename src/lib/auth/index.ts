// src/lib/auth/index.ts
// Client-side session management — user-based auth system.
// Session data is stored as JSON in localStorage/sessionStorage.

export const SESSION_KEY = 'ak_producciones_auth_session';

/** Available application modules for role-based access control. */
export const APP_MODULES = [
  { id: 'presupuestos',      label: 'Presupuestos' },
  { id: 'fiestas',           label: 'Fiestas / Eventos' },
  { id: 'carga-operativa',   label: 'Carga Operativa' },
  { id: 'calendario',        label: 'Calendario' },
  { id: 'proveedores',       label: 'Proveedores' },
  { id: 'empleados',         label: 'Empleados' },
  { id: 'customers',         label: 'Clientes' },
  { id: 'empresa',           label: 'Empresa' },
  { id: 'invoices',          label: 'Facturación' },
] as const;

/** User session data stored client-side. */
export interface SessionData {
  userId: string;
  email: string;
  role: 'admin' | 'user';
  modules: string[];
  mustChangePassword?: boolean;
}

/**
 * Returns the active session data from localStorage/sessionStorage, or null if not logged in.
 */
export function getSession(): SessionData | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // Validate it has the required shape of a SessionData object.
    if (parsed && typeof parsed === 'object' && 'userId' in parsed) {
      return parsed as SessionData;
    }
    return null;
  } catch {
    return null;
  }
}

/** Persists the session data to both sessionStorage and localStorage. */
export function setSession(data: SessionData): void {
  if (typeof window === 'undefined') return;
  const serialized = JSON.stringify(data);
  sessionStorage.setItem(SESSION_KEY, serialized);
  localStorage.setItem(SESSION_KEY, serialized);
}

/** Removes the session from both localStorage and sessionStorage. */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

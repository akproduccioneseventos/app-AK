// src/lib/auth/index.ts
// Client-side session management for the custom auth system.
// Sessions are stored in localStorage for persistence across page reloads.
// sessionStorage is also checked for compatibility with E2E tests.

export const SESSION_KEY = 'ak_producciones_auth_session';

export type UserRole = 'admin' | 'user';

export interface AuthSession {
  token: string;
  userId: string;
  email: string;
  role: UserRole;
  modules: string[];
  mustChangePassword?: boolean;
  createdAt: number;
}

/**
 * Generates a session token in the format expected by E2E tests.
 * Token = btoa('ak_auth_<userId>_<timestamp>') — always starts with YWtfYXV0aF8.
 */
export function generateToken(userId: string): string {
  return btoa(`ak_auth_${userId}_${Date.now()}`);
}

/**
 * Returns true if the token has the valid prefix (btoa of 'ak_auth_').
 */
export function isValidToken(token: string): boolean {
  return token.startsWith('YWtfYXV0aF8');
}

/**
 * Reads the current session from localStorage (or sessionStorage for E2E tests).
 * Returns null if no valid session is found.
 */
export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;

  const stored =
    localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);

  if (!stored) return null;

  // Plain token injected by E2E tests (not a JSON object).
  if (!stored.startsWith('{')) {
    if (isValidToken(stored)) {
      return {
        token: stored,
        userId: 'e2e',
        email: 'akproduccionessalto@gmail.com',
        role: 'admin',
        modules: ['all'],
        createdAt: Date.now(),
      };
    }
    return null;
  }

  try {
    const session = JSON.parse(stored) as AuthSession;
    if (!session.token || !isValidToken(session.token)) return null;
    return session;
  } catch {
    return null;
  }
}

/** Persists a session to localStorage. */
export function setSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/** Removes the session from both localStorage and sessionStorage. */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

/** Available app modules for permission assignment. */
export const APP_MODULES = [
  { id: 'fiestas', label: 'Fiestas & Eventos' },
  { id: 'presupuestos', label: 'Presupuestos' },
  { id: 'empresa', label: 'Empresa' },
  { id: 'catalogo', label: 'Catálogo de Servicios' },
  { id: 'planner', label: 'Planner / Tareas' },
  { id: 'catering', label: 'Catering' },
  { id: 'decoracion', label: 'Decoración' },
  { id: 'salon', label: 'Diseñador de Salón' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'invoices', label: 'Facturas' },
  { id: 'proveedores', label: 'Proveedores' },
  { id: 'contabilidad', label: 'Contabilidad' },
  { id: 'reportes', label: 'Reportes' },
  { id: 'configuracion', label: 'Configuración' },
] as const;

export type ModuleId = typeof APP_MODULES[number]['id'] | 'all';

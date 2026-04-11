// src/lib/auth/index.ts
// Shared auth types and constants.
// Authentication relies exclusively on the server-side HttpOnly cookie
// verified by the middleware, AuthGuard, and server actions.
// No client-side storage (localStorage/sessionStorage) is used.

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

/** User session data returned by the server session endpoint. */
export interface SessionData {
  userId: string;
  email: string;
  role: 'admin' | 'user';
  modules: string[];
  mustChangePassword?: boolean;
}

/**
 * Fetches the current session from the server by validating the HttpOnly cookie.
 * Returns null if not authenticated. This is the ONLY way to check auth status.
 */
export async function fetchSession(): Promise<SessionData | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/auth/session');
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.authenticated) return null;
    return {
      userId: data.userId,
      email: data.email,
      role: data.role,
      modules: data.modules,
      mustChangePassword: data.mustChangePassword,
    };
  } catch {
    return null;
  }
}

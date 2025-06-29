'use client';

import { type ReactNode } from 'react';

// This key would be used if session-based auth were active
const SESSION_KEY = 'ak_producciones_auth_session';

/**
 * Triggers a simulated logout by clearing session storage and redirecting to the login page.
 */
export function triggerAppLogout() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY);
    // Force a re-render/redirect by navigating to login
    window.location.href = '/login';
  }
}

interface AuthGuardProps {
  children: ReactNode;
}

// La protección por contraseña ha sido desactivada para simplificar el flujo de la aplicación.
// Este componente actúa como un passthrough, renderizando directamente a sus hijos.
// Si se necesita reactivar la autenticación, se puede implementar la lógica aquí.
export function AuthGuard({ children }: AuthGuardProps) {
  return <>{children}</>;
}

'use client';

import { type ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
}

// La protección por contraseña ha sido desactivada para simplificar el flujo de la aplicación.
// Si se necesita reactivar, se puede implementar una solución más robusta aquí.
export function AuthGuard({ children }: AuthGuardProps) {
  return <>{children}</>;
}

// Función auxiliar para despachar un evento de cierre de sesión si se reactiva la autenticación.
export function triggerAppLogout() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent('app-logout'));
  }
}

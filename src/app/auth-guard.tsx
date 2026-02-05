
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const SESSION_KEY = 'ak_producciones_auth_session';

export function triggerAppLogout() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY);
    // Remove portal-specific session keys
    Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('portal_auth_')) {
            sessionStorage.removeItem(key);
        }
    });
    window.location.href = '/login';
  }
}

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // This check ensures sessionStorage is only accessed on the client-side.
    if (typeof window === 'undefined') {
      return;
    }
    
    // Define prefixes for all public-facing sections of the app that do not require admin login.
    const publicPathPrefixes = [
      '/login',
      '/evento/actual', // Covers the main event page and sub-pages like /checkin, /mesa
      '/evento/social', // Covers the live social wall
      '/video-vida',    // Covers the client photo upload page
      '/feedback',      // Covers the client feedback form
      '/portal',        // Covers the client portal login and its internal pages (which have their own auth)
      '/simulador-de-presupuesto',
      '/acceso-personal', // Covers links for external staff/partners
    ];
    
    // Check if the current path starts with any of the public prefixes
    let isPublic = publicPathPrefixes.some(prefix => pathname.startsWith(prefix));

    // Add a specific rule for public budget summary pages, which are also public.
    // e.g., /presupuestos/pres_12345, but NOT /presupuestos/nuevo or /presupuestos/123/edit
    if (!isPublic) {
      const budgetRegex = /^\/presupuestos\/pres_[a-zA-Z0-9_]+\/?$/;
      if (budgetRegex.test(pathname)) {
        isPublic = true;
      }
    }
    
    // If the path is determined to be public, allow access immediately.
    if (isPublic) {
      setIsVerified(true);
      return;
    }
    
    // If the path is not public, then check for admin authentication.
    const isAuthenticated = sessionStorage.getItem(SESSION_KEY) === 'true';
    
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      setIsVerified(true);
    }

  }, [pathname, router]);

  if (!isVerified) {
    // Render a loading state to avoid flashes of content
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

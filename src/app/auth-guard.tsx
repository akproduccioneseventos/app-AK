
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
    if (typeof window === 'undefined') {
      return;
    }
    
    const publicPathPrefixes = [
      '/login',
      '/landing',
      '/evento/actual',
      '/evento/social',
      '/evento/accesos',
      '/evento/muro-en-vivo',
      '/invitacion',
      '/video-vida',
      '/feedback',
      '/portal',
      '/simulador-de-presupuesto',
      '/acceso-personal',
      '/public',
      '/portal-cliente',
      '/simulador',
      '/simulador-ak',
      '/simulador-v2',
      '/proveedor',
      '/presentacion',
      '/evento/mi-mesa',
    ];
    
    let isPublic = publicPathPrefixes.some(prefix => pathname.startsWith(prefix));

    // Budget view pages require a share token in the URL to be accessed publicly.
    // Without a valid ?token= parameter, they require authentication.
    if (!isPublic) {
      const budgetRegex = /^\/presupuestos\/[^/]+\/ver\/?$/;
      if (budgetRegex.test(pathname)) {
        // Only allow public access if a share token is present in the URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('token')) {
          isPublic = true;
        }
      }
    }

    // PDF and printable summaries: only public if accessed with a share token
    if (!isPublic) {
        if (pathname.endsWith('/pdf') || pathname.endsWith('/resumen-imprimible')) {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('token')) {
                isPublic = true;
            }
        }
    }
    
    if (isPublic) {
      setIsVerified(true);
      return;
    }
    
    const session = sessionStorage.getItem(SESSION_KEY);
    const isAuthenticated = !!(session && session.startsWith('YWtfYXV0aF8')); // base64 prefix of 'ak_auth_'
    
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

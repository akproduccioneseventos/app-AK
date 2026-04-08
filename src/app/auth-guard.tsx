
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getSession, clearSession } from '@/lib/auth';

export async function triggerAppLogout() {
  clearSession();
  if (typeof window !== 'undefined') {
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
      '/presentacion-led',
      '/evento/mi-mesa',
      '/evento/en-vivo',
    ];

    let isPublic = publicPathPrefixes.some(prefix => pathname.startsWith(prefix));

    // Budget view pages require a share token in the URL to be accessed publicly.
    if (!isPublic) {
      const budgetRegex = /^\/presupuestos\/[^/]+\/ver\/?$/;
      if (budgetRegex.test(pathname)) {
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

    // E2E mode: bypass auth entirely in CI/E2E environments (never set in production).
    if (process.env.NEXT_PUBLIC_E2E === 'true') {
      console.warn('[AuthGuard] E2E mode active – skipping auth check');
      setIsVerified(true);
      return;
    }

    // Check session-based auth (localStorage / sessionStorage).
    const session = getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    setIsVerified(true);
  }, [pathname, router]);

  if (!isVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

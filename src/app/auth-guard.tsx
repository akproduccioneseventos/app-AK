
'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { clearSession } from '@/lib/auth';

export async function triggerAppLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // Ignore — cookie might already be cleared
  }
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
  const sessionChecked = useRef(false);

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
      '/evento/logistica',
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
      '/invitado',
      '/portal-proveedor',
    ];

    let isPublic = publicPathPrefixes.some(prefix => pathname.startsWith(prefix));

    // Exact-path public routes (not prefix-based to avoid matching /eventos admin page)
    if (pathname === '/evento' || pathname === '/evento/') isPublic = true;

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

    // Already verified once in this session — trust the result.
    // The middleware already checks cookie existence on every navigation,
    // and server actions validate the cookie signature on every call.
    if (sessionChecked.current) {
      setIsVerified(true);
      return;
    }

    // Verify session against the server (validates the httpOnly cookie signature).
    const controller = new AbortController();
    fetch('/api/auth/session', { signal: controller.signal })
      .then(res => {
        if (!res.ok) {
          clearSession();
          router.push('/login');
          return;
        }
        sessionChecked.current = true;
        setIsVerified(true);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        clearSession();
        router.push('/login');
      });

    return () => { controller.abort(); };
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


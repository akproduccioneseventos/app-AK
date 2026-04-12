
'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export async function triggerAppLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // Ignore — cookie might already be cleared
  }
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
  const lastVerifiedAt = useRef<number | null>(null);

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
      '/recuperar-contrasena',
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

    // Re-verify if more than 60 seconds since last successful check
    const now = Date.now();
    if (sessionChecked.current && lastVerifiedAt.current && (now - lastVerifiedAt.current < 60_000)) {
      setIsVerified(true);
      return;
    }

    // Verify session against the server with a real 5-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const verifySession = async (isRetry = false): Promise<void> => {
      try {
        const res = await fetch('/api/auth/session', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          sessionChecked.current = true;
          lastVerifiedAt.current = Date.now();
          setIsVerified(true);
          return;
        }
        // First attempt failed — retry once after a short delay to handle
        // the race condition right after login (cookie may not be ready yet)
        if (!isRetry) {
          await new Promise(resolve => setTimeout(resolve, 400));
          return verifySession(true);
        }
        // Second attempt also failed — session is truly invalid
        try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
        window.location.href = '/login';
      } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof DOMException && err.name === 'AbortError') {
          if (!isRetry) {
            // Timeout on first try — one more attempt
            const retryController = new AbortController();
            const retryTimeout = setTimeout(() => retryController.abort(), 3000);
            try {
              const res = await fetch('/api/auth/session', { signal: retryController.signal });
              clearTimeout(retryTimeout);
              if (res.ok) {
                sessionChecked.current = true;
                lastVerifiedAt.current = Date.now();
                setIsVerified(true);
                return;
              }
            } catch {
              clearTimeout(retryTimeout);
            }
          }
          try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
          window.location.href = '/login';
          return;
        }
        // Network error
        if (!isRetry) {
          await new Promise(resolve => setTimeout(resolve, 400));
          return verifySession(true);
        }
        try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
        window.location.href = '/login';
      }
    };

    verifySession();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
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


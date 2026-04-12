
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

    // Verify session against the server.
    // Each attempt gets its own AbortController and 5-second timeout.
    // If the first attempt fails for any reason (non-ok, timeout, network),
    // we retry once after 400ms. Only if both fail do we logout + redirect.
    let cancelled = false;
    let activeController: AbortController | null = null;

    const verifySession = async (): Promise<void> => {
      // --- First attempt ---
      const controller1 = new AbortController();
      activeController = controller1;
      const timeout1 = setTimeout(() => controller1.abort(), 5000);

      try {
        const res = await fetch('/api/auth/session', { signal: controller1.signal });
        clearTimeout(timeout1);
        if (res.ok) {
          if (!cancelled) {
            sessionChecked.current = true;
            lastVerifiedAt.current = Date.now();
            setIsVerified(true);
          }
          return;
        }
      } catch {
        clearTimeout(timeout1);
      }

      // First attempt failed — wait 400ms then retry to handle the race
      // condition right after login (cookie may not be ready yet)
      if (cancelled) return;
      await new Promise(resolve => setTimeout(resolve, 400));
      if (cancelled) return;

      // --- Second attempt (own controller + own timeout) ---
      const controller2 = new AbortController();
      activeController = controller2;
      const timeout2 = setTimeout(() => controller2.abort(), 5000);

      try {
        const res = await fetch('/api/auth/session', { signal: controller2.signal });
        clearTimeout(timeout2);
        if (res.ok) {
          if (!cancelled) {
            sessionChecked.current = true;
            lastVerifiedAt.current = Date.now();
            setIsVerified(true);
          }
          return;
        }
      } catch {
        clearTimeout(timeout2);
      }

      // Both attempts failed — session is truly invalid
      if (cancelled) return;
      try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
      window.location.href = '/login';
    };

    verifySession();

    return () => {
      cancelled = true;
      if (activeController) activeController.abort();
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


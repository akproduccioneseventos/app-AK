
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const publicPaths = [
      '/login',
      '/evento/actual',
      '/evento/social',
      '/video-vida',
      '/feedback',
      '/portal',
      '/simulador-de-presupuesto',
      '/acceso-personal',
    ];

    const isPublic = publicPaths.some(publicPath => pathname.startsWith(publicPath));

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

    // Already verified once in this session
    if (sessionChecked.current) {
      setIsVerified(true);
      return;
    }

    // Verify session against the server
    const controller = new AbortController();
    fetch('/api/auth/session', { signal: controller.signal })
      .then(res => {
        if (!res.ok) {
          router.push('/login');
          return;
        }
        sessionChecked.current = true;
        setIsVerified(true);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
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

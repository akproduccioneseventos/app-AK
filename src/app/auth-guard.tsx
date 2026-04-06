
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { subscribeToAuthState, signOut, isAdminEmail } from '@/lib/firebase/auth-client';

export async function triggerAppLogout() {
  try {
    await signOut();
  } catch {
    // ignore sign-out errors
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

    // Subscribe to Firebase Auth state
    const unsubscribe = subscribeToAuthState(async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      // Only allow admin emails
      if (!isAdminEmail(user.email)) {
        await signOut();
        router.push('/login');
        return;
      }

      setIsVerified(true);
    });

    return unsubscribe;
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

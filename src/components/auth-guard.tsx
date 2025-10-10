
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

    const isAuthenticated = sessionStorage.getItem(SESSION_KEY) === 'true';
    
    // Define public paths that don't require authentication
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

    if (!isAuthenticated && !isPublic) {
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

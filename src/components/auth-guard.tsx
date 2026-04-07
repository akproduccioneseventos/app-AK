
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

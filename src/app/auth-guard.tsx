'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { clearSessionCookie, getSessionStatus } from '@/app/actions/session';
import { getSession, clearSession } from '@/lib/auth';
import { BUDGET_VIEW_REGEX, PUBLIC_EXACT_PATHS, isPublicPathPrefix } from '@/lib/auth/public-paths';

export async function triggerAppLogout() {
  clearSession();
  await clearSessionCookie();
  if (typeof window !== 'undefined') {
    Object.keys(sessionStorage).forEach((key) => {
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

function isPublicRoute(pathname: string) {
  let isPublic = isPublicPathPrefix(pathname);

  if (PUBLIC_EXACT_PATHS.has(pathname)) isPublic = true;

  if (!isPublic && BUDGET_VIEW_REGEX.test(pathname) && typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('token')) isPublic = true;
  }

  if (!isPublic && (pathname.endsWith('/pdf') || pathname.endsWith('/resumen-imprimible')) && typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('token')) isPublic = true;
  }

  return isPublic;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isVerified, setIsVerified] = useState(false);
  const isPublic = isPublicRoute(pathname);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isPublic) {
      setIsVerified(true);
      return;
    }

    if (process.env.NEXT_PUBLIC_E2E === 'true') {
      console.warn('[AuthGuard] E2E mode active - skipping auth check');
      setIsVerified(true);
      return;
    }

    const session = getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    setIsVerified(true);

    let active = true;
    getSessionStatus().then((isValid) => {
      if (!active) return;
      if (!isValid) {
        triggerAppLogout();
      }
    }).catch((err) => {
      console.error('[AuthGuard] Failed to verify session on server:', err);
    });

    return () => {
      active = false;
    };
  }, [isPublic, pathname, router]);

  if (!isPublic && !isVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

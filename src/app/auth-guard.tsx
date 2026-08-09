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

  if (!isPublic && (pathname.endsWith('/fotografia') || pathname.endsWith('/catering')) && typeof window !== 'undefined') {
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
    let active = true;

    if (isPublic) {
      setIsVerified(true);
      return () => {
        active = false;
      };
    }

    if (process.env.NEXT_PUBLIC_E2E === 'true') {
      console.warn('[AuthGuard] E2E mode active - skipping auth check');
      setIsVerified(true);
      return () => {
        active = false;
      };
    }

    setIsVerified(false);

    async function verifyAccess() {
      if (!getSession()) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      try {
        const isValid = await getSessionStatus();
        if (!active) return;
        if (!isValid) {
          clearSession();
          await clearSessionCookie().catch(() => undefined);
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }
        setIsVerified(true);
      } catch (err) {
        if (!active) return;
        console.error('[AuthGuard] Failed to verify session on server:', err);
        clearSession();
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    }

    void verifyAccess();

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

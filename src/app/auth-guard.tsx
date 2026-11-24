'use client';

import { useEffect, useState, Suspense, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { clearSessionCookie, getSessionStatus } from '@/app/actions/session';
import { getSession, setSession, clearSession } from '@/lib/auth';
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

function isPublicRoute(pathname: string, searchString: string) {
  let isPublic = isPublicPathPrefix(pathname);

  if (PUBLIC_EXACT_PATHS.has(pathname)) isPublic = true;

  const urlParams = new URLSearchParams(searchString);

  if (!isPublic && BUDGET_VIEW_REGEX.test(pathname)) {
    if (urlParams.has('token')) isPublic = true;
  }

  if (!isPublic && (pathname.endsWith('/pdf') || pathname.endsWith('/resumen-imprimible') || searchString.includes('tab=pdf') || urlParams.get('tab') === 'pdf' || searchString.includes('subtab=pdf') || urlParams.get('subtab') === 'pdf')) {
    if (urlParams.has('token')) isPublic = true;
  }

  if (!isPublic) {
    const tab = urlParams.get('tab');
    const isProviderView =
      pathname.endsWith('/fotografia') ||
      pathname.endsWith('/catering') ||
      pathname.endsWith('/reposteria') ||
      (pathname.endsWith('/comida') && tab === 'catering') ||
      (pathname.endsWith('/show') && tab === 'fotografia');
    if (isProviderView && urlParams.has('token')) isPublic = true;
  }

  return isPublic;
}

function AuthGuardInner({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchString = searchParams?.toString() ?? '';
  const [isVerified, setIsVerified] = useState(false);
  const isPublic = isPublicRoute(pathname, searchString);

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
        const isValid = await getSessionStatus();
        if (!active) return;
        if (isValid) {
          setSession();
          setIsVerified(true);
          return;
        }
        const fullPath = searchString ? `${pathname}?${searchString}` : pathname;
        router.replace(`/login?redirect=${encodeURIComponent(fullPath)}`);
        return;
      }

      try {
        const isValid = await getSessionStatus();
        if (!active) return;
        if (!isValid) {
          clearSession();
          await clearSessionCookie().catch(() => undefined);
          const fullPath = searchString ? `${pathname}?${searchString}` : pathname;
          router.replace(`/login?redirect=${encodeURIComponent(fullPath)}`);
          return;
        }
        setIsVerified(true);
      } catch (err) {
        if (!active) return;
        console.error('[AuthGuard] Failed to verify session on server:', err);
        clearSession();
        const fullPath = searchString ? `${pathname}?${searchString}` : pathname;
        router.replace(`/login?redirect=${encodeURIComponent(fullPath)}`);
      }
    }

    void verifyAccess();

    return () => {
      active = false;
    };
  }, [isPublic, pathname, searchString, router]);

  if (!isPublic && !isVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

export function AuthGuard({ children }: AuthGuardProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <AuthGuardInner>{children}</AuthGuardInner>
    </Suspense>
  );
}

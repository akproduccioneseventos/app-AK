import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { BUDGET_VIEW_REGEX, PUBLIC_EXACT_PATHS, isPublicPathPrefix } from '@/lib/auth/public-paths';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session-token';

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true;
  if (isPublicPathPrefix(pathname)) return true;

  // Shared budget links validate their token inside the page.
  if (BUDGET_VIEW_REGEX.test(pathname)) return true;

  // Printable shared documents validate their token inside the page.
  if (pathname.endsWith('/pdf') || pathname.endsWith('/resumen-imprimible')) return true;

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requestId = crypto.randomUUID().substring(0, 8);

  if (isPublicPath(pathname)) {
    const response = NextResponse.next();
    response.headers.set('x-request-id', requestId);
    return response;
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  // App Hosting middleware cannot access runtime-only secrets. The AuthGuard
  // and every protected server action validate the signed cookie at runtime.
  if (!sessionCookie?.value) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set('x-request-id', requestId);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

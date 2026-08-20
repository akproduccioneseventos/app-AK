import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { BUDGET_VIEW_REGEX, PUBLIC_EXACT_PATHS, isPublicPathPrefix } from '@/lib/auth/public-paths';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session-constants';
import { esPedidoDeRobot } from '@/lib/auth/rutas-de-robots';

function isPublicPath(request: NextRequest): boolean {
  const { pathname, searchParams } = request.nextUrl;
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true;
  if (isPublicPathPrefix(pathname)) return true;

  // Shared budget links validate their token inside the page.
  if (BUDGET_VIEW_REGEX.test(pathname)) return true;

  // Printable shared documents validate their token inside the page.
  if (pathname.endsWith('/pdf') || pathname.endsWith('/resumen-imprimible')) return true;

  // Provider shared views validate their token inside the page.
  if ((pathname.endsWith('/fotografia') || pathname.endsWith('/catering')) && searchParams.has('token')) return true;

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Los robots que buscan WordPress, phpMyAdmin y archivos con contrasenas adentro
  // se van aca mismo, antes de hacer ningun trabajo. Ninguna de esas direcciones
  // existe en la app: antes cada intento despertaba al servidor, terminaba en la
  // pantalla de ingreso y quedaba anotado como error, tapando los errores de verdad.
  if (esPedidoDeRobot(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  const requestId = crypto.randomUUID().substring(0, 8);

  if (isPublicPath(request)) {
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
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
    // Las direcciones con punto no pasan por la regla de arriba. Los pedidos de
    // robots terminados en .php, .env y compania se agregan aparte para poder
    // cortarlos en la puerta.
    '/(.*)\\.(php|php7|phtml|asp|aspx|jsp|cgi|env|sql|bak|old)',
  ],
};

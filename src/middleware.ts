import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from './lib/auth/session-token';

// Rutas que NO requieren sesion activa.
// Deben coincidir con la lista en src/app/auth-guard.tsx (publicPathPrefixes).
const PUBLIC_PATH_PREFIXES = [
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
  '/evento/dj',
  '/invitado',
  '/portal-proveedor',
];

const PUBLIC_API_PREFIXES = [
  '/api/public-page-assets',
  '/api/whatsapp/webhook',
];

const PUBLIC_API_FILE_REGEXES = [
  /^\/api\/social-gallery\/[^/]+\/[^/]+\.[^/]+$/,
  /^\/api\/video-vida-photos\/[^/]+\/[^/]+\.[^/]+$/,
];

// Rutas exactas que son publicas pero que tienen un prefijo que coincidiria
// con una ruta privada (/evento/ sin nada mas, por ejemplo).
const PUBLIC_EXACT_PATHS = new Set(['/evento', '/evento/']);

// Regex para paginas de vista de presupuesto que pueden ser publicas con token.
const BUDGET_VIEW_REGEX = /^\/presupuestos\/[^/]+\/ver\/?$/;

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true;
  if (PUBLIC_API_PREFIXES.some(prefix => pathname.startsWith(prefix))) return true;
  if (PUBLIC_API_FILE_REGEXES.some(regex => regex.test(pathname))) return true;
  if (PUBLIC_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix))) return true;

  // Presupuestos con token de compartir.
  if (BUDGET_VIEW_REGEX.test(pathname)) return true; // token se valida en el componente.

  // PDFs / resumenes imprimibles con token.
  if (pathname.endsWith('/pdf') || pathname.endsWith('/resumen-imprimible')) return true;

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Add request ID header for tracing.
  const requestId = crypto.randomUUID().substring(0, 8);

  // Si la ruta es publica, dejar pasar sin validacion de sesion.
  if (isPublicPath(pathname)) {
    const response = NextResponse.next();
    response.headers.set('x-request-id', requestId);
    return response;
  }

  // Verificar cookie firmada para rutas protegidas.
  const sessionCookie = request.cookies.get(SESSION_COOKIE);
  const hasValidSession = await verifySessionToken(sessionCookie?.value);
  if (!hasValidSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set('x-request-id', requestId);
  return response;
}

export const config = {
  // Run on every API route, including file-style URLs such as .pdf/.jpg.
  // Non-API static assets with dots stay excluded.
  matcher: ['/api/:path*', '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

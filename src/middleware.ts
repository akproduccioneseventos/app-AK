import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que NO requieren sesión activa.
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
  '/invitado',
  '/portal-proveedor',
];

// Rutas exactas que son públicas pero que tienen un prefijo que coincidiría
// con una ruta privada (/evento/ sin nada más, por ejemplo).
const PUBLIC_EXACT_PATHS = new Set(['/evento', '/evento/']);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true;
  if (PUBLIC_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix))) return true;

  // Presupuestos con token de compartir
  const budgetViewRegex = /^\/presupuestos\/[^/]+\/ver\/?$/;
  if (budgetViewRegex.test(pathname)) return true; // token se valida en el componente

  // PDFs / resúmenes imprimibles con token
  if (pathname.endsWith('/pdf') || pathname.endsWith('/resumen-imprimible')) return true;

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Add request ID header for tracing
  const requestId = crypto.randomUUID().substring(0, 8);

  // Si la ruta es pública, dejar pasar sin validación de sesión.
  if (isPublicPath(pathname)) {
    const response = NextResponse.next();
    response.headers.set('x-request-id', requestId);
    return response;
  }

  // Verificar cookie de sesión para rutas protegidas.
  const sessionCookie = request.cookies.get('ak_session');
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
  // No ejecutar en archivos estáticos ni en rutas de API internas de Next.js
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
  '/recuperar-contrasena',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/manifest') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Allow public routes
  const isPublic = PUBLIC_PATH_PREFIXES.some(p => pathname.startsWith(p)) ||
    pathname === '/evento' ||
    pathname === '/evento/';

  if (isPublic) return NextResponse.next();

  // E2E mode: bypass auth in CI environments (NEXT_PUBLIC_E2E is embedded at build time)
  if (process.env.NEXT_PUBLIC_E2E === 'true') {
    return NextResponse.next();
  }

  // Check for server-side session cookie
  const session = request.cookies.get('ak_session');
  if (!session?.value) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest|sw\\.js|workbox).*)'],
};

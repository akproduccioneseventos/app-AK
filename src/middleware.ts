import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add request ID header for tracing
  const requestId = crypto.randomUUID().substring(0, 8);
  response.headers.set('x-request-id', requestId);

  return response;
}

export const config = {
  // Don't run middleware on static files or api routes that handle their own logging
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

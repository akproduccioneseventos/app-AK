import { NextResponse } from 'next/server';
import { darDeBajaSuscriptor } from '@/lib/blog/suscriptores';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token') || '';
  const resultado = await darDeBajaSuscriptor(token);

  const accept = request.headers.get('accept') || '';
  if (accept.includes('application/json') && !accept.includes('text/html')) {
    return NextResponse.json(
      { success: resultado.success, message: resultado.message },
      { status: resultado.success ? 200 : 400 },
    );
  }

  const destino = new URL(resultado.success ? '/blog?baja=ok' : '/blog?baja=error', request.url);
  return NextResponse.redirect(destino, 302);
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  let token = searchParams.get('token') || '';

  if (!token) {
    const contentType = request.headers.get('content-type') || '';
    try {
      if (contentType.includes('application/json')) {
        const body = (await request.json()) as Record<string, unknown>;
        token = typeof body?.token === 'string' ? body.token : '';
      } else if (
        contentType.includes('multipart/form-data') ||
        contentType.includes('application/x-www-form-urlencoded')
      ) {
        const formData = await request.formData();
        token = String(formData.get('token') || '');
      }
    } catch {
      return NextResponse.json(
        { success: false, message: 'No pudimos leer el pedido de baja.' },
        { status: 400 },
      );
    }
  }

  const resultado = await darDeBajaSuscriptor(token);
  return NextResponse.json(
    { success: resultado.success, message: resultado.message },
    { status: resultado.success ? 200 : 400 },
  );
}

import { NextResponse } from 'next/server';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { registrarSuscriptorBlog } from '@/lib/blog/suscriptores';

function parseConsentimiento(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === 'string') {
    const clean = value.trim().toLowerCase();
    return clean === 'true' || clean === 'on' || clean === '1' || clean === 'si' || clean === 'sí';
  }
  return false;
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'test') {
    try {
      await enforcePublicRateLimit({
        scope: 'suscripcion-blog-api',
        limit: 5,
        windowMs: 60_000,
      });
    } catch {
      return NextResponse.json(
        { success: false, message: 'Aguardá un momento antes de reintentar.' },
        { status: 429 },
      );
    }
  }

  let email = '';
  let consentimiento = false;

  const contentType = request.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      const body = (await request.json()) as Record<string, unknown>;
      email = typeof body?.email === 'string' ? body.email : '';
      consentimiento = parseConsentimiento(body?.consentimiento ?? body?.acepta);
    } else {
      const formData = await request.formData();
      email = String(formData.get('email') || '');
      consentimiento = parseConsentimiento(
        formData.get('consentimiento') ?? formData.get('acepta'),
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, message: 'No pudimos leer los datos enviados.' },
      { status: 400 },
    );
  }

  const resultado = await registrarSuscriptorBlog({ email, consentimiento });
  return NextResponse.json(
    { success: resultado.success, message: resultado.message },
    { status: resultado.success ? 200 : 400 },
  );
}

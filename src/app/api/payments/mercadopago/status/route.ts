import { NextRequest, NextResponse } from 'next/server';
import { getMercadoPagoCheckoutSession } from '@/lib/payments/mercadopago-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sessionId = new URL(request.url).searchParams.get('session') || '';
    if (!/^[a-f0-9-]{36}$/i.test(sessionId)) {
      return NextResponse.json({ error: 'Sesion de pago invalida.' }, { status: 400 });
    }
    const session = await getMercadoPagoCheckoutSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Sesion de pago no encontrada.' }, { status: 404 });
    }
    return NextResponse.json({
      status: session.status,
      amount: session.amount,
      serviceAmount: session.serviceAmount,
      surchargeAmount: session.surchargeAmount,
      purpose: session.purpose,
      requiresReview: Boolean(session.requiresReview),
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'No se pudo consultar el pago.',
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import {
  createMercadoPagoCheckout,
  isMercadoPagoReady,
} from '@/lib/payments/mercadopago-server';
import type { MercadoPagoCheckoutPurpose } from '@/lib/payments/mercadopago-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAYABLE_STATES = new Set(['Enviado', 'Aceptado', 'Facturado']);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      presupuestoId?: string;
      token?: string;
      purpose?: MercadoPagoCheckoutPurpose;
    };
    const presupuestoId = String(body.presupuestoId || '').trim();
    const token = String(body.token || '').trim();
    const purpose = body.purpose;
    if (!presupuestoId || presupuestoId.length > 160 || !token || token.length > 1024) {
      return NextResponse.json({ error: 'El acceso al presupuesto no es valido.' }, { status: 400 });
    }
    if (purpose !== 'deposit' && purpose !== 'balance') {
      return NextResponse.json({ error: 'La opcion de pago no es valida.' }, { status: 400 });
    }
    if (!isMercadoPagoReady()) {
      return NextResponse.json(
        { error: 'Mercado Pago todavia no esta habilitado.' },
        { status: 503 },
      );
    }

    await enforcePublicRateLimit({
      scope: 'mercadopago-checkout',
      identity: presupuestoId,
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });
    const presupuesto = await getPresupuestoById(presupuestoId, token);
    if (!presupuesto) {
      return NextResponse.json({ error: 'Presupuesto no encontrado.' }, { status: 404 });
    }
    if (!PAYABLE_STATES.has(presupuesto.estado)) {
      return NextResponse.json(
        { error: 'AK debe verificar el presupuesto antes de habilitar el pago.' },
        { status: 409 },
      );
    }

    const result = await createMercadoPagoCheckout({ presupuesto, purpose });
    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      sessionId: result.session.id,
      amount: result.session.amount,
      sandbox: process.env.MERCADO_PAGO_USE_SANDBOX !== 'false',
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo iniciar el pago.';
    const status = message.startsWith('Demasiados intentos') ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

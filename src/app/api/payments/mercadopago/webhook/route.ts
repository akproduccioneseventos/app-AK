import { NextRequest, NextResponse } from 'next/server';
import { createNotification } from '@/lib/notifications/create-notification';
import {
  getMercadoPagoPayment,
  reconcileMercadoPagoPayment,
} from '@/lib/payments/mercadopago-server';
import { verifyMercadoPagoWebhookSignature } from '@/lib/payments/mercadopago-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim();
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook no configurado.' }, { status: 503 });
    }
    const url = new URL(request.url);
    const rawBody = await request.text();
    const body = JSON.parse(rawBody || '{}') as {
      type?: string;
      data?: { id?: string | number };
    };
    if (body.type && body.type !== 'payment') {
      return NextResponse.json({ status: 'ignored' });
    }
    const dataId = url.searchParams.get('data.id') || String(body.data?.id || '');
    if (!dataId) {
      return NextResponse.json({ error: 'Falta el identificador del pago.' }, { status: 400 });
    }
    const signatureValid = verifyMercadoPagoWebhookSignature({
      signature: request.headers.get('x-signature'),
      requestId: request.headers.get('x-request-id'),
      dataId,
      secret: webhookSecret,
    });
    if (!signatureValid) {
      return NextResponse.json({ error: 'Firma invalida.' }, { status: 401 });
    }

    const payment = await getMercadoPagoPayment(dataId);
    const result = await reconcileMercadoPagoPayment(payment);
    if (result.changed) {
      const approved = result.sessionStatus === 'approved';
      await createNotification({
        titulo: approved ? 'Pago de Mercado Pago confirmado' : 'Pago de Mercado Pago revertido',
        mensaje: result.requiresReview
          ? 'El pago fue recibido, pero requiere revision porque el saldo cambio durante el checkout.'
          : approved
            ? 'Mercado Pago confirmo el cobro y el saldo se actualizo automaticamente.'
            : 'Mercado Pago informo una devolucion o contracargo y el saldo fue restaurado.',
        href: `/presupuestos/${result.presupuestoId}/estado-de-cuenta`,
        icono: 'ListChecks',
        tipo: result.requiresReview ? 'aviso' : approved ? 'exito' : 'aviso',
        entidadRelacionadaId: result.presupuestoId,
        rolDestino: 'admin',
      }).catch((error) => console.warn('[Mercado Pago] Notification failed:', error));
    }
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('[Mercado Pago] Webhook failed:', error);
    return NextResponse.json({ error: 'No se pudo procesar el webhook.' }, { status: 500 });
  }
}

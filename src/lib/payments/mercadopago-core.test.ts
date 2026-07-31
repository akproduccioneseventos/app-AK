import { createHmac } from 'crypto';
import {
  mapMercadoPagoPaymentStatus,
  reconcileMercadoPagoBudget,
  resolveMercadoPagoCheckoutAmount,
  verifyMercadoPagoWebhookSignature,
} from './mercadopago-core';
import type { Presupuesto } from '@/types/presupuesto';

const budget = (overrides: Partial<Presupuesto> = {}): Presupuesto => ({
  id: 'presupuesto-1',
  clienteNombre: 'Cliente prueba',
  eventoTipo: 'Boda',
  eventoFecha: '2027-10-10',
  invitadosCantidad: 100,
  salonFiestas: 'Club Uruguay',
  itemsPresupuestados: [],
  costoTotalEstimado: 10_000,
  totalConDescuento: 10_000,
  timestamp: '2026-07-30T12:00:00.000Z',
  estado: 'Enviado',
  ...overrides,
});

describe('Mercado Pago Checkout Pro core', () => {
  it('uses the smaller value when the deposit is greater than the balance', () => {
    expect(resolveMercadoPagoCheckoutAmount({
      balance: 3_200,
      purpose: 'deposit',
      depositAmount: 5_000,
    })).toBe(3_200);
  });

  it('uses the complete pending balance when requested', () => {
    expect(resolveMercadoPagoCheckoutAmount({
      balance: 87_450,
      purpose: 'balance',
      depositAmount: 5_000,
    })).toBe(87_450);
  });

  it('rejects a checkout when there is no pending balance', () => {
    expect(() => resolveMercadoPagoCheckoutAmount({
      balance: 0,
      purpose: 'balance',
      depositAmount: 5_000,
    })).toThrow('saldo pendiente');
  });

  it('maps provider statuses without treating pending payments as income', () => {
    expect(mapMercadoPagoPaymentStatus('approved')).toBe('approved');
    expect(mapMercadoPagoPaymentStatus('in_process')).toBe('pending');
    expect(mapMercadoPagoPaymentStatus('rejected')).toBe('rejected');
    expect(mapMercadoPagoPaymentStatus('charged_back')).toBe('refunded');
  });

  it('validates the official webhook HMAC manifest', () => {
    const secret = 'test-secret';
    const dataId = 'ABC123';
    const requestId = 'request-456';
    const timestamp = '1704908010';
    const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`;
    const hash = createHmac('sha256', secret).update(manifest).digest('hex');

    expect(verifyMercadoPagoWebhookSignature({
      signature: `ts=${timestamp},v1=${hash}`,
      requestId,
      dataId,
      secret,
    })).toBe(true);
  });

  it('rejects modified webhook signatures', () => {
    expect(verifyMercadoPagoWebhookSignature({
      signature: `ts=1704908010,v1=${'0'.repeat(64)}`,
      requestId: 'request-456',
      dataId: '123',
      secret: 'test-secret',
    })).toBe(false);
  });

  it('records an approved provider payment once', () => {
    const first = reconcileMercadoPagoBudget({
      presupuesto: budget(),
      sessionId: 'session-1',
      amount: 5_000,
      chargedAmount: 5_500,
      payment: {
        id: 'payment-1',
        status: 'approved',
        transaction_amount: 5_500,
        installments: 3,
      },
    });
    expect(first.changed).toBe(true);
    expect(first.presupuesto.pagosCliente).toEqual([
      expect.objectContaining({
        monto: 5_000,
        estadoPago: 'confirmado',
        proveedorPagoId: 'payment-1',
        cuotasFinanciacion: 3,
        montoCobrado: 5_500,
        recargoFinanciero: 500,
      }),
    ]);

    const repeated = reconcileMercadoPagoBudget({
      presupuesto: first.presupuesto,
      sessionId: 'session-1',
      amount: 5_000,
      chargedAmount: 5_500,
      payment: {
        id: 'payment-1',
        status: 'approved',
        transaction_amount: 5_500,
      },
    });
    expect(repeated.changed).toBe(false);
    expect(repeated.presupuesto.pagosCliente).toHaveLength(1);
  });

  it('restores the balance after a refund notification', () => {
    const approved = reconcileMercadoPagoBudget({
      presupuesto: budget(),
      sessionId: 'session-1',
      amount: 5_000,
      payment: { id: 'payment-1', status: 'approved', transaction_amount: 5_000 },
    });
    const refunded = reconcileMercadoPagoBudget({
      presupuesto: approved.presupuesto,
      sessionId: 'session-1',
      amount: 5_000,
      payment: { id: 'payment-1', status: 'refunded', transaction_amount: 5_000 },
    });
    expect(refunded.changed).toBe(true);
    expect(refunded.presupuesto.pagosCliente?.[0]).toEqual(expect.objectContaining({
      estadoPago: 'rechazado',
      estadoProveedorPago: 'refunded',
    }));
  });

  it('keeps only the net confirmed amount after a partial refund', () => {
    const approved = reconcileMercadoPagoBudget({
      presupuesto: budget(),
      sessionId: 'session-1',
      amount: 5_000,
      payment: { id: 'payment-1', status: 'approved', transaction_amount: 5_000 },
    });
    const partiallyRefunded = reconcileMercadoPagoBudget({
      presupuesto: approved.presupuesto,
      sessionId: 'session-1',
      amount: 5_000,
      payment: {
        id: 'payment-1',
        status: 'approved',
        transaction_amount: 5_000,
        transaction_amount_refunded: 2_000,
      },
    });
    expect(partiallyRefunded.status).toBe('refunded');
    expect(partiallyRefunded.presupuesto.pagosCliente?.[0]).toEqual(expect.objectContaining({
      estadoPago: 'confirmado',
      monto: 3_000,
      montoReintegrado: 2_000,
    }));
  });

  it('keeps an approved real payment and flags an overpayment for review', () => {
    const result = reconcileMercadoPagoBudget({
      presupuesto: budget({
        pagosCliente: [{
          id: 'manual-1',
          fecha: '2026-07-30',
          monto: 8_000,
          metodoPago: 'Efectivo',
          estadoPago: 'confirmado',
        }],
      }),
      sessionId: 'session-2',
      amount: 5_000,
      payment: { id: 'payment-2', status: 'approved', transaction_amount: 5_000 },
    });
    expect(result.changed).toBe(true);
    expect(result.requiresReview).toBe(true);
    expect(result.presupuesto.pagosCliente).toHaveLength(2);
  });
});

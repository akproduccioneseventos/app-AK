import { reconcileMercadoPagoBudget } from '@/lib/payments/mercadopago-core';

const mockCollectionData = new Map<string, any>();

jest.mock('@/lib/auth/solo-lectura', () => ({
  exigirQueNoSalgaAfuera: jest.fn(async () => {}),
}));
jest.mock('@/app/actions/settings', () => ({
  getBudgetDisplaySettings: jest.fn(async () => ({ bookingDepositAmount: 10000 })),
}));
jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: {
    collection: jest.fn(() => ({
      where: jest.fn((_field: string, _op: string, val: string) => ({
        get: jest.fn(async () => ({
          docs: [...mockCollectionData.values()]
            .filter((d) => d.presupuestoId === val)
            .map((d) => ({ data: () => d })),
        })),
      })),
      doc: jest.fn((id: string) => ({
        set: jest.fn(async (data: any, opts?: { merge?: boolean }) => {
          const prev = opts?.merge ? mockCollectionData.get(id) || {} : {};
          mockCollectionData.set(id, { ...prev, ...data });
        }),
        get: jest.fn(async () => ({
          exists: mockCollectionData.has(id),
          data: () => mockCollectionData.get(id),
        })),
      })),
    })),
  },
}));

describe('La seña no se paga dos veces y reintegro parcial informa cifras (Orden 373 B2)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockCollectionData.clear();
    process.env.MERCADO_PAGO_ACCESS_TOKEN = 'TEST_MP_TOKEN';
    process.env.MERCADO_PAGO_USE_SANDBOX = 'true';
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        id: 'pref-1',
        init_point: 'https://mp.test/init/pref-1',
        sandbox_init_point: 'https://mp.test/sandbox/pref-1',
      }),
    })) as any;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('dos checkouts seguidos para el mismo presupuesto y fin devuelven la misma sesión sin duplicar preferencia', async () => {
    const { createMercadoPagoCheckout } = await import('@/lib/payments/mercadopago-server');
    const presupuesto = {
      id: 'pres-mp-1',
      numero: 'AK-1',
      clienteNombre: 'Ana',
      eventoTipo: 'Cumpleaños',
      estado: 'Aceptado',
      costoTotalEstimado: 100000,
      totalConDescuento: 100000,
      pagosCliente: [],
    } as any;

    const primero = await createMercadoPagoCheckout({ presupuesto, purpose: 'deposit' });
    const segundo = await createMercadoPagoCheckout({ presupuesto, purpose: 'deposit' });

    expect(segundo.session.id).toBe(primero.session.id);
    expect(segundo.checkoutUrl).toBe(primero.checkoutUrl);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('un pago que supera el saldo (saldo negativo) queda con requiresReview true y un reintegro parcial expone refundedAmount y netAmount', () => {
    const sobrepago = reconcileMercadoPagoBudget({
      presupuesto: {
        id: 'p2',
        estado: 'Aceptado',
        totalConDescuento: 10000,
        costoTotalEstimado: 10000,
        pagosCliente: [
          { id: 'prev', fecha: '2026-08-01', monto: 8000, metodoPago: 'Efectivo', estadoPago: 'confirmado' },
        ],
      } as any,
      sessionId: 'ses-over',
      amount: 5000,
      payment: { id: 'pay-over', status: 'approved', transaction_amount: 5000 },
    });
    expect(sobrepago.requiresReview).toBe(true);

    const parcial = reconcileMercadoPagoBudget({
      presupuesto: sobrepago.presupuesto,
      sessionId: 'ses-over',
      amount: 5000,
      payment: {
        id: 'pay-over',
        status: 'approved',
        transaction_amount: 5000,
        transaction_amount_refunded: 1500,
      },
    });
    expect(parcial.refundedAmount).toBe(1500);
    expect(parcial.netAmount).toBe(3500);
  });

  it('pasarCobrosPendientesAlPresupuesto devuelve success: false cuando la lectura falla', async () => {
    jest.resetModules();
    const { marcarLecturaFallida } = await import('@/lib/marca-de-lectura');
    jest.doMock('@/lib/auth/require-session', () => ({
      requirePermiso: jest.fn(async () => ({ ok: true })),
    }));
    jest.doMock('@/lib/invoices/leer-facturas', () => ({
      leerFacturasSinGuardia: jest.fn(async () => marcarLecturaFallida([])),
    }));
    jest.doMock('@/app/actions/presupuestos', () => ({
      addPagoToPresupuesto: jest.fn(),
      markPresupuestoAsFacturado: jest.fn(),
      getPresupuestos: jest.fn(async () => []),
    }));
    const { pasarCobrosPendientesAlPresupuesto } = await import('@/app/actions/invoices');
    const res = await pasarCobrosPendientesAlPresupuesto();
    expect(res.success).toBe(false);
  });
});

import type { Presupuesto } from '@/types/presupuesto';
import {
  normalizePresupuestoFinancials,
  validatePaymentAgainstBudget,
  sumConfirmedClientPayments,
  sumPendingClientPayments,
} from '@/lib/budget/financial-guardrails';
import { auditPresupuestoTotals } from '@/lib/commercial-flow/budget-audit';

function presupuesto(overrides: Partial<Presupuesto> = {}): Presupuesto {
  return {
    id: 'pres_guard',
    clienteNombre: 'Cliente Test',
    eventoTipo: 'XV anos',
    eventoFecha: '2026-12-20',
    invitadosCantidad: 100,
    invitadosAdultos: 80,
    invitadosNinos: 10,
    invitadosAdolescentes: 10,
    salonFiestas: 'Salon AK',
    itemsPresupuestados: [
      {
        idServicioCatalogo: 'discoteca',
        nombreServicio: 'Discoteca',
        cantidad: 1,
        precioUnitario: 1000,
        precioUnitarioPresupuesto: 1000,
        costoTotalItem: 0,
        calculationMethod: 'fijo',
      },
    ],
    costoTotalEstimado: 0,
    descuentoTipo: 'porcentaje',
    descuentoValor: 10,
    totalConDescuento: 0,
    timestamp: '2026-05-16T12:00:00.000Z',
    estado: 'Enviado',
    ...overrides,
  };
}

describe('financial guardrails', () => {
  it('normalizes subtotal, discount and balance using only confirmed payments', () => {
    const normalized = normalizePresupuestoFinancials(presupuesto({
      pagosCliente: [
        { id: 'p1', fecha: '2026-05-16', monto: 200, metodoPago: 'Efectivo', estadoPago: 'confirmado' },
        { id: 'p2', fecha: '2026-05-16', monto: 300, metodoPago: 'Transferencia Bancaria', estadoPago: 'pendiente_confirmacion' },
      ],
    }));

    expect(normalized.costoTotalEstimado).toBe(1000);
    expect(normalized.totalConDescuento).toBe(900);
    expect(normalized.saldo).toBe(700);
    expect(sumConfirmedClientPayments(normalized.pagosCliente)).toBe(200);
    expect(sumPendingClientPayments(normalized.pagosCliente)).toBe(300);
  });

  it('blocks payments that would charge more than the remaining balance', () => {
    const normalized = normalizePresupuestoFinancials(presupuesto({
      pagosCliente: [
        { id: 'p1', fecha: '2026-05-16', monto: 850, metodoPago: 'Efectivo', estadoPago: 'confirmado' },
      ],
    }));

    const result = validatePaymentAgainstBudget(normalized, 100);

    expect(result.ok).toBe(false);
    expect(result.remainingBeforePayment).toBe(50);
  });

  it('can reserve pending payments before accepting another client proof', () => {
    const normalized = normalizePresupuestoFinancials(presupuesto({
      pagosCliente: [
        { id: 'p1', fecha: '2026-05-16', monto: 500, metodoPago: 'Efectivo', estadoPago: 'confirmado' },
        { id: 'p2', fecha: '2026-05-16', monto: 350, metodoPago: 'Transferencia Bancaria', estadoPago: 'pendiente_confirmacion' },
      ],
    }));

    const result = validatePaymentAgainstBudget(normalized, 100, { includePendingForLimit: true });

    expect(result.ok).toBe(false);
    expect(result.remainingBeforePayment).toBe(50);
  });

  it('marks a budget inconsistent when stored totals do not match the central engine', () => {
    const result = auditPresupuestoTotals(presupuesto({ totalConDescuento: 1200, costoTotalEstimado: 1000 }));

    expect(result.esConsistente).toBe(false);
    expect(result.observaciones.some((item) => item.severidad === 'error')).toBe(true);
  });
});

import type { Presupuesto } from '@/types/presupuesto';
import {
  normalizePresupuestoFinancials,
  validatePaymentAgainstBudget,
  sumConfirmedClientPayments,
  sumPendingClientPayments,
  getBudgetPaymentSummary,
  getPaymentReceiptSnapshot,
  auditPresupuestoFinancialGuardrails,
  calculateDiscountAmount,
  findMatchingClientPayment,
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
        { id: 'p3', fecha: '2026-05-16', monto: 400, metodoPago: 'Transferencia Bancaria', estadoPago: 'rechazado' },
      ],
    }));

    expect(normalized.costoTotalEstimado).toBe(1000);
    expect(normalized.totalConDescuento).toBe(900);
    expect(normalized.saldo).toBe(700);
    expect(sumConfirmedClientPayments(normalized.pagosCliente)).toBe(200);
    expect(sumPendingClientPayments(normalized.pagosCliente)).toBe(300);
  });

  it('uses adultos + ninos + adolescentes as the canonical guest total', () => {
    const normalized = normalizePresupuestoFinancials(presupuesto({
      invitadosCantidad: 999,
      invitadosAdultos: 90,
      invitadosNinos: 20,
      invitadosAdolescentes: 10,
      itemsPresupuestados: [
        {
          idServicioCatalogo: 'catering',
          nombreServicio: 'Catering general',
          cantidad: 1,
          precioUnitario: 100,
          precioUnitarioPresupuesto: 100,
          costoTotalItem: 0,
          calculationMethod: 'porPersona',
        },
      ],
    }));

    expect(normalized.invitadosCantidad).toBe(120);
    expect(normalized.costoTotalEstimado).toBe(12000);
    expect(normalized.totalConDescuento).toBe(10800);
  });

  it('keeps future-year adjustment out of the official total and balance', () => {
    const normalized = normalizePresupuestoFinancials(presupuesto({
      eventoFecha: '2028-12-20',
      ajusteAnualActivo: true,
      ajusteAnualPorcentaje: 15,
    }));

    expect(normalized.totalConDescuento).toBe(900);
    expect(normalized.saldo).toBe(900);
  });

  it('calculates one traceable percentage or fixed discount', () => {
    expect(calculateDiscountAmount(100_000, {
      descuentoTipo: 'porcentaje',
      descuentoValor: 10,
    })).toBe(10_000);
    expect(calculateDiscountAmount(100_000, {
      descuentoTipo: 'fijo',
      descuentoValor: 7_500,
    })).toBe(7_500);
  });

  it('preserves a server-priced simulator total while recalculating its balance', () => {
    const normalized = normalizePresupuestoFinancials(presupuesto({
      costoTotalEstimado: 100_000,
      totalConDescuento: 87_500,
      descuentoTipo: 'porcentaje',
      descuentoValor: 5,
      pagosCliente: [
        { id: 'p1', fecha: '2026-05-16', monto: 10_000, metodoPago: 'Efectivo', estadoPago: 'confirmado' },
      ],
    }), { preserveStoredTotal: true });

    expect(normalized.totalConDescuento).toBe(87_500);
    expect(normalized.saldo).toBe(77_500);
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

  it('builds one safe payment summary for screens and receipts', () => {
    const normalized = normalizePresupuestoFinancials(presupuesto({
      pagosCliente: [
        { id: 'p1', fecha: '2026-05-16', monto: 300, metodoPago: 'Efectivo', estadoPago: 'confirmado' },
        { id: 'p2', fecha: '2026-05-16', monto: 100, metodoPago: 'Transferencia Bancaria', estadoPago: 'pendiente_confirmacion' },
      ],
    }));

    const summary = getBudgetPaymentSummary(normalized);
    const receipt = getPaymentReceiptSnapshot(normalized, normalized.pagosCliente![0]);

    expect(summary.total).toBe(900);
    expect(summary.paid).toBe(300);
    expect(summary.pendingReview).toBe(100);
    expect(summary.balance).toBe(600);
    expect(receipt.balanceBeforePayment).toBe(900);
    expect(receipt.balanceAfterPayment).toBe(600);
  });

  it('does not create a fake receipt balance for payments pending review', () => {
    const normalized = normalizePresupuestoFinancials(presupuesto({
      pagosCliente: [
        { id: 'p1', fecha: '2026-05-16', monto: 300, metodoPago: 'Efectivo', estadoPago: 'confirmado' },
        { id: 'p2', fecha: '2026-05-16', monto: 100, metodoPago: 'Transferencia Bancaria', estadoPago: 'pendiente_confirmacion' },
      ],
    }));

    const receipt = getPaymentReceiptSnapshot(normalized, normalized.pagosCliente![1]);

    expect(receipt.balanceBeforePayment).toBe(600);
    expect(receipt.balanceAfterPayment).toBe(600);
  });

  it('recognizes the same payment on retry without accepting rejected or invalid records', () => {
    const payments = [
      { id: 'p1', fecha: '2026-05-16T21:00:00.000Z', monto: 300, metodoPago: 'Efectivo' as const, estadoPago: 'confirmado' as const },
      { id: 'p2', fecha: 'fecha-invalida', monto: 300, metodoPago: 'Efectivo' as const, estadoPago: 'confirmado' as const },
      { id: 'p3', fecha: '2026-05-17', monto: 300, metodoPago: 'Efectivo' as const, estadoPago: 'rechazado' as const },
    ];

    expect(findMatchingClientPayment(payments, 300, '2026-05-16')).toBe(payments[0]);
    expect(findMatchingClientPayment(payments, 300, 'fecha-invalida')).toBeUndefined();
    expect(findMatchingClientPayment(payments, 300, '2026-05-17')).toBeUndefined();
  });

  it('audits guest totals that drift from the split counts', () => {
    const issues = auditPresupuestoFinancialGuardrails(presupuesto({
      invitadosCantidad: 150,
      invitadosAdultos: 80,
      invitadosNinos: 10,
      invitadosAdolescentes: 10,
    }));

    expect(issues.some(issue => issue.field === 'invitadosCantidad' && issue.expected === 100)).toBe(true);
  });

  it('marks a budget inconsistent when stored totals do not match the central engine', () => {
    const result = auditPresupuestoTotals(presupuesto({ totalConDescuento: 1200, costoTotalEstimado: 1000 }));

    expect(result.esConsistente).toBe(false);
    expect(result.observaciones.some((item) => item.severidad === 'error')).toBe(true);
  });
});

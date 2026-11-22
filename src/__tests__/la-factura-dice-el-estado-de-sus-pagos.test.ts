/**
 * Auditoría 21/11/2026: La factura dice el estado de sus pagos
 */
import { describe, it, expect } from '@jest/globals';
import { getEffectiveInvoiceStatus, getInvoiceBalanceDue } from '@/lib/invoice-money';

describe('La factura dice el estado de sus pagos', () => {
  it('calcula saldo e estado efectivo correctamente cuando hay pagos parciales o vacíos con status Paid', () => {
    // Factura con status: 'Paid', totalAmount: 1000, payments: [{ amount: 400 }] -> saldo 600, estado efectivo !== 'Paid' (devuelve 'Sent').
    const inv1 = {
      status: 'Paid' as const,
      totalAmount: 1000,
      currency: 'UYU',
      payments: [{ id: 'p1', amount: 400, paymentDate: '2026-01-01' }]
    };
    expect(getInvoiceBalanceDue(inv1)).toBe(600);
    expect(getEffectiveInvoiceStatus(inv1)).not.toBe('Paid');
    expect(getEffectiveInvoiceStatus(inv1)).toBe('Sent');

    // Factura con status: 'Paid', totalAmount: 1000, payments: [] -> saldo 1000, estado efectivo !== 'Paid'.
    const inv2 = {
      status: 'Paid' as const,
      totalAmount: 1000,
      currency: 'UYU',
      payments: []
    };
    expect(getInvoiceBalanceDue(inv2)).toBe(1000);
    expect(getEffectiveInvoiceStatus(inv2)).not.toBe('Paid');

    // Factura con status: 'Sent', totalAmount: 1000, payments: [{ amount: 1000 }] -> saldo 0, estado efectivo 'Paid'.
    const inv3 = {
      status: 'Sent' as const,
      totalAmount: 1000,
      currency: 'UYU',
      payments: [{ id: 'p1', amount: 1000, paymentDate: '2026-01-01' }]
    };
    expect(getInvoiceBalanceDue(inv3)).toBe(0);
    expect(getEffectiveInvoiceStatus(inv3)).toBe('Paid');
  });
});

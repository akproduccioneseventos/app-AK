import { getPaymentSummary } from '@/lib/budget/payment-summary';

describe('getPaymentSummary', () => {
  it('calculates paid, balance and counts', () => {
    const summary = getPaymentSummary([
      { amount: 1000, status: 'pagado' },
      { amount: 500, status: 'parcial', paidAmount: 200 },
      { amount: 300, status: 'pendiente' },
    ]);

    expect(summary.total).toBe(1800);
    expect(summary.paid).toBe(1200);
    expect(summary.balance).toBe(600);
    expect(summary.paidCount).toBe(1);
    expect(summary.pendingCount).toBe(2);
  });

  it('never returns a negative balance', () => {
    const summary = getPaymentSummary([
      { amount: 100, status: 'parcial', paidAmount: 999 },
    ]);

    expect(summary.paid).toBe(100);
    expect(summary.balance).toBe(0);
  });

  it('counts overdue unpaid installments', () => {
    const summary = getPaymentSummary([
      { amount: 100, status: 'pendiente', dueDate: '2024-01-01' },
      { amount: 100, status: 'pagado', dueDate: '2024-01-01' },
    ], new Date('2026-01-01'));

    expect(summary.overdueCount).toBe(1);
  });
});

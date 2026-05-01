import {
  estimateGuestIncrease,
  getGuestStats,
  getPortalPaymentSummary,
} from '@/lib/client-portal/client-portal-summary';

describe('client portal summary helpers', () => {
  it('counts guest RSVP status with party sizes', () => {
    const stats = getGuestStats([
      { rsvp: 'Confirmado', partySize: 2 },
      { rsvp: 'Pendiente' },
      { rsvp: 'Tal vez', partySize: 3 },
      { rsvp: 'Rechazado' },
    ]);

    expect(stats.total).toBe(7);
    expect(stats.confirmed).toBe(2);
    expect(stats.pending).toBe(1);
    expect(stats.maybe).toBe(3);
    expect(stats.rejected).toBe(1);
    expect(stats.needsAction).toBe(4);
  });

  it('summarizes confirmed and pending payments without double counting notifications', () => {
    const summary = getPortalPaymentSummary({
      total: 100000,
      payments: [
        { monto: 20000, estadoPago: 'confirmado' },
        { monto: 5000, estadoPago: 'pendiente_confirmacion' },
      ],
      notifications: [
        { monto: 10000, estado: 'aprobado' },
        { monto: 7000, estado: 'pendiente' },
      ],
    });

    expect(summary.paid).toBe(20000);
    expect(summary.balance).toBe(80000);
    expect(summary.paidPercent).toBe(20);
    expect(summary.pendingReviewCount).toBe(2);
    expect(summary.pendingReviewAmount).toBe(12000);
  });

  it('estimates added guests with the annual 15 percent adjustment', () => {
    const estimate = estimateGuestIncrease({
      currentTotal: 100000,
      currentGuestCount: 100,
      adultDelta: 10,
      childDelta: 0,
      annualAdjustmentPercent: 15,
    });

    expect(estimate.subtotalBeforeAnnualAdjustment).toBe(10000);
    expect(estimate.annualAdjustmentAmount).toBe(1500);
    expect(estimate.additionalTotal).toBe(11500);
    expect(estimate.newTotal).toBe(111500);
  });
});

import { calculateSimulatorPaymentPlan } from './payment-plan';

describe('calculateSimulatorPaymentPlan', () => {
  const now = new Date('2026-01-01T12:00:00Z');

  it('usa el precio vigente cuando no corresponde ajuste anual', () => {
    const plan = calculateSimulatorPaymentPlan({
      currentTotal: 100_000,
      projectedTotal: 115_000,
      annualAdjustmentApplies: false,
      bookingDepositAmount: 5_000,
      eventDate: '2026-08-01',
      now,
    });

    expect(plan.totalForPlan).toBe(100_000);
    expect(plan.balance).toBe(95_000);
  });

  it('usa el total proyectado para 2027 y respeta la seña configurada', () => {
    const plan = calculateSimulatorPaymentPlan({
      currentTotal: 100_000,
      projectedTotal: 115_000,
      annualAdjustmentApplies: true,
      bookingDepositAmount: 7_000,
      eventDate: '2027-08-01',
      now,
    });

    expect(plan.totalForPlan).toBe(115_000);
    expect(plan.deposit).toBe(7_000);
    expect(plan.balance).toBe(108_000);
  });

  it('usa el ajuste acumulado informado para 2028', () => {
    const plan = calculateSimulatorPaymentPlan({
      currentTotal: 100_000,
      projectedTotal: 132_250,
      annualAdjustmentApplies: true,
      bookingDepositAmount: 5_000,
      eventDate: '2028-08-01',
      now,
    });

    expect(plan.totalForPlan).toBe(132_250);
    expect(plan.balance).toBe(127_250);
  });

  it('ofrece una sola cuota si el evento esta demasiado proximo', () => {
    const plan = calculateSimulatorPaymentPlan({
      currentTotal: 50_000,
      projectedTotal: 50_000,
      annualAdjustmentApplies: false,
      bookingDepositAmount: 5_000,
      eventDate: '2026-01-20',
      now,
    });

    expect(plan.installments).toBe(1);
    expect(plan.installmentAmount).toBe(45_000);
  });
});

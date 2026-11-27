import fs from 'node:fs';
import path from 'node:path';
import { generarPlanPagos } from '@/lib/planPagos';
import { calculateSimulatorPaymentPlan } from '@/lib/simulator/payment-plan';

describe('Orden 368 B6.1 y 370 B6.2 — Cuota final en día civil y cuotas sin redondeo de más', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('generarPlanPagos guarda las cuotas como "AAAA-MM-DD" y la cuota final 30 días antes del evento', () => {
    jest.useFakeTimers();
    // 26 de noviembre de 2026 a las 23:30 de Uruguay (ya es 27/11 en UTC)
    jest.setSystemTime(new Date('2026-11-27T02:30:00.000Z'));

    const plan = generarPlanPagos('2027-06-15', 100000);
    const cuotaFinal = plan.cuotas.find((c) => c.id === 'cuota_saldo_final');

    expect(cuotaFinal).toBeDefined();
    expect(cuotaFinal?.fechaVencimiento).toBe('2027-05-16');
    for (const cuota of plan.cuotas) {
      expect(cuota.fechaVencimiento).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('calculateSimulatorPaymentPlan ajusta la última cuota al saldo exacto sin cobrar de más', () => {
    const now = new Date('2026-01-01T12:00:00Z');
    const plan = calculateSimulatorPaymentPlan({
      currentTotal: 100000,
      projectedTotal: 100000,
      annualAdjustmentApplies: false,
      bookingDepositAmount: 5000,
      eventDate: '2026-07-30',
      now,
    });

    expect(plan.balance).toBe(95000);
    expect(plan.installments).toBe(6);
    expect(plan.installmentAmount).toBe(15833);
    expect(plan.lastInstallmentAmount).toBe(15835);
    expect(plan.installmentAmounts).toEqual([15833, 15833, 15833, 15833, 15833, 15835]);
    expect(plan.installmentAmounts.reduce((a, b) => a + b, 0)).toBe(95000);

    const fuente = fs.readFileSync(path.resolve(__dirname, '../lib/simulator/payment-plan.ts'), 'utf8');
    expect(fuente).not.toContain('Math.ceil(balance / installments)');
  });
});

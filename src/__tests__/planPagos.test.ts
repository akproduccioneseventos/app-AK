import {
  diferenciaMeses,
  calcularMesesLimite,
  generarPlanPagos,
  recalcularEstadoCuotas,
  getProximaCuota,
  getPorcentajePagado,
} from '@/lib/planPagos';
import type { PagoCliente } from '@/types/presupuesto';

// ─────────────────────────────────────────────────────────────────────────────
// diferenciaMeses
// ─────────────────────────────────────────────────────────────────────────────

describe('diferenciaMeses', () => {
  it('returns 0 for same date', () => {
    const d = new Date('2025-01-01');
    expect(diferenciaMeses(d, d)).toBe(0);
  });

  it('returns 12 for exactly one year', () => {
    const desde = new Date('2024-01-01');
    const hasta = new Date('2025-01-01');
    expect(diferenciaMeses(desde, hasta)).toBe(12);
  });

  it('returns 6 for 6 months', () => {
    const desde = new Date('2025-01-01');
    const hasta = new Date('2025-07-01');
    expect(diferenciaMeses(desde, hasta)).toBe(6);
  });

  it('returns 11 when day of hasta is before day of desde', () => {
    const desde = new Date('2025-01-15');
    const hasta = new Date('2026-01-10');
    expect(diferenciaMeses(desde, hasta)).toBe(11);
  });

  it('never returns negative', () => {
    const desde = new Date('2025-06-01');
    const hasta = new Date('2025-01-01');
    expect(diferenciaMeses(desde, hasta)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calcularMesesLimite
// ─────────────────────────────────────────────────────────────────────────────

describe('calcularMesesLimite', () => {
  it('returns 12 for events more than 24 months away', () => {
    expect(calcularMesesLimite(30)).toBe(12);
    expect(calcularMesesLimite(25)).toBe(12);
  });

  it('returns 6 for events between 12 and 24 months away', () => {
    expect(calcularMesesLimite(24)).toBe(6);
    expect(calcularMesesLimite(18)).toBe(6);
    expect(calcularMesesLimite(13)).toBe(6);
  });

  it('returns 6 for events between 6 and 12 months away', () => {
    expect(calcularMesesLimite(12)).toBe(6);
    expect(calcularMesesLimite(9)).toBe(6);
    expect(calcularMesesLimite(7)).toBe(6);
  });

  it('returns 1 for events less than 6 months away', () => {
    expect(calcularMesesLimite(6)).toBe(1);
    expect(calcularMesesLimite(3)).toBe(1);
    expect(calcularMesesLimite(1)).toBe(1);
    expect(calcularMesesLimite(0)).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generarPlanPagos
// ─────────────────────────────────────────────────────────────────────────────

describe('generarPlanPagos', () => {
  it('generates an active plan', () => {
    const fechaEvento = new Date();
    fechaEvento.setFullYear(fechaEvento.getFullYear() + 2);
    const plan = generarPlanPagos(fechaEvento.toISOString(), 100000);

    expect(plan.activo).toBe(true);
    expect(plan.pagoMinimoTrimestral).toBe(5000);
    expect(plan.porcentajeMinimoAntesFecha).toBe(30);
    expect(plan.montoObjetivo30Porciento).toBe(30000);
  });

  it('always has exactly one clave cuota', () => {
    const fechaEvento = new Date();
    fechaEvento.setMonth(fechaEvento.getMonth() + 18);
    const plan = generarPlanPagos(fechaEvento.toISOString(), 80000);

    const claveCuotas = plan.cuotas.filter(c => c.esCuotaClave);
    expect(claveCuotas).toHaveLength(1);
  });

  it('respects custom pagoMinimoTrimestral and porcentajeMinimo', () => {
    const fechaEvento = new Date();
    fechaEvento.setFullYear(fechaEvento.getFullYear() + 2);
    const plan = generarPlanPagos(fechaEvento.toISOString(), 50000, 3000, 25);

    expect(plan.pagoMinimoTrimestral).toBe(3000);
    expect(plan.porcentajeMinimoAntesFecha).toBe(25);
    expect(plan.montoObjetivo30Porciento).toBe(12500); // 50000 * 0.25
  });

  it('all cuotas start as pendiente', () => {
    const fechaEvento = new Date();
    fechaEvento.setFullYear(fechaEvento.getFullYear() + 1);
    const plan = generarPlanPagos(fechaEvento.toISOString(), 60000);

    plan.cuotas.forEach(c => {
      expect(c.estado).toBe('pendiente');
      expect(c.montoAcumulado).toBe(0);
    });
  });

  it('sets mesesLimiteAntesFecha = 6 for 18-month event', () => {
    const fechaEvento = new Date();
    fechaEvento.setMonth(fechaEvento.getMonth() + 18);
    const plan = generarPlanPagos(fechaEvento.toISOString(), 100000);

    expect(plan.mesesLimiteAntesFecha).toBe(6);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// recalcularEstadoCuotas
// ─────────────────────────────────────────────────────────────────────────────

describe('recalcularEstadoCuotas', () => {
  function makePago(monto: number, fecha = new Date().toISOString()): PagoCliente {
    return {
      id: `pago_${Math.random().toString(36).slice(2)}`,
      fecha,
      monto,
      metodoPago: 'Efectivo',
      estadoPago: 'confirmado',
    };
  }

  it('marks cuota as completada when payment covers it', () => {
    const fechaEvento = new Date();
    fechaEvento.setFullYear(fechaEvento.getFullYear() + 1);
    const plan = generarPlanPagos(fechaEvento.toISOString(), 50000);
    // Pay more than all cuotas combined
    const pagos = [makePago(60000)];
    const updated = recalcularEstadoCuotas(plan, pagos);

    const allCompleted = updated.cuotas.every(c => c.estado === 'completada');
    expect(allCompleted).toBe(true);
  });

  it('does not count pending_confirmacion payments', () => {
    const fechaEvento = new Date();
    fechaEvento.setFullYear(fechaEvento.getFullYear() + 1);
    const plan = generarPlanPagos(fechaEvento.toISOString(), 50000);
    const pagos: PagoCliente[] = [
      { id: 'p1', fecha: new Date().toISOString(), monto: 50000, metodoPago: 'Efectivo', estadoPago: 'pendiente_confirmacion' },
    ];
    const updated = recalcularEstadoCuotas(plan, pagos);

    const hasNonPendiente = updated.cuotas.some(c => c.estado !== 'pendiente' && c.estado !== 'vencida');
    expect(hasNonPendiente).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getProximaCuota
// ─────────────────────────────────────────────────────────────────────────────

describe('getProximaCuota', () => {
  it('returns null when all cuotas are completed', () => {
    const fechaEvento = new Date();
    fechaEvento.setFullYear(fechaEvento.getFullYear() + 1);
    const plan = generarPlanPagos(fechaEvento.toISOString(), 50000);
    const completedPlan = {
      ...plan,
      cuotas: plan.cuotas.map(c => ({ ...c, estado: 'completada' as const })),
    };
    expect(getProximaCuota(completedPlan)).toBeNull();
  });

  it('returns first non-completed cuota', () => {
    const fechaEvento = new Date();
    fechaEvento.setFullYear(fechaEvento.getFullYear() + 1);
    const plan = generarPlanPagos(fechaEvento.toISOString(), 50000);
    // At least one pendiente cuota should exist
    const proxima = getProximaCuota(plan);
    expect(proxima).not.toBeNull();
    expect(['pendiente', 'parcial', 'vencida']).toContain(proxima?.estado);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getPorcentajePagado
// ─────────────────────────────────────────────────────────────────────────────

describe('getPorcentajePagado', () => {
  const fakePlan = generarPlanPagos(
    new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
    100000,
  );

  it('returns 0 when nothing is paid', () => {
    expect(getPorcentajePagado(fakePlan, 100000, 0)).toBe(0);
  });

  it('returns 30 when 30% is paid', () => {
    expect(getPorcentajePagado(fakePlan, 100000, 30000)).toBe(30);
  });

  it('caps at 100', () => {
    expect(getPorcentajePagado(fakePlan, 100000, 150000)).toBe(100);
  });

  it('returns 0 when totalContrato is 0', () => {
    expect(getPorcentajePagado(fakePlan, 0, 10000)).toBe(0);
  });
});

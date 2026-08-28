/**
 * EL PLAN DE PAGOS, PROBADO POR EL RESULTADO
 *
 * Las cuotas son plata del cliente. No había ninguna prueba que nombrara estas
 * funciones: se podían romper las cuentas y nadie se enteraba hasta que un
 * cliente reclamara.
 *
 * Estas pruebas comprueban los NÚMEROS que quedan guardados, no que la pantalla
 * abra.
 */

import type { CuotaPlanPago } from '@/types/fiesta';

const fiestaGuardada: { ultima: any } = { ultima: null };
const fiestaEnLaBase: { actual: any } = { actual: null };
const avisosAlCliente: any[] = [];

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => fiestaEnLaBase.actual),
  saveFiesta: jest.fn(async (f: any) => {
    fiestaGuardada.ultima = f;
    return { success: true };
  }),
}));

jest.mock('@/app/actions/google-workspace-extended', () => ({
  notifyClientPaymentApproved: jest.fn(async (...args: any[]) => {
    avisosAlCliente.push(args);
  }),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({ email: 'admin@ak', role: 'admin' })),
}));

function cuota(parcial: Partial<CuotaPlanPago>): CuotaPlanPago {
  return {
    id: 'c1',
    descripcion: 'Cuota 1',
    monto: 10000,
    fechaVencimiento: '2026-09-01',
    estado: 'pendiente',
    ...parcial,
  } as CuotaPlanPago;
}

function conPlan(cuotas: CuotaPlanPago[]) {
  fiestaEnLaBase.actual = {
    id: 'f1',
    planDePagos: { id: 'p1', fiestaId: 'f1', cuotas, createdAt: 'x', updatedAt: 'x' },
  };
}

describe('Plan de pagos: las cuentas cierran', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fiestaGuardada.ultima = null;
    fiestaEnLaBase.actual = null;
    avisosAlCliente.length = 0;
  });

  it('una cuota pagada queda con el monto completo, no con lo que se escribió a mano', async () => {
    conPlan([cuota({ monto: 10000, estado: 'pendiente' })]);
    const { updateCuotaEstado } = await import('@/app/actions/payment-plans');

    await updateCuotaEstado('f1', 'c1', { estado: 'pagado', montoPagado: 3000 });

    const guardada = fiestaGuardada.ultima.planDePagos.cuotas[0];
    expect(guardada.estado).toBe('pagado');
    expect(guardada.montoPagado).toBe(10000);
  });

  it('no se puede registrar que pagaron MÁS de lo que debían', async () => {
    conPlan([cuota({ monto: 10000, estado: 'parcial' })]);
    const { updateCuotaEstado } = await import('@/app/actions/payment-plans');

    await updateCuotaEstado('f1', 'c1', { estado: 'parcial', montoPagado: 25000 });

    const guardada = fiestaGuardada.ultima.planDePagos.cuotas[0];
    expect(guardada.montoPagado).toBe(10000);
    expect(guardada.estado).toBe('pagado');
  });

  it('una cuota "parcial" sin plata entregada vuelve a pendiente', async () => {
    conPlan([cuota({ monto: 10000, estado: 'pendiente' })]);
    const { updateCuotaEstado } = await import('@/app/actions/payment-plans');

    await updateCuotaEstado('f1', 'c1', { estado: 'parcial', montoPagado: 0 });

    const guardada = fiestaGuardada.ultima.planDePagos.cuotas[0];
    expect(guardada.estado).toBe('pendiente');
    expect(guardada.montoPagado).toBeUndefined();
  });

  it('al guardar el plan, los montos quedan redondeados a peso entero', async () => {
    fiestaEnLaBase.actual = { id: 'f1' };
    const { savePlanDePagos } = await import('@/app/actions/payment-plans');

    const resultado = await savePlanDePagos('f1', {
      cuotas: [cuota({ monto: 10000.4 }), cuota({ id: 'c2', monto: 5000.6 })],
    } as any);

    expect(resultado.success).toBe(true);
    expect(resultado.plan!.cuotas.map((c) => c.monto)).toEqual([10000, 5001]);
  });

  it('el aviso al cliente sale sólo cuando hay plata de verdad', async () => {
    conPlan([cuota({ monto: 10000, estado: 'pendiente' })]);
    const { updateCuotaEstado } = await import('@/app/actions/payment-plans');

    await updateCuotaEstado('f1', 'c1', { estado: 'pagado' });
    expect(avisosAlCliente).toHaveLength(1);
    expect(avisosAlCliente[0][1].monto).toBe(10000);
  });
});

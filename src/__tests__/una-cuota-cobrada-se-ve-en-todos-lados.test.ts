import { normalizePresupuestoFinancials, getBudgetPaymentSummary } from '@/lib/budget/financial-guardrails';

const mockFiestas: Record<string, any> = {};
const mockPresupuestos: Record<string, any> = {};
let simularFalloPresupuesto = false;
const notifyMock = jest.fn().mockResolvedValue(undefined);

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ user: { id: 'u1', perfil: 'dueno' } }),
  requirePermiso: jest.fn().mockResolvedValue({ ok: true, user: { id: 'u1', perfil: 'dueno' } }),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async (id: string) =>
    mockFiestas[id] ? JSON.parse(JSON.stringify(mockFiestas[id])) : null
  ),
}));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (id: string, cb: (f: any) => any) => {
    const copia = JSON.parse(JSON.stringify(mockFiestas[id]));
    const siguiente = cb(copia);
    mockFiestas[id] = JSON.parse(JSON.stringify(siguiente));
    return { success: true, updatedFiesta: siguiente };
  }),
}));
jest.mock('@/lib/budget/mutar-presupuesto', () => ({
  mutarPresupuesto: jest.fn(async (id: string, cb: (p: any) => any) => {
    if (simularFalloPresupuesto || !mockPresupuestos[id]) {
      return { encontrado: false, presupuesto: null };
    }
    const copia = JSON.parse(JSON.stringify(mockPresupuestos[id]));
    const siguiente = cb(copia);
    if (siguiente) {
      mockPresupuestos[id] = JSON.parse(JSON.stringify(siguiente));
    }
    return { encontrado: true, presupuesto: siguiente ?? copia };
  }),
}));
jest.mock('@/app/actions/google-workspace-extended', () => ({
  notifyClientPaymentApproved: (...args: any[]) => notifyMock(...args),
}));

import { updateCuotaEstado } from '@/app/actions/payment-plans';

describe('Orden 364: una cuota cobrada se ve en pagosCliente y en normalizePresupuestoFinancials', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    simularFalloPresupuesto = false;
    mockPresupuestos['pres_364'] = {
      id: 'pres_364',
      totalConDescuento: 30000,
      costoTotalEstimado: 30000,
      itemsPresupuestados: [{ idServicioCatalogo: 's1', nombreServicio: 'DJ', cantidad: 1, precioUnitarioPresupuesto: 30000, totalItem: 30000 }],
      pagosCliente: [],
    };
    mockFiestas['f_364'] = {
      id: 'f_364',
      presupuestoId: 'pres_364',
      planDePagos: {
        id: 'plan_1',
        cuotas: [
          { id: 'c1', descripcion: 'Cuota 1', monto: 10000, estado: 'pendiente' },
          { id: 'c2', descripcion: 'Cuota 2', monto: 10000, estado: 'pendiente' },
          { id: 'c3', descripcion: 'Cuota 3', monto: 10000, estado: 'pendiente' },
        ],
      },
    };
  });

  it('3 cuotas de $10.000 pagadas dejan saldo $0; marcar dos veces no duplica cuota_<id>; volver a pendiente lo saca', async () => {
    await updateCuotaEstado('f_364', 'c1', { estado: 'pagado', montoPagado: 10000, fechaPago: '2026-11-26' });
    await updateCuotaEstado('f_364', 'c1', { estado: 'pagado', montoPagado: 10000, fechaPago: '2026-11-26' }); // reintento
    await updateCuotaEstado('f_364', 'c2', { estado: 'pagado', montoPagado: 10000, fechaPago: '2026-11-26' });
    await updateCuotaEstado('f_364', 'c3', { estado: 'pagado', montoPagado: 10000, fechaPago: '2026-11-26' });

    const norm = normalizePresupuestoFinancials(mockPresupuestos['pres_364']);
    const sum = getBudgetPaymentSummary(norm, { includeAnnualAdjustment: true });
    expect(mockPresupuestos['pres_364'].pagosCliente.filter((p: any) => p.id === 'cuota_c1')).toHaveLength(1);
    expect(sum.paid).toBe(30000);
    expect(sum.balance).toBe(0);

    // Volver la cuota 3 a pendiente quita cuota_c3 de pagosCliente
    await updateCuotaEstado('f_364', 'c3', { estado: 'pendiente' });
    const normDespues = normalizePresupuestoFinancials(mockPresupuestos['pres_364']);
    const sumDespues = getBudgetPaymentSummary(normDespues, { includeAnnualAdjustment: true });
    expect(mockPresupuestos['pres_364'].pagosCliente.some((p: any) => p.id === 'cuota_c3')).toBe(false);
    expect(sumDespues.paid).toBe(20000);
    expect(sumDespues.balance).toBe(10000);
  });

  it('si falla guardar el presupuesto, la cuota NO queda pagada y no sale mail al cliente', async () => {
    simularFalloPresupuesto = true;
    const res = await updateCuotaEstado('f_364', 'c1', { estado: 'pagado', montoPagado: 10000 });
    expect(res.success).toBe(false);
    expect(mockFiestas['f_364'].planDePagos.cuotas[0].estado).toBe('pendiente');
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it('si la cuota es la Seña y el recibo del contrato ya anotó la seña en pagosCliente, no la duplica', async () => {
    mockPresupuestos['pres_364'].pagosCliente = [
      { id: 'pago_sena_recibo', monto: 5000, fecha: '2026-11-01', referencia: 'SEÑA-001', estadoPago: 'confirmado', metodoPago: 'Transferencia Bancaria' },
    ];
    mockFiestas['f_364'].planDePagos.cuotas.unshift({
      id: 'c_sena',
      descripcion: 'Seña inicial de reserva',
      monto: 5000,
      estado: 'pendiente',
    });

    const res = await updateCuotaEstado('f_364', 'c_sena', { estado: 'pagado', montoPagado: 5000 });
    expect(res.success).toBe(true);
    expect(mockPresupuestos['pres_364'].pagosCliente).toHaveLength(1);
  });
});

/** @jest-environment node */

import { buildAnnualAdjustmentProjection } from '@/lib/budget/formal-budget';
import { getBudgetCollectibleTotal } from '@/lib/budget/financial-guardrails';
import { calcularEstadoDeCuenta } from '@/lib/budget/saldo-con-ajuste';
import type { Presupuesto } from '@/types/presupuesto';

let currentUser: { userId: string; perfil?: string; role?: string; soloCrm?: boolean } = {
  userId: 'u-dueno',
  perfil: 'dueno',
  role: 'admin',
};
let contratoFirmado = false;

const basePresupuesto: Presupuesto = {
  id: 'p-ajuste-1',
  clienteNombre: 'Ana',
  eventoTipo: 'Boda',
  eventoFecha: '2029-11-20',
  invitadosCantidad: 100,
  salonFiestas: 'Club Uruguay',
  itemsPresupuestados: [],
  costoTotalEstimado: 100000,
  totalConDescuento: 100000,
  timestamp: '2026-03-01T12:00:00.000Z',
  estado: 'Aceptado',
  ajusteAnualActivo: true,
  ajusteAnualPorcentaje: 15,
  tipoAjusteAnual: 'acumulativo',
};

let storedBudgets: Presupuesto[] = [];
const mockWriteData = jest.fn(async (_file: string, next: Presupuesto[]) => {
  storedBudgets = next;
});

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({ success: true, user: currentUser })),
  verifyBudgetToken: jest.fn(),
}));
jest.mock('@/lib/auth/perfiles', () => {
  const actual = jest.requireActual('@/lib/auth/perfiles');
  return {
    ...actual,
    puede: (user: { perfil?: string; role?: string; soloCrm?: boolean } | null | undefined, permiso: string) => {
      if (user?.soloCrm) {
        return permiso === actual.PERMISOS.CRM || permiso === actual.PERMISOS.ORGANIZACION;
      }
      return actual.puede(user, permiso);
    },
  };
});
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getAllFiestas: jest.fn(async () => [
    { id: 'f-1', presupuestoId: 'p-ajuste-1', contratoFirmaInfo: { isSigned: contratoFirmado } },
  ]),
  saveFiesta: jest.fn(),
  syncFiestaFromBudget: jest.fn(),
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => JSON.parse(JSON.stringify(storedBudgets))),
  readDataConDetalle: jest.fn(async () => ({ valor: JSON.parse(JSON.stringify(storedBudgets)), huboFalla: false })),
  writeData: (...args: [string, Presupuesto[]]) => mockWriteData(...args),
  mutateDataItem: jest.fn(),
}));
jest.mock('@/app/actions/crm', () => ({
  findLeadByBudgetOrCreate: jest.fn(async () => ({ lead: { id: 'l-1' } })),
  getCrmStages: jest.fn(async () => []),
  moveCrmLead: jest.fn(),
}));

describe('El ajuste simple y el acumulativo', () => {
  beforeEach(() => {
    currentUser = { userId: 'u-dueno', perfil: 'dueno', role: 'admin' };
    contratoFirmado = false;
    storedBudgets = [JSON.parse(JSON.stringify(basePresupuesto))];
    mockWriteData.mockClear();
  });

  it('$100.000 con evento a 3 años: acumulativo da 152088 y simple da 145000', () => {
    const acumulativo = buildAnnualAdjustmentProjection({
      baseTotal: 100000,
      eventDate: '2029-11-20',
      currentYear: 2026,
      adjustmentPct: 15,
      tipoAjusteAnual: 'acumulativo',
    });
    const simple = buildAnnualAdjustmentProjection({
      baseTotal: 100000,
      eventDate: '2029-11-20',
      currentYear: 2026,
      adjustmentPct: 15,
      tipoAjusteAnual: 'simple',
    });

    expect(acumulativo.adjustedTotal).toBe(152088);
    expect(simple.adjustedTotal).toBe(145000);

    expect(getBudgetCollectibleTotal({ ...basePresupuesto, tipoAjusteAnual: 'acumulativo' })).toBe(152088);
    expect(getBudgetCollectibleTotal({ ...basePresupuesto, tipoAjusteAnual: 'simple' })).toBe(145000);
    expect(calcularEstadoDeCuenta({ ...basePresupuesto, tipoAjusteAnual: 'acumulativo' }).total).toBe(152088);
    expect(calcularEstadoDeCuenta({ ...basePresupuesto, tipoAjusteAnual: 'simple' }).total).toBe(145000);
  });

  it('sin tipoAjusteAnual usa acumulativo por defecto', () => {
    const sinTipo = buildAnnualAdjustmentProjection({
      baseTotal: 100000,
      eventDate: '2029-11-20',
      currentYear: 2026,
      adjustmentPct: 15,
    });
    const presupuestoSinTipo: Presupuesto = { ...basePresupuesto };
    delete presupuestoSinTipo.tipoAjusteAnual;

    expect(sinTipo.tipoAjusteAnual).toBe('acumulativo');
    expect(sinTipo.adjustedTotal).toBe(152088);
    expect(getBudgetCollectibleTotal(presupuestoSinTipo)).toBe(152088);
    expect(calcularEstadoDeCuenta(presupuestoSinTipo).total).toBe(152088);
  });

  it('con contrato firmado, updatePresupuesto rechaza cambiar tipoAjusteAnual', async () => {
    contratoFirmado = true;
    const { updatePresupuesto } = await import('@/app/actions/presupuestos');

    const res = await updatePresupuesto({
      ...basePresupuesto,
      tipoAjusteAnual: 'simple',
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/contrato firmado/i);
    expect(mockWriteData).not.toHaveBeenCalled();
  });

  it('personal sin permiso contabilidad (solo crm) no puede cambiar tipoAjusteAnual en updatePresupuesto', async () => {
    currentUser = { userId: 'u-crm', soloCrm: true };
    const { updatePresupuesto } = await import('@/app/actions/presupuestos');

    const res = await updatePresupuesto({
      ...basePresupuesto,
      tipoAjusteAnual: 'simple',
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Solo contabilidad puede cambiar el tipo de ajuste anual/i);
    expect(mockWriteData).not.toHaveBeenCalled();
  });
});

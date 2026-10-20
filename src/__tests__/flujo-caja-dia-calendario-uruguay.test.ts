/** @jest-environment node */
const mockFiestas = jest.fn(), mockPresupuestos = jest.fn(), mockInvoices = jest.fn();
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(), requirePermisoAlguno: jest.fn() }));
jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn() }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ getAllFiestas: (...args: unknown[]) => mockFiestas(...args) }));
jest.mock('@/app/actions/presupuestos', () => ({ getPresupuestos: (...args: unknown[]) => mockPresupuestos(...args) }));
jest.mock('@/app/actions/invoices', () => ({ getInvoices: (...args: unknown[]) => mockInvoices(...args) }));
// Las cuentas del servidor leen los roles por acá (orden 197): mismo dato que el mock de getRoles.
jest.mock('@/lib/roles/leer-roles-interno', () => ({
  leerRolesInterno: () => require('@/app/actions/roles').getRoles(),
}));

jest.mock('@/app/actions/roles', () => ({ getRoles: jest.fn(async () => []) }));
jest.mock('@/app/actions/crm', () => ({ getCrmLeadsForDashboard: jest.fn(async () => []) }));
jest.mock('@/app/actions/notifications', () => ({ checkAndCreateTaskReminders: jest.fn(), checkAndCreateReunionReminders: jest.fn(), getNotifications: jest.fn(async () => []) }));
jest.mock('@/app/actions/alertas.actions', () => ({ getPrioridadesDescartadas: jest.fn(async () => []) }));
import { getCashFlowProjection } from '@/app/actions/dashboard';

function sources(date: string) {
  mockFiestas.mockResolvedValue([{ id: 'qa-fiesta', configuracion: { fechaEvento: date },
    gestionCostos: { costosItems: [{ id: 'c1', concepto: 'Flores', montoEstimado: 10000 }] }, pagosProveedores: [] }]);
  mockPresupuestos.mockResolvedValue([{ id: 'qa-budget', estado: 'Aceptado', eventoFecha: date,
    totalConDescuento: 1000, pagos: [], ajusteAnualActivo: false }]);
  mockInvoices.mockResolvedValue([{ id: 'qa-invoice', invoiceNumber: 'F-QA', status: 'Sent',
    dueDate: date, totalAmount: 500, payments: [] }]);
}

describe('Flujo de caja por dia de Uruguay, no medianoche del servidor', () => {
  beforeEach(() => { jest.clearAllMocks(); jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it('incluye cobros y gastos de hoy escritos como fecha sin hora', async () => {
    jest.setSystemTime(new Date('2026-10-01T04:30:00Z'));
    sources('2026-10-01');
    const result = await getCashFlowProjection();
    expect(result.success).toBe(true);
    expect(result.data?.[0]).toEqual({ month: 'oct 2026', income: 1500, expenses: 10000, balance: -8500 });
  });

  it('a las23:30 de Uruguay sigue proyectando septiembre, no octubre', async () => {
    jest.setSystemTime(new Date('2026-10-01T02:30:00Z'));
    sources('2026-09-30');
    const result = await getCashFlowProjection();
    expect(result.data?.[0]).toEqual({ month: 'sep 2026', income: 1500, expenses: 10000, balance: -8500 });
  });

  it('conserva el convenio legacy: ISO a medianocheUTC representa el dia escrito', async () => {
    jest.setSystemTime(new Date('2026-10-01T02:30:00Z'));
    sources('2026-10-01T00:00:00.000Z');
    const result = await getCashFlowProjection();
    expect(result.data?.[0]).toEqual({ month: 'sep 2026', income: 0, expenses: 0, balance: 0 });
    expect(result.data?.[1]).toEqual({ month: 'oct 2026', income: 1500, expenses: 10000, balance: -8500 });
  });

  it('un instante con zona de las23:15 pertenece al dia de Uruguay', async () => {
    jest.setSystemTime(new Date('2026-10-01T02:30:00Z'));
    sources('2026-10-01T02:15:00Z');
    const result = await getCashFlowProjection();
    expect(result.data?.[0]).toEqual({ month: 'sep 2026', income: 1500, expenses: 10000, balance: -8500 });
  });

  it('no inventa una fecha de hoy para evento o presupuesto invalido', async () => {
    jest.setSystemTime(new Date('2026-10-01T04:30:00Z'));
    sources('no-es-fecha'); mockInvoices.mockResolvedValue([]);
    const result = await getCashFlowProjection();
    expect(result.data?.every(month => month.income === 0 && month.expenses === 0)).toBe(true);
  });

  it('excluye fiestas/presupuestos pasados pero conserva facturas vencidas a cobrar', async () => {
    jest.setSystemTime(new Date('2026-10-01T02:30:00Z'));
    sources('2026-09-29');
    const result = await getCashFlowProjection();
    expect(result.data?.[0]).toEqual({ month: 'sep 2026', income: 500, expenses: 0, balance: 500 });
  });
});

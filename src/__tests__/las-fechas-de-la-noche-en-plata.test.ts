/** @jest-environment node */

import { getYearFromDate } from '@/lib/budget/formal-budget';
import { armarResumenParaElContador } from '@/lib/contabilidad/resumen-para-el-contador';

describe('Las fechas de la noche en plata (Orden 376 B9)', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.resetModules();
  });

  it('el panel de cobros no marca vencida una factura del 26/11 a las 22:00 en Uruguay (01:00Z del 27/11)', async () => {
    jest.resetModules();
    jest.useFakeTimers().setSystemTime(new Date('2026-11-27T01:00:00.000Z'));

    jest.doMock('@/lib/auth/require-session', () => ({
      requireAppSession: jest.fn(async () => ({ userId: 'u-1', perfil: 'dueno' })),
    }));
    jest.doMock('@/lib/auth/session-token', () => ({
      verifySession: jest.fn(async () => ({
        success: true,
        user: { userId: 'u-1', perfil: 'dueno' },
      })),
    }));
    jest.doMock('@/lib/auth/perfiles', () => ({
      PERMISOS: { CONTABILIDAD: 'contabilidad', GANANCIAS: 'ganancias', CRM: 'crm', ORGANIZACION: 'organizacion', NOCHE: 'noche', INSUMOS: 'insumos', SUELDOS: 'sueldos', ADMINISTRACION: 'administracion' },
      puede: jest.fn(() => true),
    }));
    jest.doMock('@/app/actions/presupuestos', () => ({
      getPresupuestos: jest.fn(async () => []),
    }));
    jest.doMock('@/app/actions/invoices', () => ({
      getInvoices: jest.fn(async () => [
        {
          id: 'inv-hoy',
          invoiceNumber: 'F-HOY',
          status: 'Unpaid',
          dueDate: '2026-11-26',
          totalAmount: 15000,
          subtotal: 15000,
          currency: 'UYU',
          payments: [],
          customer: { id: 'c1', name: 'Carlos' },
          items: [],
          issueDate: '2026-11-01',
          vendorName: 'AK',
        },
        {
          id: 'inv-ayer',
          invoiceNumber: 'F-AYER',
          status: 'Unpaid',
          dueDate: '2026-11-25',
          totalAmount: 10000,
          subtotal: 10000,
          currency: 'UYU',
          payments: [],
          customer: { id: 'c2', name: 'María' },
          items: [],
          issueDate: '2026-11-01',
          vendorName: 'AK',
        },
      ]),
    }));
    jest.doMock('@/app/actions/fiesta/fiesta.actions', () => ({
      getAllFiestas: jest.fn(async () => []),
    }));
    jest.doMock('@/app/actions/crm', () => ({
      getCrmLeadsForDashboard: jest.fn(async () => []),
    }));
    jest.doMock('@/app/actions/notifications', () => ({
      checkAndCreateTaskReminders: jest.fn(async () => undefined),
      checkAndCreateReunionReminders: jest.fn(async () => undefined),
      getNotifications: jest.fn(async () => []),
    }));
    jest.doMock('@/app/actions/roles', () => ({
      getRoles: jest.fn(async () => []),
    }));
    jest.doMock('@/app/actions/alertas.actions', () => ({
      getPrioridadesDescartadas: jest.fn(async () => new Set<string>()),
    }));

    const { getDashboardKpiData } = await import('@/app/actions/dashboard');
    const res = await getDashboardKpiData();
    expect(res.success).toBe(true);
    const alertasPago = (res.data?.alerts || []).filter((a: any) => a.type === 'payment');
    expect(alertasPago.some((a: any) => a.id === 'inv-hoy')).toBe(false);
    expect(alertasPago.some((a: any) => a.id === 'inv-ayer')).toBe(true);
  });

  it('el CSV al contador dice 2026-11-30 para un gasto del 30/11 a las 22:00 UY', () => {
    const { csv } = armarResumenParaElContador(
      {
        ingresos: { total: 0, detalle: [] },
        costos: {
          total: 2500,
          detalle: [
            {
              fecha: '2026-12-01T01:00:00Z',
              concepto: 'Hielo nocturno',
              categoria: 'Insumos',
              monto: 2500,
            },
          ],
        },
        gananciaNeta: -2500,
      } as any,
      'noviembre de 2026',
    );
    expect(csv).toContain('"2026-11-30"');
    expect(csv).not.toContain('"2026-12-01"');
  });

  it('getYearFromDate interpreta hora UTC en Uruguay (2027-01-01T01:30:00Z -> 2026) y preserva fecha pura sin hora', () => {
    expect(getYearFromDate('2027-01-01T01:30:00Z')).toBe(2026);
    expect(getYearFromDate('2027-01-01')).toBe(2027);
  });
});

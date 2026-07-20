jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({ success: true, user: { role: 'admin' } }),
}));

jest.mock('@/app/actions/invoices', () => ({ getInvoices: jest.fn() }));
jest.mock('@/app/actions/presupuestos', () => ({ getPresupuestos: jest.fn() }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ getAllFiestas: jest.fn() }));
jest.mock('@/app/actions/roles', () => ({ getRoles: jest.fn() }));
jest.mock('@/app/actions/gastos', () => ({ getGastosGenerales: jest.fn() }));

import { getProfitAndLossData } from '@/app/actions/reportes';
import { getInvoices } from '@/app/actions/invoices';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { getAllFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { getRoles } from '@/app/actions/roles';
import { getGastosGenerales } from '@/app/actions/gastos';

const fullRange = {
  from: new Date('2000-01-01T00:00:00.000Z'),
  to: new Date('2100-12-31T23:59:59.999Z'),
};

describe('profit and loss reports', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (getInvoices as jest.Mock).mockResolvedValue([
      {
        id: 'receipt-a',
        invoiceNumber: 'SEÑA-A',
        issueDate: '2026-05-16',
        status: 'Paid',
        totalAmount: 5000,
        documentKind: 'deposit_receipt',
        sourceFiestaId: 'fiesta-a',
        payments: [{ id: 'receipt-payment', date: '2026-05-16', amount: 5000, method: 'Efectivo' }],
      },
      {
        id: 'invoice-b',
        invoiceNumber: 'FAC-B',
        issueDate: '2026-05-16',
        status: 'Paid',
        totalAmount: 9000,
        customer: { name: 'Otro cliente' },
        payments: [{ id: 'payment-b', date: '2026-05-16', amount: 9000, method: 'Efectivo' }],
      },
    ]);
    (getPresupuestos as jest.Mock).mockResolvedValue([
      {
        id: 'budget-a',
        numero: 'A-1',
        estado: 'Aceptado',
        clienteNombre: 'Cliente A',
        pagosCliente: [{ id: 'payment-a', fecha: '2026-05-16', monto: 5000, metodoPago: 'Efectivo', estadoPago: 'confirmado' }],
      },
      {
        id: 'budget-b',
        numero: 'B-1',
        estado: 'Facturado',
        invoiceId: 'invoice-b',
        clienteNombre: 'Cliente B',
      },
    ]);
    (getAllFiestas as jest.Mock).mockResolvedValue([
      {
        id: 'fiesta-a',
        presupuestoId: 'budget-a',
        invoiceIds: ['receipt-a'],
        configuracion: { nombreEvento: 'XV de Ana', fechaEvento: '2026-08-08' },
        pagosProveedores: [{ id: 'provider-payment', monto: 400, fecha: '2026-07-01', costoAsociadoId: 'provider-cost' }],
        gestionCostos: {
          costosItems: [
            { id: 'provider-cost', nombre: 'Proveedor', montoEstimado: 1000 },
            { id: 'auto_merma_bebidas', nombre: 'Merma', montoEstimado: 50 },
          ],
          others: {
            totalCateringCost: 2000,
            totalBebidasCost: 1050,
            totalReposteriaCost: 500,
            totalPersonalCost: 600,
          },
        },
        personalAsignado: [{ empleadoId: 'employee-a', rolId: 'role-a', eventSalary: 500 }],
      },
      {
        id: 'fiesta-b',
        presupuestoId: 'budget-b',
        invoiceIds: ['invoice-b'],
        configuracion: { nombreEvento: 'Boda B', fechaEvento: '2026-09-09' },
      },
    ]);
    (getRoles as jest.Mock).mockResolvedValue([
      { id: 'role-a', nombre: 'Mozo', sueldoPorEvento: 500, porcentajeAportesPatronales: 20 },
    ]);
    (getGastosGenerales as jest.Mock).mockResolvedValue([
      { id: 'general-expense', fecha: '2026-06-01', concepto: 'Publicidad', categoria: 'Marketing y Publicidad', monto: 700 },
    ]);
  });

  it('isolates one event and does not duplicate its deposit, payroll or beverage waste', async () => {
    const result = await getProfitAndLossData(fullRange, { fiestaId: 'fiesta-a' });

    expect(result.success).toBe(true);
    expect(result.data?.nombreEvento).toBe('XV de Ana');
    expect(result.data?.ingresos.total).toBe(5000);
    expect(result.data?.ingresos.detalle.map(item => item.id)).toEqual(['payment-a']);
    expect(result.data?.costos.total).toBe(5150);
    expect(result.data?.costos.detalle.some(item => item.id === 'general-expense')).toBe(false);
  });

  it('returns an explicit error instead of a global report for an unknown event', async () => {
    const result = await getProfitAndLossData(fullRange, { fiestaId: 'missing' });

    expect(result).toEqual({ success: false, error: 'No se encontró el evento solicitado.' });
  });

  it('does not use one provider overrun to erase another planned cost', async () => {
    (getInvoices as jest.Mock).mockResolvedValue([]);
    (getPresupuestos as jest.Mock).mockResolvedValue([]);
    (getGastosGenerales as jest.Mock).mockResolvedValue([]);
    (getAllFiestas as jest.Mock).mockResolvedValue([{
      id: 'fiesta-costos',
      configuracion: { nombreEvento: 'Evento costos', fechaEvento: '2026-08-08' },
      pagosProveedores: [{
        id: 'pago-sobre-costo',
        monto: 1400,
        fecha: '2026-07-01',
        costoAsociadoId: 'proveedor-a',
      }],
      gestionCostos: {
        costosItems: [
          { id: 'proveedor-a', nombre: 'Proveedor A', montoEstimado: 1000 },
          { id: 'proveedor-b', nombre: 'Proveedor B', montoEstimado: 500 },
        ],
        others: {},
      },
    }]);

    const result = await getProfitAndLossData(fullRange, { fiestaId: 'fiesta-costos' });

    expect(result.success).toBe(true);
    expect(result.data?.costos.total).toBe(1900);
    expect(result.data?.costos.detalle).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'pago-pago-sobre-costo', monto: 1400 }),
      expect.objectContaining({ id: 'pendiente-costos-fiesta-costos', monto: 500 }),
    ]));
  });
});

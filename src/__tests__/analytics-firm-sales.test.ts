const mockGetPresupuestos = jest.fn();
const mockGetInvoices = jest.fn();
const mockGetAllFiestas = jest.fn();

jest.mock('@/app/actions/presupuestos', () => ({ getPresupuestos: () => mockGetPresupuestos() }));
jest.mock('@/app/actions/invoices', () => ({ getInvoices: () => mockGetInvoices() }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ getAllFiestas: () => mockGetAllFiestas() }));
jest.mock('@/app/actions/roles', () => ({ getRoles: jest.fn(async () => [{ id: 'rol-1', porcentajeAportesPatronales: 0 }]) }));
jest.mock('@/app/actions/empleados', () => ({ getEmpleados: jest.fn(async () => [{ id: 'emp-1', nombre: 'Operador' }]) }));

import { getAnalyticsData } from '@/app/actions/analytics';

describe('firm sales analytics', () => {
  it('excludes sent budgets and draft invoices from every revenue aggregate', async () => {
    const now = new Date();
    const eventDate = now.toISOString().slice(0, 10);
    const timestamp = now.toISOString();
    const item = (name: string, amount: number) => ({
      nombreServicio: name,
      costoTotalItem: amount,
      categoriaServicio: 'Entretenimiento',
    });

    mockGetPresupuestos.mockResolvedValue([
      {
        id: 'accepted', estado: 'Aceptado', eventoFecha: eventDate, timestamp,
        eventoTipo: 'XV', totalConDescuento: 100000,
        itemsPresupuestados: [item('Servicio contratado', 100000)],
      },
      {
        id: 'sent', estado: 'Enviado', eventoFecha: eventDate, timestamp,
        eventoTipo: 'Boda', totalConDescuento: 900000,
        itemsPresupuestados: [item('Servicio aun no vendido', 900000)],
      },
    ]);
    mockGetInvoices.mockResolvedValue([
      {
        id: 'draft-invoice', invoiceNumber: 'BORRADOR-1', documentKind: 'invoice',
        status: 'Draft', issueDate: eventDate, totalAmount: 700000,
      },
    ]);
    mockGetAllFiestas.mockResolvedValue([
      {
        id: 'event-accepted', presupuestoId: 'accepted', configuracion: { fechaEvento: eventDate },
        personalAsignado: [{ empleadoId: 'emp-1', rolId: 'rol-1', eventSalary: 1000 }],
      },
      {
        id: 'event-sent', presupuestoId: 'sent', configuracion: { fechaEvento: eventDate },
        personalAsignado: [{ empleadoId: 'emp-1', rolId: 'rol-1', eventSalary: 1000 }],
      },
    ]);

    const result = await getAnalyticsData();
    const currentMonth = result.data?.monthlyProfitability.at(-1);

    expect(result.success).toBe(true);
    expect(currentMonth?.ingresos).toBe(100000);
    expect(result.data?.topServices.map((service) => service.nombre)).toEqual(['Servicio contratado']);
    expect(result.data?.eventTypeProfitability.map((entry) => entry.tipo)).toEqual(['XV']);
    expect(result.data?.staffEfficiency[0]?.ingresosGenerados).toBe(100000);
  });
});

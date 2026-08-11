import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Invoice } from '@/types/invoice';
import type { Presupuesto } from '@/types/presupuesto';
import { buildFinancialIntegrityReport } from '@/lib/commercial-flow/financial-integrity';

function budget(overrides: Partial<Presupuesto> = {}): Presupuesto {
  return {
    id: 'budget-1',
    clienteNombre: 'Cliente',
    eventoTipo: 'Boda',
    eventoFecha: '2027-03-20',
    invitadosCantidad: 100,
    invitadosAdultos: 80,
    invitadosNinos: 10,
    invitadosAdolescentes: 10,
    salonFiestas: 'Club Uruguay',
    itemsPresupuestados: [{
      idServicioCatalogo: 'service-1',
      nombreServicio: 'Servicio completo',
      cantidad: 1,
      precioUnitario: 1000,
      precioUnitarioPresupuesto: 1000,
      costoTotalItem: 1000,
      calculationMethod: 'fijo',
    }],
    costoTotalEstimado: 1000,
    totalConDescuento: 1000,
    saldo: 1000,
    timestamp: '2026-08-11T12:00:00.000Z',
    estado: 'Enviado',
    invoiceId: 'invoice-1',
    ...overrides,
  };
}

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 'invoice-1',
    invoiceNumber: 'A-100',
    customer: { id: 'customer-1', name: 'Cliente' } as Invoice['customer'],
    issueDate: '2026-08-11',
    dueDate: '2026-09-11',
    items: [{ id: 'item-1', description: 'Servicio completo', quantity: 1, unitPrice: 1000, total: 1000 }],
    subtotal: 1000,
    taxRate: 0,
    taxAmount: 0,
    totalAmount: 1000,
    status: 'Sent',
    currency: 'UYU',
    vendorName: 'AK Producciones',
    payments: [],
    sourcePresupuestoId: 'budget-1',
    sourceFiestaId: 'event-1',
    ...overrides,
  };
}

function event(overrides: Partial<FiestaEnPlanificacion> = {}): FiestaEnPlanificacion {
  return {
    id: 'event-1',
    configuracion: { nombreEvento: 'Boda de prueba', fechaEvento: '2027-03-20' } as FiestaEnPlanificacion['configuracion'],
    personalAsignado: [],
    presupuestoId: 'budget-1',
    invoiceIds: ['invoice-1'],
    ...overrides,
  } as FiestaEnPlanificacion;
}

describe('financial integrity report', () => {
  it('accepts consistent budgets, invoices and events', () => {
    const report = buildFinancialIntegrityReport([budget()], [invoice()], [event()]);
    expect(report.counts).toEqual({ presupuestos: 1, facturas: 1, fiestas: 1, errors: 0, warnings: 0 });
    expect(report.issues).toEqual([]);
  });

  it('reports incorrect totals and broken cross-module links', () => {
    const report = buildFinancialIntegrityReport(
      [budget({ costoTotalEstimado: 900, totalConDescuento: 900, saldo: 900, invoiceId: 'missing-invoice' })],
      [invoice({ subtotal: 800, totalAmount: 800, sourceFiestaId: 'missing-event' })],
      [event({ presupuestoId: 'missing-budget', invoiceIds: ['missing-invoice'] })],
    );

    expect(report.counts.errors).toBeGreaterThanOrEqual(6);
    expect(report.issues.some((item) => item.message.includes('subtotal guardado'))).toBe(true);
    expect(report.issues.some((item) => item.message.includes('factura que no existe'))).toBe(true);
    expect(report.issues.some((item) => item.message.includes('presupuesto que no existe'))).toBe(true);
  });

  it('detects a provider payment reused in two budgets', () => {
    const first = budget({ invoiceId: undefined, pagosCliente: [{
      id: 'payment-1', fecha: '2026-08-11', monto: 100, metodoPago: 'MercadoPago',
      estadoPago: 'confirmado', proveedorPagoId: 'mp-123',
    }] });
    const second = budget({ id: 'budget-2', invoiceId: undefined, pagosCliente: [{
      id: 'payment-2', fecha: '2026-08-11', monto: 100, metodoPago: 'MercadoPago',
      estadoPago: 'pendiente_confirmacion', proveedorPagoId: 'mp-123',
    }] });

    const report = buildFinancialIntegrityReport([first, second], [], []);
    expect(report.issues.some((item) => item.scope === 'pago' && item.actual === 'mp-123')).toBe(true);
  });
});

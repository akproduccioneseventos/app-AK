/**
 * Tests para el módulo commercial-flow de AK Producciones.
 *
 * Valida:
 * 1. buildContractData — normalización de datos del contrato
 * 2. auditPresupuestoTotals — auditoría de totales de presupuesto
 * 3. calculateFinancialLedger — libro mayor financiero unificado
 */

import { buildContractData, buildContractDataFromPresupuesto } from '@/lib/commercial-flow/contract-builder';
import { auditPresupuestoTotals } from '@/lib/commercial-flow/budget-audit';
import { calculateFinancialLedger } from '@/lib/commercial-flow/ledger-service';
import type { Presupuesto } from '@/types/presupuesto';
import type { Invoice } from '@/types/invoice';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makePresupuesto(overrides: Partial<Presupuesto> = {}): Presupuesto {
  return {
    id: 'pres_1',
    clienteNombre: 'Virginia Reina',
    clienteContacto: '092908638',
    eventoTipo: 'XV años',
    eventoFecha: '2026-09-05T00:00:00.000Z',
    invitadosCantidad: 100,
    salonFiestas: 'Club Uruguay',
    itemsPresupuestados: [
      {
        idServicioCatalogo: 's1',
        nombreServicio: 'DJ',
        cantidad: 1,
        precioUnitario: 50000,
        precioUnitarioPresupuesto: 50000,
        costoTotalItem: 50000,
        calculationMethod: 'fijo',
      },
      {
        idServicioCatalogo: 's2',
        nombreServicio: 'Torta',
        cantidad: 100,
        precioUnitario: 200,
        precioUnitarioPresupuesto: 200,
        costoTotalItem: 20000,
        calculationMethod: 'porPersona',
      },
    ],
    costoTotalEstimado: 70000,
    totalConDescuento: 70000,
    timestamp: '2025-01-01T00:00:00.000Z',
    estado: 'Aceptado',
    ...overrides,
  };
}

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 'inv_1',
    invoiceNumber: 'F-001',
    customer: { id: 'c1', name: 'Virginia Reina' },
    issueDate: '2025-01-01',
    dueDate: '2025-12-31',
    items: [{ id: 'i1', description: 'Evento XV', quantity: 1, unitPrice: 70000, total: 70000 }],
    subtotal: 70000,
    taxRate: 0,
    taxAmount: 0,
    totalAmount: 70000,
    status: 'Sent',
    currency: 'UYU',
    vendorName: 'AK Producciones',
    payments: [],
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// buildContractData
// ─────────────────────────────────────────────────────────────────────────────

describe('buildContractData', () => {
  it('normaliza los datos del cliente y el evento', () => {
    const data = buildContractData({
      customer: { nombre: 'Virginia Reina', ci: '4.728.038-6', domicilio: 'Atahualpa 1301', telefono: '092908638' },
      event: { fecha: '2026-09-05', salon: 'Club Uruguay', tipoEvento: 'XV años' },
      economic: { total: 70000, senia: 20000 },
    });

    expect(data.customer.nombre).toBe('Virginia Reina');
    expect(data.customer.ci).toBe('4.728.038-6');
    expect(data.event.salon).toBe('Club Uruguay');
    expect(data.economic.total).toBe(70000);
    expect(data.economic.senia).toBe(20000);
    expect(data.totalReal).toBe(70000);
  });

  it('calcula el saldo como totalConDescuento - senia', () => {
    const data = buildContractData({
      customer: { nombre: 'Cliente Test' },
      event: { fecha: '2026-01-01', salon: 'Salón Test' },
      economic: { total: 100000, totalConDescuento: 90000, senia: 20000 },
    });

    expect(data.economic.saldo).toBe(70000); // 90000 - 20000
  });

  it('calcula el precio de lista con markup de marketing', () => {
    const data = buildContractData({
      customer: { nombre: 'Cliente Promo' },
      event: { fecha: '2026-01-01', salon: 'Salón' },
      economic: { total: 100000, totalConDescuento: 100000, marketingMarkupPercent: 20 },
    });

    expect(data.precioLista).toBe(120000); // 100000 * 1.20
  });

  it('calcula el descuento visual en modo descuento promocional', () => {
    const data = buildContractData({
      customer: { nombre: 'Cliente Promo' },
      event: { fecha: '2026-01-01', salon: 'Salón' },
      economic: {
        total: 100000,
        totalConDescuento: 100000,
        marketingMarkupPercent: 25,
        modoDescuentoPromocional: true,
      },
    });

    expect(data.precioLista).toBe(125000);
    expect(data.descuentoVisual).toBe(25000); // 125000 - 100000
    expect(data.totalReal).toBe(100000); // no cambia el total real
  });

  it('buildContractDataFromPresupuesto usa datos del presupuesto', () => {
    const presupuesto = makePresupuesto();
    const data = buildContractDataFromPresupuesto(presupuesto, { ci: '4.728.038-6' }, undefined, 15000);

    expect(data.customer.nombre).toBe('Virginia Reina');
    expect(data.customer.ci).toBe('4.728.038-6');
    expect(data.event.salon).toBe('Club Uruguay');
    expect(data.economic.senia).toBe(15000);
    expect(data.totalReal).toBe(70000);
  });

  it('buildContractDataFromPresupuesto respeta los overrides del evento', () => {
    const presupuesto = makePresupuesto();
    const data = buildContractDataFromPresupuesto(
      presupuesto,
      { nombre: 'Nombre Editado' },
      { salon: 'Nuevo Salón' }
    );

    expect(data.customer.nombre).toBe('Nombre Editado');
    expect(data.event.salon).toBe('Nuevo Salón');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// auditPresupuestoTotals
// ─────────────────────────────────────────────────────────────────────────────

describe('auditPresupuestoTotals', () => {
  it('detecta que el presupuesto es consistente cuando los totales coinciden', () => {
    const presupuesto = makePresupuesto();
    const result = auditPresupuestoTotals(presupuesto);

    expect(result.subtotalItems).toBe(70000);
    expect(result.totalReal).toBe(70000);
    expect(result.esConsistente).toBe(true);
    expect(result.observaciones.filter(o => o.severidad === 'error')).toHaveLength(0);
  });

  it('detecta discrepancia en costoTotalEstimado', () => {
    const presupuesto = makePresupuesto({ costoTotalEstimado: 65000 });
    const result = auditPresupuestoTotals(presupuesto);

    const obs = result.observaciones.find(o => o.campo === 'costoTotalEstimado');
    expect(obs).toBeDefined();
    expect(obs?.severidad).toBe('advertencia');
  });

  it('calcula descuento porcentual correctamente', () => {
    const presupuesto = makePresupuesto({
      descuentoTipo: 'porcentaje',
      descuentoValor: 10,
      totalConDescuento: 63000,
    });
    const result = auditPresupuestoTotals(presupuesto);

    expect(result.descuentoCalculado).toBe(7000); // 10% de 70000
    expect(result.totalReal).toBe(63000);
  });

  it('calcula descuento fijo correctamente', () => {
    const presupuesto = makePresupuesto({
      descuentoTipo: 'fijo',
      descuentoValor: 5000,
      totalConDescuento: 65000,
    });
    const result = auditPresupuestoTotals(presupuesto);

    expect(result.descuentoCalculado).toBe(5000);
    expect(result.totalReal).toBe(65000);
  });

  it('trata modoDescuentoPromocional como lógica válida (no error)', () => {
    const presupuesto = makePresupuesto({
      modoDescuentoPromocional: true,
      marketingMarkupPercent: 15,
    });
    const result = auditPresupuestoTotals(presupuesto);

    const promoObs = result.observaciones.find(o => o.campo === 'modoDescuentoPromocional');
    expect(promoObs).toBeDefined();
    expect(promoObs?.severidad).toBe('info'); // info, no error
    expect(result.esConsistente).toBe(true);
    expect(result.precioListaConMarkup).toBe(Math.round(70000 * 1.15));
  });

  it('calcula saldo pendiente correctamente con pagos registrados', () => {
    const presupuesto = makePresupuesto({
      pagosCliente: [
        { id: 'p1', fecha: '2025-01-01', monto: 20000, metodoPago: 'Transferencia Bancaria' },
        { id: 'p2', fecha: '2025-03-01', monto: 10000, metodoPago: 'Efectivo' },
      ],
    });
    const result = auditPresupuestoTotals(presupuesto);

    expect(result.totalPagosRegistrados).toBe(30000);
    expect(result.saldoPendiente).toBe(40000); // 70000 - 30000
  });

  it('no genera observaciones de error con ítems regalo', () => {
    const presupuesto = makePresupuesto({
      itemsPresupuestados: [
        {
          idServicioCatalogo: 's1',
          nombreServicio: 'DJ',
          cantidad: 1,
          precioUnitario: 50000,
          precioUnitarioPresupuesto: 50000,
          costoTotalItem: 50000,
          calculationMethod: 'fijo',
        },
        {
          idServicioCatalogo: 's_regalo',
          nombreServicio: 'Mesa de dulces (regalo)',
          cantidad: 1,
          precioUnitario: 0,
          precioUnitarioPresupuesto: 0,
          costoTotalItem: 0,
          calculationMethod: 'fijo',
          esRegalo: true,
        },
      ],
      costoTotalEstimado: 50000,
      totalConDescuento: 50000,
    });
    const result = auditPresupuestoTotals(presupuesto);

    expect(result.subtotalItems).toBe(50000);
    expect(result.subtotalRegalos).toBe(0);
    expect(result.esConsistente).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateFinancialLedger
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateFinancialLedger', () => {
  it('suma ventas de facturas y presupuestos aceptados sin factura', () => {
    const presupuestos = [
      makePresupuesto({ id: 'p1', estado: 'Aceptado', invoiceId: undefined, totalConDescuento: 70000 }),
      makePresupuesto({ id: 'p2', estado: 'Aceptado', invoiceId: 'inv_1', totalConDescuento: 50000 }),
      makePresupuesto({ id: 'p3', estado: 'Borrador', invoiceId: undefined, totalConDescuento: 30000 }),
    ];
    const invoices = [
      makeInvoice({ id: 'inv_1', totalAmount: 50000 }),
    ];

    const ledger = calculateFinancialLedger(presupuestos, invoices);

    // p1 (aceptado sin factura) + inv_1 (factura)
    expect(ledger.ventasTotales).toBe(70000 + 50000);
    expect(ledger.presupuestosAceptadosSinFactura).toBe(1);
    expect(ledger.cantidadFacturas).toBe(1);
  });

  it('suma correctamente los cobros de invoice.payments', () => {
    const presupuestos: Presupuesto[] = [];
    const invoices = [
      makeInvoice({
        id: 'inv_1',
        totalAmount: 70000,
        payments: [
          { id: 'pay1', paymentDate: '2025-01-15', amount: 20000, method: 'Transferencia' },
          { id: 'pay2', paymentDate: '2025-03-10', amount: 30000, method: 'Efectivo' },
        ],
      }),
    ];

    const ledger = calculateFinancialLedger(presupuestos, invoices);

    expect(ledger.totalCobrado).toBe(50000);
    expect(ledger.saldoPendiente).toBe(20000); // 70000 - 50000
  });

  it('suma cobros de presupuesto.pagosCliente para aceptados sin factura', () => {
    const presupuestos = [
      makePresupuesto({
        id: 'p1',
        estado: 'Aceptado',
        invoiceId: undefined,
        totalConDescuento: 70000,
        pagosCliente: [
          { id: 'pg1', fecha: '2025-02-01', monto: 20000, metodoPago: 'Transferencia Bancaria' },
        ],
      }),
    ];
    const invoices: Invoice[] = [];

    const ledger = calculateFinancialLedger(presupuestos, invoices);

    expect(ledger.totalCobrado).toBe(20000);
    expect(ledger.saldoPendiente).toBe(50000);
  });

  it('devuelve saldo pendiente cero si no hay datos', () => {
    const ledger = calculateFinancialLedger([], []);

    expect(ledger.ventasTotales).toBe(0);
    expect(ledger.totalCobrado).toBe(0);
    expect(ledger.saldoPendiente).toBe(0);
    expect(ledger.porMes).toHaveLength(0);
  });

  it('agrupa ventas por mes correctamente', () => {
    const presupuestos = [
      makePresupuesto({
        id: 'p1',
        estado: 'Aceptado',
        invoiceId: undefined,
        eventoFecha: '2025-03-15T00:00:00.000Z',
        totalConDescuento: 40000,
      }),
    ];
    const invoices = [
      makeInvoice({
        id: 'inv_1',
        issueDate: '2025-03-20',
        totalAmount: 60000,
        payments: [],
      }),
    ];

    const ledger = calculateFinancialLedger(presupuestos, invoices);
    const march = ledger.porMes.find(m => m.mes === '2025-03');

    expect(march).toBeDefined();
    expect(march!.ventas).toBe(100000); // 40000 + 60000
  });
});

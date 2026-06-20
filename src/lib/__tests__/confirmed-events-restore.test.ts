import { assertConfirmedEventsBundleIsSafe } from '@/lib/imports/confirmed-events-restore';

function signedBudgetItem(overrides: Record<string, any> = {}) {
  return {
    idServicioCatalogo: 'import_doc_item',
    nombreServicio: 'Discoteca intermedia',
    descripcionServicio: 'Linea importada desde presupuesto firmado existente.',
    cantidad: 1,
    unidad: 'evento',
    precioUnitario: 14500,
    precioUnitarioPresupuesto: 14500,
    costoTotalItem: 14500,
    categoriaServicio: 'Presupuesto firmado',
    calculationMethod: 'fijo',
    esRegalo: false,
    ...overrides,
  };
}

function safeBudget(overrides: Record<string, any> = {}) {
  return {
    id: 'pres_ok',
    clienteNombre: 'Cliente OK',
    eventoTipo: 'XV anos',
    eventoFecha: '2026-08-08T03:00:00.000Z',
    salonFiestas: 'Salon Club Uruguay',
    invitadosCantidad: 100,
    itemsPresupuestados: [
      signedBudgetItem({ nombreServicio: 'Mozos', cantidad: 4, precioUnitario: 2900, precioUnitarioPresupuesto: 2900, costoTotalItem: 11600 }),
      signedBudgetItem({ nombreServicio: 'Vajilla completa', cantidad: 100, precioUnitario: 230, precioUnitarioPresupuesto: 230, costoTotalItem: 23000 }),
      signedBudgetItem({ nombreServicio: 'Discoteca intermedia', cantidad: 1, precioUnitario: 14500, precioUnitarioPresupuesto: 14500, costoTotalItem: 14500 }),
    ],
    costoTotalEstimado: 49100,
    totalConDescuento: 49100,
    ...overrides,
  };
}

describe('confirmed events restore safety', () => {
  it('blocks signed budget items collapsed to quantity one', () => {
    const bundle = {
      presupuestos: [
        safeBudget({
          id: 'pres_bad_quantities',
          itemsPresupuestados: [
            signedBudgetItem({ nombreServicio: 'Mozos', cantidad: 1, precioUnitario: 11600, precioUnitarioPresupuesto: 11600, costoTotalItem: 11600 }),
            signedBudgetItem({ nombreServicio: 'Vajilla completa', cantidad: 1, precioUnitario: 23000, precioUnitarioPresupuesto: 23000, costoTotalItem: 23000 }),
          ],
        }),
      ],
    };

    expect(() => assertConfirmedEventsBundleIsSafe(bundle, 'import.json')).toThrow(/cantidades de items sensibles sin verificar/);
  });

  it('blocks aggregate signed budget placeholders without real line items', () => {
    const bundle = {
      presupuestos: [
        safeBudget({
          id: 'pres_aggregate',
          itemsPresupuestados: [
            signedBudgetItem({
              nombreServicio: 'Servicios contratados segun presupuesto firmado',
              cantidad: 1,
              precioUnitario: 233520,
              precioUnitarioPresupuesto: 233520,
              costoTotalItem: 233520,
            }),
          ],
        }),
      ],
    };

    expect(() => assertConfirmedEventsBundleIsSafe(bundle, 'import.json')).toThrow(/presupuesto agregado sin desglose real/);
  });

  it('allows single fixed event services when quantity one is expected', () => {
    expect(() => assertConfirmedEventsBundleIsSafe({ presupuestos: [safeBudget()] }, 'import.json')).not.toThrow();
  });

  it('allows a document-verified quantity one for a sensitive fixed item', () => {
    const verifiedBudget = safeBudget({
      itemsPresupuestados: [
        signedBudgetItem({
          nombreServicio: 'Torta principal',
          cantidad: 1,
          costoTotalItem: 9900,
          precioUnitario: 9900,
          precioUnitarioPresupuesto: 9900,
          cantidadVerificadaDocumento: true,
        }),
      ],
      costoTotalEstimado: 9900,
      totalConDescuento: 9900,
    });

    expect(() => assertConfirmedEventsBundleIsSafe({ presupuestos: [verifiedBudget] }, 'import.json')).not.toThrow();
  });

  it('blocks budgets whose item sum does not match the signed total', () => {
    const bundle = {
      presupuestos: [
        safeBudget({
          costoTotalEstimado: 50000,
          totalConDescuento: 50000,
        }),
      ],
    };

    expect(() => assertConfirmedEventsBundleIsSafe(bundle, 'import.json')).toThrow(/suma de items no coincide/);
  });

  it('accepts the verified 29-event import bundle', () => {
    const bundle = {
      customers: Array.from({ length: 29 }, (_, index) => ({
        id: `customer_${index + 1}`,
        name: `Cliente verificado ${index + 1}`,
      })),
      presupuestos: Array.from({ length: 29 }, (_, index) => safeBudget({
        id: `pres_verified_${index + 1}`,
        clienteNombre: `Cliente verificado ${index + 1}`,
      })),
      fiestas: Array.from({ length: 29 }, (_, index) => ({
        id: `fiesta_verified_${index + 1}`,
        presupuestoId: `pres_verified_${index + 1}`,
        configuracion: {
          nombreEvento: `Evento verificado ${index + 1}`,
          fechaEvento: '2026-08-08T03:00:00.000Z',
          invitadosEstimados: 100,
        },
      })),
      validation: Array.from({ length: 29 }, () => ({ estado: 'VALIDADO' })),
    };

    expect(bundle.customers).toHaveLength(29);
    expect(bundle.presupuestos).toHaveLength(29);
    expect(bundle.fiestas).toHaveLength(29);
    expect(bundle.validation.every((entry: any) => entry.estado === 'VALIDADO')).toBe(true);
    expect(() => assertConfirmedEventsBundleIsSafe(bundle, 'fiestas-confirmadas-29-verificadas.json')).not.toThrow();
  });
});

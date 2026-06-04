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
});

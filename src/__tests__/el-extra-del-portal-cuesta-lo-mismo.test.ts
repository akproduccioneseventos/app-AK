import { calcularExtraServicioPortal } from '@/lib/portal/extra-servicio-portal';
import { getBudgetCollectibleTotal } from '@/lib/budget/financial-guardrails';
import type { Presupuesto } from '@/types/presupuesto';

describe('El extra del portal cuesta lo mismo que al aprobarse (Orden 375 B1)', () => {
  it('con evento del mismo año que la firma, el portal y el presupuesto aprobado dan $250.000', () => {
    const presupuestoBase: Presupuesto = {
      id: 'p-mismo-anio',
      estado: 'Aceptado',
      fechaFirmaContrato: '2026-04-01',
      eventoFecha: '2026-12-20',
      ajusteAnualActivo: false,
      ajusteAnualPorcentaje: 15,
      costoTotalEstimado: 200000,
      totalConDescuento: 200000,
      itemsPresupuestados: [],
    } as any;

    const totalActual = getBudgetCollectibleTotal(presupuestoBase);
    const vistaPortal = calcularExtraServicioPortal({
      presupuesto: presupuestoBase,
      basePrice: 50000,
      currentTotal: totalActual,
      fechaFirmaContrato: '2026-04-01',
      eventoFecha: '2026-12-20',
      annualAdjustmentPercent: 15,
    });

    const presupuestoAprobado: Presupuesto = {
      ...presupuestoBase,
      costoTotalEstimado: 250000,
      totalConDescuento: 250000,
    };

    expect(vistaPortal.appliesAdjustment).toBe(false);
    expect(vistaPortal.additional).toBe(50000);
    expect(vistaPortal.newTotal).toBe(250000);
    expect(vistaPortal.newTotal).toBe(getBudgetCollectibleTotal(presupuestoAprobado));
  });

  it('con evento del año siguiente y ajuste prendido, el portal y el presupuesto aprobado dan la misma cifra ajustada', () => {
    const presupuestoBase: Presupuesto = {
      id: 'p-proximo-anio',
      estado: 'Aceptado',
      fechaFirmaContrato: '2026-04-01',
      eventoFecha: '2027-05-20',
      ajusteAnualActivo: true,
      ajusteAnualPorcentaje: 15,
      tipoAjusteAnual: 'acumulativo',
      costoTotalEstimado: 200000,
      totalConDescuento: 200000,
      itemsPresupuestados: [],
    } as any;

    const totalActual = getBudgetCollectibleTotal(presupuestoBase);
    const vistaPortal = calcularExtraServicioPortal({
      presupuesto: presupuestoBase,
      basePrice: 50000,
      currentTotal: totalActual,
      fechaFirmaContrato: '2026-04-01',
      eventoFecha: '2027-05-20',
      annualAdjustmentPercent: 15,
    });

    const presupuestoAprobado: Presupuesto = {
      ...presupuestoBase,
      costoTotalEstimado: 250000,
      totalConDescuento: 250000,
    };

    expect(vistaPortal.appliesAdjustment).toBe(true);
    expect(vistaPortal.additional).toBe(57500);
    expect(vistaPortal.newTotal).toBe(287500);
    expect(vistaPortal.newTotal).toBe(getBudgetCollectibleTotal(presupuestoAprobado));
  });
});

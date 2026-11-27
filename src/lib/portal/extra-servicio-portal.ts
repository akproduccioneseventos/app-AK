import {
  buildAnnualAdjustmentProjection,
  getYearFromDate,
} from '@/lib/budget/formal-budget';
import type { Presupuesto } from '@/types/presupuesto';

/**
 * Calcula el adicional y el nuevo total al simular la suma de un servicio desde el portal,
 * usando exactamente la misma regla de ajuste anual que `getBudgetCollectibleTotal`.
 */
export function calcularExtraServicioPortal(input: {
  presupuesto?: Presupuesto | null;
  basePrice: number;
  currentTotal: number;
  fechaFirmaContrato?: string;
  eventoFecha?: string;
  annualAdjustmentPercent: number;
}): { additional: number; newTotal: number; appliesAdjustment: boolean } {
  const basePrice = Math.max(0, Math.round(Number(input.basePrice) || 0));
  if (basePrice <= 0) {
    return {
      additional: 0,
      newTotal: Math.max(0, Math.round(Number(input.currentTotal) || 0)),
      appliesAdjustment: false,
    };
  }

  const presupuesto = input.presupuesto;
  const isContracted = Boolean(
    presupuesto && (presupuesto.estado === 'Aceptado' || presupuesto.estado === 'Facturado'),
  );
  const contractYear = getYearFromDate(
    presupuesto?.fechaFirmaContrato
      ?? presupuesto?.timestamp
      ?? input.fechaFirmaContrato,
  );
  const eventDate = presupuesto?.eventoFecha ?? input.eventoFecha;

  if (
    !presupuesto
    || !isContracted
    || presupuesto.ajusteAnualActivo === false
    || contractYear === null
  ) {
    return {
      additional: basePrice,
      newTotal: Math.round(Number(input.currentTotal) || 0) + basePrice,
      appliesAdjustment: false,
    };
  }

  const projection = buildAnnualAdjustmentProjection({
    baseTotal: basePrice,
    eventDate,
    currentYear: contractYear,
    adjustmentPct: input.annualAdjustmentPercent,
    tipoAjusteAnual: presupuesto.tipoAjusteAnual,
  });

  // Si `ajusteAnualActivo === true` explícito y el evento es de año posterior (applies === true),
  // aplica el factor proyectado; si es del mismo año, `applies` es false -> costo sin ajuste.
  const additional = projection.applies ? projection.adjustedTotal : basePrice;
  return {
    additional,
    newTotal: Math.round(Number(input.currentTotal) || 0) + additional,
    appliesAdjustment: projection.applies,
  };
}

import type { Presupuesto } from '@/types/presupuesto';
import { buildAnnualAdjustmentProjection, getYearFromDate } from '@/lib/budget/formal-budget';
import { getBudgetPaymentSummary } from '@/lib/budget/financial-guardrails';

/**
 * El estado de cuenta del cliente, con el ajuste anual incluido.
 *
 * Por qué existe: el mismo saldo se calculaba de tres formas distintas. La
 * pantalla de estado de cuenta sumaba el ajuste anual por inflación; el recibo
 * de pago no lo sumaba. Con un evento agendado para el año siguiente, el cliente
 * veía un saldo en un papel y otro en la pantalla.
 *
 * El ajuste se aplica cuando el presupuesto ya es un contrato (aceptado o
 * facturado), tiene el ajuste activo, y el evento cae en un año posterior al del
 * presupuesto. Ese último punto es el que le da sentido: no se ajusta lo que se
 * cobra en el mismo año.
 */
export type EstadoDeCuenta = {
  /** Total antes del ajuste anual. */
  totalBase: number;
  /** Total que corresponde cobrar, con el ajuste ya sumado. */
  total: number;
  /** Cuánto suma el ajuste anual. Cero si no corresponde. */
  ajusteAnual: number;
  /** Porcentaje anual aplicado. */
  porcentajeAjuste: number;
  /** Cuántos años de ajuste se aplicaron. */
  aniosDeAjuste: number;
  /** Pagos confirmados. */
  pagado: number;
  /** Pagos informados por el cliente y todavía sin confirmar. */
  aRevisar: number;
  /** Lo que falta cobrar. Nunca negativo. */
  saldo: number;
};

export function calcularEstadoDeCuenta(
  presupuesto: Presupuesto | null | undefined,
  porcentajePorDefecto?: number | null,
): EstadoDeCuenta {
  const resumen = getBudgetPaymentSummary(presupuesto ?? null, {
    includeAnnualAdjustment: false,
  });
  const vacio: EstadoDeCuenta = {
    totalBase: resumen.total,
    total: resumen.total,
    ajusteAnual: 0,
    porcentajeAjuste: 0,
    aniosDeAjuste: 0,
    pagado: resumen.paid,
    aRevisar: resumen.pendingReview,
    saldo: resumen.balance,
  };
  if (!presupuesto) return vacio;

  const porcentaje = presupuesto.ajusteAnualPorcentaje ?? porcentajePorDefecto ?? undefined;
  const anioDelContrato = getYearFromDate(
    presupuesto.fechaFirmaContrato ?? presupuesto.timestamp,
  );

  const proyeccion = buildAnnualAdjustmentProjection({
    baseTotal: resumen.total,
    eventDate: presupuesto.eventoFecha,
    currentYear: anioDelContrato ?? undefined,
    adjustmentPct: porcentaje,
  });

  const esContrato = presupuesto.estado === 'Aceptado' || presupuesto.estado === 'Facturado';
  const corresponde = esContrato && Boolean(presupuesto.ajusteAnualActivo) && proyeccion.applies;
  if (!corresponde) return { ...vacio, porcentajeAjuste: proyeccion.adjustmentPct };

  return {
    totalBase: proyeccion.baseTotal,
    total: proyeccion.adjustedTotal,
    ajusteAnual: proyeccion.adjustmentAmount,
    porcentajeAjuste: proyeccion.adjustmentPct,
    aniosDeAjuste: proyeccion.eventYear - proyeccion.currentYear,
    pagado: resumen.paid,
    aRevisar: resumen.pendingReview,
    saldo: Math.max(0, proyeccion.adjustedTotal - resumen.paid),
  };
}

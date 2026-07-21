import type { Presupuesto } from '@/types/presupuesto';

export const DEFAULT_ANNUAL_ADJUSTMENT_PERCENTAGE = 15;
export const DEFAULT_BOOKING_DEPOSIT_AMOUNT = 5000;
export const BUDGET_VALIDITY_DAYS = 30;

export function buildFormalBudgetBookingNote(input: {
  hasAnnualAdjustment: boolean;
  adjustmentPct?: number | null;
  bookingDepositAmount?: number | null;
  currentYear?: number;
  validityDays?: number;
}): string {
  const adjustmentPct = Math.max(
    0,
    Number(input.adjustmentPct ?? DEFAULT_ANNUAL_ADJUSTMENT_PERCENTAGE) || 0,
  );
  const bookingDepositAmount = Math.max(
    0,
    Math.round(Number(input.bookingDepositAmount ?? DEFAULT_BOOKING_DEPOSIT_AMOUNT) || 0),
  );
  const validityDays = Math.max(1, Math.round(Number(input.validityDays ?? BUDGET_VALIDITY_DAYS) || BUDGET_VALIDITY_DAYS));
  const currentYear = input.currentYear ?? new Date().getFullYear();
  const formattedDeposit = new Intl.NumberFormat('es-UY', {
    maximumFractionDigits: 0,
  }).format(bookingDepositAmount);
  const baseNote = `El presupuesto es válido por ${validityDays} días para mantener el precio de la promoción y los regalos incluidos. La reserva de la fecha y de los servicios se realiza con una seña de $ ${formattedDeposit}.`;

  if (input.hasAnnualAdjustment) {
    return `${baseNote} Los eventos programados para años posteriores al vigente tendrán un ajuste anual proyectado del ${adjustmentPct}% de acuerdo a lo establecido en el contrato.`;
  }

  return `${baseNote} El total mostrado corresponde al precio vigente del año ${currentYear}.`;
}

export type AnnualAdjustmentProjectionRow = {
  year: number;
  total: number;
  adjustmentAmount: number;
};

export type AnnualAdjustmentProjection = {
  applies: boolean;
  currentYear: number;
  eventYear: number;
  adjustmentPct: number;
  baseTotal: number;
  adjustedTotal: number;
  adjustmentAmount: number;
  rows: AnnualAdjustmentProjectionRow[];
};

export function getYearFromDate(value?: string | Date | null): number | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getFullYear();
}

export function buildAnnualAdjustmentProjection(input: {
  baseTotal: number;
  eventDate?: string | Date | null;
  currentYear?: number;
  adjustmentPct?: number | null;
}): AnnualAdjustmentProjection {
  const baseTotal = Math.max(0, Math.round(Number(input.baseTotal) || 0));
  const currentYear = input.currentYear ?? new Date().getFullYear();
  const eventYear = getYearFromDate(input.eventDate) ?? currentYear;
  const adjustmentPct = Math.max(
    0,
    Number(input.adjustmentPct ?? DEFAULT_ANNUAL_ADJUSTMENT_PERCENTAGE) || 0,
  );

  const rows: AnnualAdjustmentProjectionRow[] = [];
  let projectedTotal = baseTotal;

  if (adjustmentPct > 0 && eventYear > currentYear) {
    for (let year = currentYear + 1; year <= eventYear; year += 1) {
      const previousTotal = projectedTotal;
      projectedTotal = Math.round(projectedTotal * (1 + adjustmentPct / 100));
      rows.push({
        year,
        total: projectedTotal,
        adjustmentAmount: Math.max(0, projectedTotal - previousTotal),
      });
    }
  }

  return {
    applies: rows.length > 0,
    currentYear,
    eventYear,
    adjustmentPct,
    baseTotal,
    adjustedTotal: projectedTotal,
    adjustmentAmount: Math.max(0, projectedTotal - baseTotal),
    rows,
  };
}

export function calculatePricePerPerson(total: number, guestCount?: number | null): number {
  const guests = Math.max(0, Math.round(Number(guestCount) || 0));
  if (guests <= 0) return 0;
  return Math.round((Math.max(0, Number(total) || 0) / guests) * 100) / 100;
}

export function getBudgetGuestCount(presupuesto: Pick<Presupuesto, 'invitadosAdultos' | 'invitadosNinos' | 'invitadosAdolescentes' | 'invitadosCantidad'>): number {
  const segmented =
    (Number(presupuesto.invitadosAdultos) || 0) +
    (Number(presupuesto.invitadosNinos) || 0) +
    (Number(presupuesto.invitadosAdolescentes) || 0);
  return segmented > 0 ? segmented : Math.max(0, Number(presupuesto.invitadosCantidad) || 0);
}

export function isSimulatorBudget(source?: Presupuesto['source']): boolean {
  return source === 'simulator' || source === 'simulator_common' || source === 'simulator_assistant';
}

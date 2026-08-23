const DAY_MS = 24 * 60 * 60 * 1000;
const AVERAGE_MONTH_MS = 30.4375 * DAY_MS;

export type SimulatorPaymentPlanInput = {
  currentTotal: number;
  projectedTotal: number;
  annualAdjustmentApplies: boolean;
  bookingDepositAmount: number;
  eventDate?: Date | string | null;
  now?: Date;
};

export type SimulatorPaymentPlan = {
  totalForPlan: number;
  deposit: number;
  balance: number;
  installments: number;
  installmentAmount: number;
  paymentDeadline: Date | null;
};

function positiveAmount(value: number): number {
  return Math.max(0, Math.round(Number(value) || 0));
}

export function calculateSimulatorPaymentPlan(input: SimulatorPaymentPlanInput): SimulatorPaymentPlan {
  const currentTotal = positiveAmount(input.currentTotal);
  const projectedTotal = positiveAmount(input.projectedTotal);
  const totalForPlan = input.annualAdjustmentApplies ? projectedTotal : currentTotal;
  const deposit = Math.min(totalForPlan, positiveAmount(input.bookingDepositAmount));
  const balance = Math.max(0, totalForPlan - deposit);

  const now = input.now ?? new Date();
  const parsedEventDate = input.eventDate ? new Date(input.eventDate) : null;
  const validEventDate = parsedEventDate && !Number.isNaN(parsedEventDate.getTime()) ? parsedEventDate : null;
  const paymentDeadline = validEventDate
    ? new Date(validEventDate.getTime() - 30 * DAY_MS)
    : null;
  const availableMonths = paymentDeadline
    ? Math.max(1, Math.min(24, Math.ceil((paymentDeadline.getTime() - now.getTime()) / AVERAGE_MONTH_MS)))
    : 6;
  const installments = balance > 0 ? availableMonths : 0;

  return {
    totalForPlan,
    deposit,
    balance,
    installments,
    installmentAmount: installments > 0 ? Math.ceil(balance / installments) : 0,
    paymentDeadline,
  };
}

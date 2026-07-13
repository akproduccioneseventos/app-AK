import type { PagoCliente, Presupuesto } from '@/types/presupuesto';
import { recalcularCostoItem } from '@/lib/calculations';

const MONEY_TOLERANCE = 1;

export type FinancialGuardrailIssue = {
  field: string;
  message: string;
  expected?: number;
  actual?: number;
};

export type PaymentGuardrailResult =
  | { ok: true; remainingBeforePayment: number; totalConfirmedAfterPayment: number }
  | { ok: false; error: string; remainingBeforePayment: number; totalConfirmedAfterPayment: number };

export type BudgetPaymentSummary = {
  total: number;
  paid: number;
  pendingReview: number;
  balance: number;
  paidPercent: number;
  isFullyPaid: boolean;
};

export type PaymentReceiptSnapshot = BudgetPaymentSummary & {
  paymentAmount: number;
  balanceBeforePayment: number;
  balanceAfterPayment: number;
};

export function roundMoney(value: unknown): number {
  const numberValue = Number(value ?? 0);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.max(0, Math.round(numberValue));
}

function hasExplicitGuestSplit(
  presupuesto: Pick<Presupuesto, 'invitadosAdultos' | 'invitadosNinos' | 'invitadosAdolescentes'>,
): boolean {
  return presupuesto.invitadosAdultos != null
    || presupuesto.invitadosNinos != null
    || presupuesto.invitadosAdolescentes != null;
}

export function calculateGuestSplitTotal(
  presupuesto: Pick<Presupuesto, 'invitadosAdultos' | 'invitadosNinos' | 'invitadosAdolescentes'>,
): number {
  return roundMoney(presupuesto.invitadosAdultos)
    + roundMoney(presupuesto.invitadosNinos)
    + roundMoney(presupuesto.invitadosAdolescentes);
}

export function resolveBudgetGuestTotal(
  presupuesto: Pick<Presupuesto, 'invitadosCantidad' | 'invitadosAdultos' | 'invitadosNinos' | 'invitadosAdolescentes'>,
): number {
  const splitTotal = calculateGuestSplitTotal(presupuesto);
  if (hasExplicitGuestSplit(presupuesto) && splitTotal > 0) return splitTotal;
  return roundMoney(presupuesto.invitadosCantidad);
}

function normalizePercent(value: unknown): number {
  const numberValue = Number(value ?? 0);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.min(100, Math.max(0, numberValue));
}

export function isConfirmedClientPayment(payment: Pick<PagoCliente, 'estadoPago'>): boolean {
  return payment.estadoPago !== 'pendiente_confirmacion' && payment.estadoPago !== 'rechazado';
}

function paymentDay(value: unknown): string {
  const date = new Date(String(value ?? ''));
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

export function findMatchingClientPayment(
  payments: PagoCliente[] = [],
  amount: number,
  date: string,
): PagoCliente | undefined {
  const expectedDay = paymentDay(date);
  if (!expectedDay) return undefined;

  return payments.find((payment) => (
    payment.estadoPago !== 'rechazado'
    && roundMoney(payment.monto) === roundMoney(amount)
    && paymentDay(payment.fecha) === expectedDay
  ));
}

export function sumConfirmedClientPayments(payments: PagoCliente[] = [], excludePaymentId?: string): number {
  return payments
    .filter((payment) => payment.id !== excludePaymentId)
    .filter(isConfirmedClientPayment)
    .reduce((sum, payment) => sum + roundMoney(payment.monto), 0);
}

export function sumPendingClientPayments(payments: PagoCliente[] = [], excludePaymentId?: string): number {
  return payments
    .filter((payment) => payment.id !== excludePaymentId)
    .filter((payment) => payment.estadoPago === 'pendiente_confirmacion')
    .reduce((sum, payment) => sum + roundMoney(payment.monto), 0);
}

export function calculateDiscountAmount(subtotal: number, presupuesto: Pick<Presupuesto, 'descuentoTipo' | 'descuentoValor'>): number {
  const discountValue = presupuesto.descuentoTipo === 'porcentaje'
    ? normalizePercent(presupuesto.descuentoValor)
    : roundMoney(presupuesto.descuentoValor);
  if (!presupuesto.descuentoTipo || discountValue <= 0) return 0;

  const rawDiscount = presupuesto.descuentoTipo === 'porcentaje'
    ? Math.round(subtotal * discountValue / 100)
    : discountValue;

  return Math.min(subtotal, Math.max(0, rawDiscount));
}

export function calculateBudgetFinancials(
  presupuesto: Presupuesto,
  options: { preserveStoredTotal?: boolean } = {},
) {
  const splitTotal = calculateGuestSplitTotal(presupuesto);
  const hasUsableSplit = hasExplicitGuestSplit(presupuesto) && splitTotal > 0;
  const adultos = hasUsableSplit
    ? roundMoney(presupuesto.invitadosAdultos)
    : resolveBudgetGuestTotal(presupuesto);
  const adolescentes = hasUsableSplit ? roundMoney(presupuesto.invitadosAdolescentes) : 0;
  const ninos = hasUsableSplit ? roundMoney(presupuesto.invitadosNinos) : 0;

  const items = (presupuesto.itemsPresupuestados ?? []).map((item) => ({
    ...item,
    cantidad: roundMoney(item.cantidad),
    precioUnitario: roundMoney(item.precioUnitario),
    precioUnitarioPresupuesto: roundMoney(item.precioUnitarioPresupuesto ?? item.precioUnitario),
    costoTotalItem: recalcularCostoItem({
      ...item,
      cantidad: roundMoney(item.cantidad),
      precioUnitario: roundMoney(item.precioUnitario),
      precioUnitarioPresupuesto: roundMoney(item.precioUnitarioPresupuesto ?? item.precioUnitario),
    }, adultos, adolescentes, ninos),
  }));

  const subtotal = items
    .filter((item) => !item.esRegalo)
    .reduce((sum, item) => sum + roundMoney(item.costoTotalItem), 0);
  const discount = calculateDiscountAmount(subtotal, presupuesto);
  const baseTotal = Math.max(0, subtotal - discount);
  const storedTotal = roundMoney(presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado);
  // The official budget, payments and balance always use today's price.
  // Future-year adjustments are informative projections built by formal-budget.ts.
  const total = options.preserveStoredTotal && storedTotal > 0 ? storedTotal : baseTotal;
  const confirmedPaid = sumConfirmedClientPayments(presupuesto.pagosCliente ?? []);
  const pendingReview = sumPendingClientPayments(presupuesto.pagosCliente ?? []);
  const balance = Math.max(0, total - confirmedPaid);

  return {
    items,
    subtotal,
    discount,
    total,
    confirmedPaid,
    pendingReview,
    balance,
  };
}

export function normalizePresupuestoFinancials(
  presupuesto: Presupuesto,
  options: { preserveStoredTotal?: boolean } = {},
): Presupuesto {
  const financials = calculateBudgetFinancials(presupuesto, options);

  return {
    ...presupuesto,
    invitadosAdultos: roundMoney(presupuesto.invitadosAdultos),
    invitadosNinos: roundMoney(presupuesto.invitadosNinos),
    invitadosAdolescentes: roundMoney(presupuesto.invitadosAdolescentes),
    invitadosCantidad: resolveBudgetGuestTotal(presupuesto),
    itemsPresupuestados: financials.items,
    costoTotalEstimado: financials.subtotal,
    totalConDescuento: financials.total,
    saldo: financials.balance,
  };
}

export function validatePaymentAgainstBudget(
  presupuesto: Presupuesto,
  amount: number,
  options: { excludePaymentId?: string; allowOverpay?: boolean; includePendingForLimit?: boolean } = {},
): PaymentGuardrailResult {
  const normalizedAmount = roundMoney(amount);
  const total = roundMoney(
    presupuesto.totalConDescuento
    ?? presupuesto.costoTotalEstimado
    ?? (presupuesto as { totalFinal?: number; total?: number }).totalFinal
    ?? (presupuesto as { total?: number }).total,
  );
  const confirmedBefore = sumConfirmedClientPayments(presupuesto.pagosCliente ?? [], options.excludePaymentId);
  const pendingBefore = options.includePendingForLimit
    ? sumPendingClientPayments(presupuesto.pagosCliente ?? [], options.excludePaymentId)
    : 0;
  const reservedBeforePayment = confirmedBefore + pendingBefore;
  const remainingBeforePayment = Math.max(0, total - reservedBeforePayment);
  const totalConfirmedAfterPayment = confirmedBefore + normalizedAmount;
  const totalReservedAfterPayment = reservedBeforePayment + normalizedAmount;

  if (normalizedAmount <= 0) {
    return {
      ok: false,
      error: 'El monto del pago debe ser mayor a cero.',
      remainingBeforePayment,
      totalConfirmedAfterPayment,
    };
  }

  if (!options.allowOverpay && totalReservedAfterPayment > total + MONEY_TOLERANCE) {
    return {
      ok: false,
      error: `El pago supera el saldo pendiente. Saldo: $${remainingBeforePayment.toLocaleString('es-UY')}.`,
      remainingBeforePayment,
      totalConfirmedAfterPayment,
    };
  }

  return { ok: true, remainingBeforePayment, totalConfirmedAfterPayment };
}

export function getBudgetPaymentSummary(presupuesto?: Presupuesto | null): BudgetPaymentSummary {
  if (!presupuesto) {
    return {
      total: 0,
      paid: 0,
      pendingReview: 0,
      balance: 0,
      paidPercent: 0,
      isFullyPaid: false,
    };
  }

  const total = roundMoney(presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado);
  const paid = sumConfirmedClientPayments(presupuesto.pagosCliente ?? []);
  const pendingReview = sumPendingClientPayments(presupuesto.pagosCliente ?? []);
  const balance = Math.max(0, total - paid);
  const paidPercent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

  return {
    total,
    paid,
    pendingReview,
    balance,
    paidPercent,
    isFullyPaid: total > 0 && balance <= MONEY_TOLERANCE,
  };
}

export function getPaymentReceiptSnapshot(
  presupuesto: Presupuesto,
  payment: PagoCliente,
): PaymentReceiptSnapshot {
  const summary = getBudgetPaymentSummary(presupuesto);
  const paymentAmount = roundMoney(payment.monto);
  const balanceAfterPayment = summary.balance;
  const balanceBeforePayment = isConfirmedClientPayment(payment)
    ? Math.max(0, balanceAfterPayment + paymentAmount)
    : balanceAfterPayment;

  return {
    ...summary,
    paymentAmount,
    balanceBeforePayment,
    balanceAfterPayment,
  };
}

export function auditPresupuestoFinancialGuardrails(presupuesto: Presupuesto): FinancialGuardrailIssue[] {
  const financials = calculateBudgetFinancials(presupuesto);
  const issues: FinancialGuardrailIssue[] = [];
  const splitTotal = calculateGuestSplitTotal(presupuesto);

  if (
    hasExplicitGuestSplit(presupuesto)
    && splitTotal > 0
    && Math.abs(roundMoney(presupuesto.invitadosCantidad) - splitTotal) > MONEY_TOLERANCE
  ) {
    issues.push({
      field: 'invitadosCantidad',
      message: 'El total de invitados no coincide con adultos + ninos + adolescentes.',
      expected: splitTotal,
      actual: roundMoney(presupuesto.invitadosCantidad),
    });
  }

  if (Math.abs(roundMoney(presupuesto.costoTotalEstimado) - financials.subtotal) > MONEY_TOLERANCE) {
    issues.push({
      field: 'costoTotalEstimado',
      message: 'El subtotal guardado no coincide con la suma de items.',
      expected: financials.subtotal,
      actual: roundMoney(presupuesto.costoTotalEstimado),
    });
  }

  if (Math.abs(roundMoney(presupuesto.totalConDescuento) - financials.total) > MONEY_TOLERANCE) {
    issues.push({
      field: 'totalConDescuento',
      message: 'El total guardado no coincide con el calculo central.',
      expected: financials.total,
      actual: roundMoney(presupuesto.totalConDescuento),
    });
  }

  if (Math.abs(roundMoney(presupuesto.saldo) - financials.balance) > MONEY_TOLERANCE) {
    issues.push({
      field: 'saldo',
      message: 'El saldo guardado no coincide con los pagos confirmados.',
      expected: financials.balance,
      actual: roundMoney(presupuesto.saldo),
    });
  }

  if (financials.confirmedPaid > financials.total + MONEY_TOLERANCE) {
    issues.push({
      field: 'pagosCliente',
      message: 'Los pagos confirmados superan el total del presupuesto.',
      expected: financials.total,
      actual: financials.confirmedPaid,
    });
  }

  return issues;
}

export function parseCleanMoney(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Math.max(0, Math.round(value));
  let str = String(value).trim();
  // Strip currency symbols ($ or UYU or USD) and spaces
  str = str.replace(/[$\s]|UYU|USD/gi, '');
  if (!str) return 0;

  // Now parse using rules similar to parseSafeNumber
  if (str.includes(',')) {
    // If it has commas, it might use dot as thousands and comma as decimal separator, e.g. 10.500,50 -> 10500.50
    str = str.replace(/\./g, '').replace(',', '.');
  } else {
    // If it has dots, it could be thousands separators (e.g. 10.000) or a decimal point (e.g. 10000.50)
    const parts = str.split('.');
    if (parts.length > 2) {
      // Multiple dots must be thousands separators, e.g. 1.000.000
      str = str.replace(/\./g, '');
    } else if (parts.length === 2) {
      if (parts[1].length === 3) {
        str = str.replace(/\./g, '');
      }
    }
  }

  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : Math.max(0, Math.round(parsed));
}


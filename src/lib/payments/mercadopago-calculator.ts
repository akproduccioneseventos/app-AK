export const MERCADO_PAGO_INSTALLMENTS_METHOD = 'MercadoPago (Cuotas +10%)';
export const MERCADO_PAGO_SURCHARGE_PERCENT = 10;
export const MERCADO_PAGO_INSTALLMENT_COUNTS = [1, 3, 6, 10, 12] as const;

export type MercadoPagoInstallmentCount = typeof MERCADO_PAGO_INSTALLMENT_COUNTS[number];

export interface MercadoPagoPaymentOption {
  installments: MercadoPagoInstallmentCount;
  surchargePercent: number;
  baseAmount: number;
  surchargeAmount: number;
  totalWithSurcharge: number;
  installmentAmount: number;
  installmentAmounts: number[];
  label: string;
}

export interface MercadoPagoCalculationResult {
  baseAmount: number;
  surchargePercent: number;
  surchargeAmount: number;
  totalWithSurcharge: number;
  options: MercadoPagoPaymentOption[];
}

export function isMercadoPagoInstallmentCount(
  value: unknown,
): value is MercadoPagoInstallmentCount {
  return MERCADO_PAGO_INSTALLMENT_COUNTS.includes(
    Number(value) as MercadoPagoInstallmentCount,
  );
}

export function isMercadoPagoInstallmentsMethod(value: unknown): boolean {
  return String(value ?? '').trim().toLowerCase()
    === MERCADO_PAGO_INSTALLMENTS_METHOD.toLowerCase();
}

function splitTotalExactly(total: number, installments: MercadoPagoInstallmentCount): number[] {
  const minimumAmount = Math.floor(total / installments);
  const remainder = total - minimumAmount * installments;

  return Array.from(
    { length: installments },
    (_, index) => minimumAmount + (index < remainder ? 1 : 0),
  );
}

function buildInstallmentLabel(installmentAmounts: number[]): string {
  const format = (amount: number) => `$ ${amount.toLocaleString('es-UY')}`;
  if (installmentAmounts.length === 1) {
    return `1 pago de ${format(installmentAmounts[0])}`;
  }

  const higherAmount = installmentAmounts[0];
  const higherCount = installmentAmounts.filter((amount) => amount === higherAmount).length;
  const lowerCount = installmentAmounts.length - higherCount;

  if (lowerCount === 0) {
    return `${installmentAmounts.length} cuotas de ${format(higherAmount)}`;
  }

  const lowerAmount = installmentAmounts[installmentAmounts.length - 1];
  return `${higherCount} cuotas de ${format(higherAmount)} y ${lowerCount} de ${format(lowerAmount)}`;
}

export function calculateMercadoPagoCuotas(baseAmount: number): MercadoPagoCalculationResult {
  const base = Math.max(0, Math.round(baseAmount || 0));
  const surchargeAmount = Math.round(base * MERCADO_PAGO_SURCHARGE_PERCENT / 100);
  const totalWithSurcharge = base + surchargeAmount;

  const options = MERCADO_PAGO_INSTALLMENT_COUNTS.map((count) => {
    const installmentAmounts = splitTotalExactly(totalWithSurcharge, count);
    return {
      installments: count,
      surchargePercent: MERCADO_PAGO_SURCHARGE_PERCENT,
      baseAmount: base,
      surchargeAmount,
      totalWithSurcharge,
      installmentAmount: installmentAmounts[0] ?? 0,
      installmentAmounts,
      label: buildInstallmentLabel(installmentAmounts),
    };
  });

  return {
    baseAmount: base,
    surchargePercent: MERCADO_PAGO_SURCHARGE_PERCENT,
    surchargeAmount,
    totalWithSurcharge,
    options,
  };
}

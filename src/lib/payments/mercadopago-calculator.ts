/**
 * Mercado Pago & Credit Card Installment Calculator for AK Producciones.
 * Applies a 10% surcharge/interest when paying with credit card / Mercado Pago in installments.
 */

export interface MercadoPagoPaymentOption {
  installments: number; // 1, 3, 6, 10, 12 cuotas
  surchargePercent: number; // 10%
  baseAmount: number;
  surchargeAmount: number;
  totalWithSurcharge: number;
  installmentAmount: number;
  label: string;
}

export interface MercadoPagoCalculationResult {
  baseAmount: number;
  surchargePercent: number;
  surchargeAmount: number;
  totalWithSurcharge: number;
  options: MercadoPagoPaymentOption[];
}

export function calculateMercadoPagoCuotas(baseAmount: number): MercadoPagoCalculationResult {
  const base = Math.max(0, Math.round(baseAmount || 0));
  const SURCHARGE_PCT = 0.10; // 10% recargo por tarjeta / Mercado Pago cuotas
  const surchargeAmount = Math.round(base * SURCHARGE_PCT);
  const totalWithSurcharge = base + surchargeAmount;

  const installmentCounts = [1, 3, 6, 10, 12];
  const options = installmentCounts.map((count) => {
    const installmentAmount = Math.round(totalWithSurcharge / count);
    return {
      installments: count,
      surchargePercent: 10,
      baseAmount: base,
      surchargeAmount,
      totalWithSurcharge,
      installmentAmount,
      label:
        count === 1
          ? `1 pago de $ ${totalWithSurcharge.toLocaleString('es-UY')}`
          : `${count} cuotas de $ ${installmentAmount.toLocaleString('es-UY')}/mes (Total $ ${totalWithSurcharge.toLocaleString('es-UY')})`,
    };
  });

  return {
    baseAmount: base,
    surchargePercent: 10,
    surchargeAmount,
    totalWithSurcharge,
    options,
  };
}

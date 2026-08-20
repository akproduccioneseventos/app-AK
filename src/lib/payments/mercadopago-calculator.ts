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


/**
 * El mismo dinero, contado como descuento por pagar al contado.
 *
 * **Por que existe.** La cuenta es identica a la de arriba: el que paga en cuotas
 * termina pagando un 10% mas. Lo que cambia es como se lo cuenta al cliente.
 *
 * - Antes: "precio X, y si pagas en cuotas te recargamos un 10%". El recargo se
 *   lee como un castigo y aparece justo cuando la persona esta por decidir.
 * - Ahora: "precio de lista Y, y si pagas contado o por transferencia te hacemos
 *   un 10% de descuento". Es la misma plata y **es cierto**: el precio de lista es
 *   el precio de lista, y el descuento por pago contado es una practica comercial
 *   normal en cualquier rubro.
 *
 * No se inventa nada ni se esconde nada: el que paga en cuotas ve exactamente lo
 * que va a pagar, y el que paga contado ve cuanto se ahorra.
 *
 * **Adentro de la empresa se sigue viendo como recargo**, que es lo que es para la
 * contabilidad: la pantalla donde el equipo registra una seña muestra el recargo
 * financiero aparte. Esto es solo para lo que ve el cliente.
 */
export interface MercadoPagoPresentacionComercial {
  /** Lo que paga el que abona contado o por transferencia. */
  precioContado: number;
  /** Lo que paga el que financia. Es el precio de lista. */
  precioLista: number;
  /** Cuanto se ahorra el que paga contado, en pesos. */
  ahorroContado: number;
  /** Cuanto se ahorra el que paga contado, en porcentaje sobre el precio de lista. */
  descuentoContadoPercent: number;
}

export function presentacionComercialMercadoPago(
  baseAmount: number,
): MercadoPagoPresentacionComercial {
  const { baseAmount: precioContado, totalWithSurcharge: precioLista } =
    calculateMercadoPagoCuotas(baseAmount);

  const ahorroContado = precioLista - precioContado;

  // El porcentaje se calcula sobre el precio de lista, no sobre el contado: un
  // recargo del 10% es un descuento del 9%, y decir 10% seria inflarlo.
  const descuentoContadoPercent = precioLista > 0
    ? Math.round((ahorroContado / precioLista) * 100)
    : 0;

  return { precioContado, precioLista, ahorroContado, descuentoContadoPercent };
}

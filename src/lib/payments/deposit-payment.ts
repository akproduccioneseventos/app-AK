import type { Payment } from '@/types/invoice';
import type { MetodoPago } from '@/types/presupuesto';
import {
  calculateMercadoPagoCuotas,
  isMercadoPagoInstallmentCount,
  isMercadoPagoInstallmentsMethod,
  type MercadoPagoInstallmentCount,
  type MercadoPagoPaymentOption,
} from './mercadopago-calculator';

export interface DepositPaymentBreakdown {
  baseAmount: number;
  chargedAmount: number;
  surchargeAmount: number;
  installments?: MercadoPagoInstallmentCount;
  installmentOption?: MercadoPagoPaymentOption;
  invoiceMethod: NonNullable<Payment['method']>;
  budgetMethod: MetodoPago;
}

export function mapDepositMethodToInvoiceMethod(method: string): NonNullable<Payment['method']> {
  const normalized = (method || '').trim().toLowerCase();
  if (normalized === 'efectivo') return 'Efectivo';
  if (normalized === 'tarjeta') return 'Tarjeta';
  if (
    normalized === 'mercadopago'
    || isMercadoPagoInstallmentsMethod(method)
  ) {
    return 'MercadoPago';
  }
  if (
    normalized === 'transferencia'
    || normalized === 'transferencia bancaria'
    || normalized === 'transferencia_bancaria'
  ) {
    return 'Transferencia';
  }
  return 'Otro';
}

export function mapDepositMethodToBudgetMethod(method: string): MetodoPago {
  const invoiceMethod = mapDepositMethodToInvoiceMethod(method);
  if (invoiceMethod === 'Efectivo') return 'Efectivo';
  if (invoiceMethod === 'Tarjeta') return 'Tarjeta';
  if (invoiceMethod === 'MercadoPago') return 'MercadoPago';
  if (invoiceMethod === 'Transferencia') return 'Transferencia Bancaria';
  return 'Otro';
}

export function buildDepositPaymentBreakdown(
  baseAmount: number,
  method: string,
  installments?: number,
): DepositPaymentBreakdown {
  const normalizedBase = Math.max(0, Math.round(Number(baseAmount) || 0));
  const invoiceMethod = mapDepositMethodToInvoiceMethod(method);
  const budgetMethod = mapDepositMethodToBudgetMethod(method);

  if (!isMercadoPagoInstallmentsMethod(method)) {
    return {
      baseAmount: normalizedBase,
      chargedAmount: normalizedBase,
      surchargeAmount: 0,
      invoiceMethod,
      budgetMethod,
    };
  }

  if (!isMercadoPagoInstallmentCount(installments)) {
    throw new Error('Selecciona una cantidad valida de cuotas de Mercado Pago.');
  }

  const calculation = calculateMercadoPagoCuotas(normalizedBase);
  const installmentOption = calculation.options.find(
    (option) => option.installments === installments,
  );
  if (!installmentOption) {
    throw new Error('No se pudo calcular la financiacion de Mercado Pago.');
  }

  return {
    baseAmount: normalizedBase,
    chargedAmount: calculation.totalWithSurcharge,
    surchargeAmount: calculation.surchargeAmount,
    installments,
    installmentOption,
    invoiceMethod,
    budgetMethod,
  };
}

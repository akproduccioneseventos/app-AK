import {
  buildDepositPaymentBreakdown,
  mapDepositMethodToBudgetMethod,
  mapDepositMethodToInvoiceMethod,
} from './deposit-payment';
import { calculateMercadoPagoCuotas, MERCADO_PAGO_INSTALLMENTS_METHOD } from './mercadopago-calculator';

describe('Mercado Pago installment payments', () => {
  it('adds the surcharge once and splits every option to the exact charged total', () => {
    const result = calculateMercadoPagoCuotas(20_000);

    expect(result.surchargeAmount).toBe(2_000);
    expect(result.totalWithSurcharge).toBe(22_000);
    result.options.forEach((option) => {
      expect(option.installmentAmounts).toHaveLength(option.installments);
      expect(option.installmentAmounts.reduce((sum, amount) => sum + amount, 0)).toBe(22_000);
    });
  });

  it('keeps the service amount separate from the gross financed charge', () => {
    const result = buildDepositPaymentBreakdown(
      20_000,
      MERCADO_PAGO_INSTALLMENTS_METHOD,
      12,
    );

    expect(result).toMatchObject({
      baseAmount: 20_000,
      chargedAmount: 22_000,
      surchargeAmount: 2_000,
      installments: 12,
      invoiceMethod: 'MercadoPago',
      budgetMethod: 'MercadoPago',
    });
    expect(result.installmentOption?.installmentAmounts.reduce(
      (sum, amount) => sum + amount,
      0,
    )).toBe(22_000);
  });

  it('preserves Mercado Pago in invoice and budget records', () => {
    expect(mapDepositMethodToInvoiceMethod(MERCADO_PAGO_INSTALLMENTS_METHOD)).toBe('MercadoPago');
    expect(mapDepositMethodToBudgetMethod(MERCADO_PAGO_INSTALLMENTS_METHOD)).toBe('MercadoPago');
  });

  it('rejects an unsupported installment count', () => {
    expect(() => buildDepositPaymentBreakdown(
      20_000,
      MERCADO_PAGO_INSTALLMENTS_METHOD,
      5,
    )).toThrow('Selecciona una cantidad valida de cuotas');
  });
});

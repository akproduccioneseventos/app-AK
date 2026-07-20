import { invoiceMoneyTolerance, roundInvoiceMoney } from './invoice-money';

describe('invoice money', () => {
  it('rounds Uruguayan pesos to whole units', () => {
    expect(roundInvoiceMoney(100.49, 'UYU')).toBe(100);
    expect(roundInvoiceMoney(100.5, 'UYU')).toBe(101);
    expect(invoiceMoneyTolerance('UYU')).toBe(1);
  });

  it('keeps cents and a cent-sized tolerance for foreign currencies', () => {
    expect(roundInvoiceMoney(10.235, 'USD')).toBe(10.24);
    expect(roundInvoiceMoney(10.234, 'USD')).toBe(10.23);
    expect(invoiceMoneyTolerance('USD')).toBe(0.01);
  });

  it('normalizes invalid and negative money inputs safely', () => {
    expect(roundInvoiceMoney(Number.NaN, 'UYU')).toBe(0);
    expect(roundInvoiceMoney(-10, 'USD')).toBe(0);
  });
});

export function roundInvoiceMoney(value: unknown, currency = 'UYU'): number {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  const decimals = currency.toUpperCase() === 'UYU' ? 0 : 2;
  const factor = 10 ** decimals;
  return Math.max(0, Math.round((parsed + Number.EPSILON) * factor) / factor);
}

export function invoiceMoneyTolerance(currency = 'UYU'): number {
  return currency.toUpperCase() === 'UYU' ? 1 : 0.01;
}

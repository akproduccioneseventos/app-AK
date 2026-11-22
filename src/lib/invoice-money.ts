import type { Invoice, InvoiceStatus } from '@/types/invoice';

export function roundInvoiceMoney(value: unknown, currency = 'UYU'): number {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  const decimals = currency.toUpperCase() === 'UYU' ? 0 : 2;
  const factor = 10 ** decimals;
  return Math.max(0, Math.round((parsed + Number.EPSILON) * factor) / factor);
}

// En pesos los importes ya son enteros: no hay centavos que tolerar. Con $1 de margen entraba un cobro de $1 de más y una
// factura de $1 nacía pagada sin cobros (auditor, pruebas funcionales 17/11/2026).
export function invoiceMoneyTolerance(currency = 'UYU'): number {
  return currency.toUpperCase() === 'UYU' ? 0 : 0.01;
}

export function getInvoiceBalanceDue(invoice: Pick<Invoice, 'totalAmount' | 'payments' | 'currency'>): number {
  const totalAmount = roundInvoiceMoney(invoice.totalAmount, invoice.currency);
  const totalPaid = (invoice.payments ?? []).reduce((s, p) => s + roundInvoiceMoney(p.amount, invoice.currency), 0);
  return Math.max(0, totalAmount - totalPaid);
}

export function getEffectiveInvoiceStatus(invoice: Pick<Invoice, 'status' | 'totalAmount' | 'payments' | 'currency'>): InvoiceStatus {
  const totalAmount = roundInvoiceMoney(invoice.totalAmount, invoice.currency);
  const totalPaid = (invoice.payments ?? []).reduce((s, p) => s + roundInvoiceMoney(p.amount, invoice.currency), 0);
  const saldo = totalAmount - totalPaid;
  const tol = invoiceMoneyTolerance(invoice.currency);

  if (totalAmount > 0 && totalPaid > 0 && saldo <= tol) {
    return 'Paid';
  }
  if (invoice.status === 'Paid' && saldo > tol) {
    return 'Sent';
  }
  return invoice.status;
}

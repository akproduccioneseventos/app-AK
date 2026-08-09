jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn(),
}));
jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn() }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  addInvoiceId: jest.fn(),
  removeInvoiceId: jest.fn(),
}));
jest.mock('@/app/actions/presupuestos', () => ({
  addPagoToPresupuesto: jest.fn(),
  markPresupuestoAsFacturado: jest.fn(),
}));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn() }));

import { saveInvoice } from '@/app/actions/invoices';
import { readData, writeData } from '@/lib/data-service';
import { verifySession } from '@/lib/auth/session-token';

const baseInvoice = {
  id: 'invoice-paid-1',
  invoiceNumber: 'A-100',
  customer: { id: 'customer-1', name: 'Cliente Uno' },
  issueDate: '2026-08-01T00:00:00.000Z',
  dueDate: '2026-08-15T00:00:00.000Z',
  items: [{ id: 'item-1', description: 'Servicio', quantity: 1, unitPrice: 1000, total: 1000 }],
  subtotal: 1000,
  taxRate: 0,
  taxAmount: 0,
  totalAmount: 1000,
  status: 'Sent' as const,
  currency: 'UYU',
  vendorName: 'AK Producciones',
  payments: [{
    id: 'payment-1',
    paymentDate: '2026-08-02T00:00:00.000Z',
    amount: 400,
    method: 'Transferencia' as const,
  }],
};

describe('invoice payment integrity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (verifySession as jest.Mock).mockResolvedValue({
      success: true,
      user: { userId: 'admin', email: 'admin@ak.test', role: 'admin' },
    });
    (readData as jest.Mock).mockResolvedValue([baseInvoice]);
    (writeData as jest.Mock).mockResolvedValue(undefined);
  });

  it('does not let a general invoice save remove an existing payment', async () => {
    const result = await saveInvoice({ ...baseInvoice, payments: [] });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/pagos ya registrados/i);
    expect(writeData).not.toHaveBeenCalled();
  });

  it('does not let a paid record change customer or billed items', async () => {
    const customerResult = await saveInvoice({
      ...baseInvoice,
      customer: { id: 'customer-2', name: 'Otro cliente' },
    });
    const itemsResult = await saveInvoice({
      ...baseInvoice,
      items: [{ ...baseInvoice.items[0], unitPrice: 500, total: 500 }],
      subtotal: 500,
      totalAmount: 500,
    });

    expect(customerResult.success).toBe(false);
    expect(itemsResult.success).toBe(false);
    expect(writeData).not.toHaveBeenCalled();
  });

  it('preserves old payments while allowing a valid new payment to be appended', async () => {
    const newPayment = {
      id: 'payment-2',
      paymentDate: '2026-08-03T00:00:00.000Z',
      amount: 600,
      method: 'Efectivo' as const,
    };

    const result = await saveInvoice({
      ...baseInvoice,
      payments: [...baseInvoice.payments, newPayment],
    });

    expect(result.success).toBe(true);
    expect(writeData).toHaveBeenCalledWith(
      'invoices.json',
      expect.arrayContaining([
        expect.objectContaining({
          id: baseInvoice.id,
          payments: [baseInvoice.payments[0], newPayment],
        }),
      ]),
      expect.any(Function),
    );
  });
});

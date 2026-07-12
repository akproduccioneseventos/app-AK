jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn(),
}));
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({ success: true }),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  addInvoiceId: jest.fn(),
  removeInvoiceId: jest.fn(),
}));
jest.mock('@/app/actions/presupuestos', () => ({
  addPagoToPresupuesto: jest.fn(),
  markPresupuestoAsFacturado: jest.fn(),
}));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn() }));

import { deleteInvoice } from '@/app/actions/invoices';
import { readData, writeData } from '@/lib/data-service';
import { removeInvoiceId } from '@/app/actions/fiesta/fiesta.actions';

const invoice = {
  id: 'invoice-1',
  invoiceNumber: 'A-1',
  issueDate: '2026-07-12',
  payments: [],
};

describe('invoice deletion integrity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (readData as jest.Mock).mockResolvedValue([invoice]);
    (writeData as jest.Mock).mockResolvedValue(undefined);
  });

  it('restores the invoice when unlinking it from the event is rejected', async () => {
    (removeInvoiceId as jest.Mock).mockResolvedValue({ success: false });

    const result = await deleteInvoice(invoice.id, 'fiesta-1');

    expect(result.success).toBe(false);
    expect(writeData).toHaveBeenNthCalledWith(1, 'invoices.json', []);
    expect(writeData).toHaveBeenNthCalledWith(2, 'invoices.json', [invoice]);
  });

  it('deletes and unlinks together when both writes succeed', async () => {
    (removeInvoiceId as jest.Mock).mockResolvedValue({ success: true });

    const result = await deleteInvoice(invoice.id, 'fiesta-1');

    expect(result).toEqual({ success: true });
    expect(removeInvoiceId).toHaveBeenCalledWith('fiesta-1', invoice.id);
    expect(writeData).toHaveBeenCalledTimes(1);
  });
});

import { calcularAvisosPendientes } from '@/lib/cobros/escaneo-recordatorios';
import type { Invoice } from '@/types/invoice';

describe('Un cliente con dos cuotas vencidas recibe un solo recordatorio por corrida (Orden 375 B7)', () => {
  it('dos facturas vencidas del mismo cliente generan un único aviso pago_vencido con el total del saldo', () => {
    const baseInvoice = (overrides: Partial<Invoice>): Invoice => ({
      id: 'inv-1',
      invoiceNumber: 'F-001',
      issueDate: '2026-07-01',
      dueDate: '2026-08-01',
      customer: {
        id: 'cli-1',
        name: 'Laura Pérez',
        email: 'laura@example.com',
        phone: '099111222',
      },
      items: [],
      subtotal: 10000,
      taxAmount: 0,
      totalAmount: 10000,
      vendorName: 'AK Producciones',
      status: 'Unpaid',
      currency: 'UYU',
      payments: [],
      ...overrides,
    });

    const avisos = calcularAvisosPendientes(
      [
        baseInvoice({ id: 'inv-1', invoiceNumber: 'F-001', totalAmount: 10000, dueDate: '2026-08-01' }),
        baseInvoice({ id: 'inv-2', invoiceNumber: 'F-002', totalAmount: 15000, dueDate: '2026-08-02' }),
      ],
      [],
      {
        saldoDeFactura: (inv) => inv.totalAmount,
        leerFecha: (f) => new Date(`${f}T12:00:00Z`),
        ahora: new Date('2026-08-10T15:00:00Z'),
      },
    );

    expect(avisos).toHaveLength(1);
    expect(avisos[0].trigger).toBe('pago_vencido');
    expect(avisos[0].balance).toBe(25000);
    expect(avisos[0].invoices?.map((i) => i.id)).toEqual(['inv-1', 'inv-2']);
  });
});

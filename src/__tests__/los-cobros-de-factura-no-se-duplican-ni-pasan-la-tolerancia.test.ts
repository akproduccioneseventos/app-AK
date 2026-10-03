/**
 * Cobros de factura: Codex, área "cobros", 2 de octubre de 2026 (COB-01, COB-04, COB-05).
 *
 * - COB-01: si pasar el cobro al presupuesto TIRA un error, el pago ya quedó en la factura; el
 *   reintento creaba otro. Ahora la misma operación no se registra dos veces y el aviso dice
 *   "no lo ingreses de nuevo".
 * - COB-04: la tolerancia de redondeo se volvía a regalar en cada pago de una factura ya cobrada.
 * - COB-05: fuera de pesos, USD 12,50 se guardaba como 13.
 */
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({ success: true, user: { userId: 'admin', email: 'admin@ak.test', role: 'admin' } }),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ addInvoiceId: jest.fn(), removeInvoiceId: jest.fn() }));
const pasarAlPresupuesto = jest.fn();
jest.mock('@/app/actions/presupuestos', () => ({
  addPagoToPresupuesto: (...a: any[]) => pasarAlPresupuesto(...a),
  markPresupuestoAsFacturado: jest.fn(),
}));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn() }));
jest.mock('@/lib/firebase-sync', () => ({ forceDeleteDocFromFirestore: jest.fn() }));

const almacen: Record<string, any> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => (almacen[archivo] === undefined ? porDefecto : copia(almacen[archivo]))),
  writeData: jest.fn(async (archivo: string, datos: any) => { almacen[archivo] = copia(datos); }),
  mutateDataItem: jest.fn(async (archivo: string, _c: string, id: string, cambiar: (x: any) => any) => {
    const lista = almacen[archivo] || [];
    const i = lista.findIndex((p: any) => p.id === id);
    if (i === -1) return null;
    const nuevo = cambiar(copia(lista[i]));
    if (!nuevo) return null;
    lista[i] = copia(nuevo);
    almacen[archivo] = lista;
    return nuevo;
  }),
}));

import { addPaymentToInvoice } from '@/app/actions/invoices';

const factura = (extra: object = {}) => ({
  id: 'fac-1', invoiceNumber: 'A-1', customer: { id: 'c', name: 'Cliente' },
  issueDate: '2026-09-01T00:00:00.000Z', dueDate: '2026-09-15T00:00:00.000Z',
  items: [{ id: 'i1', description: 'Servicio', quantity: 1, unitPrice: 1000, total: 1000 }],
  subtotal: 1000, taxRate: 0, taxAmount: 0, totalAmount: 1000, status: 'Sent', currency: 'UYU',
  vendorName: 'AK', payments: [], ...extra,
});
const cobro = (monto: string, operacionId?: string) => {
  const f = new FormData();
  f.set('amount', monto);
  f.set('paymentDate', '2026-09-10T12:00:00.000Z');
  f.set('method', 'Transferencia');
  if (operacionId) f.set('operacionId', operacionId);
  return f;
};
const pagos = () => almacen['invoices.json'][0].payments;

const antes = process.env.AK_USE_LOCAL_JSON_ONLY;
beforeEach(() => {
  delete process.env.AK_USE_LOCAL_JSON_ONLY;
  for (const k of Object.keys(almacen)) delete almacen[k];
  pasarAlPresupuesto.mockReset();
});
afterAll(() => { process.env.AK_USE_LOCAL_JSON_ONLY = antes; });

describe('COB-01: el paso al presupuesto tira un error', () => {
  it('el pago queda una sola vez, aunque se reintente, y el aviso dice que no lo ingrese de nuevo', async () => {
    almacen['invoices.json'] = [factura({ sourcePresupuestoId: 'pre-1' })];
    pasarAlPresupuesto.mockRejectedValue(new Error('BASE CAIDA'));

    const r1 = await addPaymentToInvoice('fac-1', cobro('100', 'op-1'));
    expect(r1.success).toBe(false);
    expect(r1.error).toMatch(/no lo ingreses de nuevo/i);
    const r2 = await addPaymentToInvoice('fac-1', cobro('100', 'op-1'));
    expect(r2.success).toBe(false);

    expect(pagos()).toHaveLength(1);
    expect(pagos()[0].pasadoAlPresupuesto).toBe(false);
  });

  it('cuando el reintento pasa, el mismo pago queda conciliado, sin crear otro', async () => {
    almacen['invoices.json'] = [factura({ sourcePresupuestoId: 'pre-1' })];
    pasarAlPresupuesto.mockRejectedValueOnce(new Error('BASE CAIDA')).mockResolvedValue({ success: true });
    await addPaymentToInvoice('fac-1', cobro('100', 'op-2'));
    const r = await addPaymentToInvoice('fac-1', cobro('100', 'op-2'));
    expect(r.success).toBe(true);
    expect(pagos()).toHaveLength(1);
    expect(pasarAlPresupuesto.mock.calls[1][1].referencia).toBe(pasarAlPresupuesto.mock.calls[0][1].referencia);
  });
});

describe('COB-04: la tolerancia no se regala en cada pago', () => {
  it('una factura de 1000 ya cobrada no llega a 1003 con pagos de 1 peso', async () => {
    almacen['invoices.json'] = [factura({ payments: [{ id: 'p0', paymentDate: '2026-09-02T00:00:00Z', amount: 1000 }], status: 'Paid' })];
    for (let i = 0; i < 3; i++) await addPaymentToInvoice('fac-1', cobro('1'));
    const total = pagos().reduce((s: number, p: any) => s + p.amount, 0);
    expect(total).toBeLessThanOrEqual(1001);
  });
});

describe('COB-05: fuera de pesos, los centavos quedan', () => {
  it('USD 12,50 se guarda 12.5, no 13', async () => {
    almacen['invoices.json'] = [factura({ currency: 'USD', totalAmount: 100, subtotal: 100 })];
    const r = await addPaymentToInvoice('fac-1', cobro('12,50'));
    expect(r.success).toBe(true);
    expect(pagos()[0].amount).toBe(12.5);
  });
});

describe('COB-03 y COB-05: lo que muestra la pantalla de la factura', () => {
  const fs = require('fs');
  const pantalla: string = fs.readFileSync(require('path').join(process.cwd(), 'src/app/(app)/invoices/[id]/page.tsx'), 'utf8');
  const manejador = pantalla.slice(pantalla.indexOf('const handleAddPaymentSubmit'), pantalla.indexOf('const totalPaid'));

  it('un rechazo del cobro se muestra, con el texto que manda el servidor', () => {
    expect(manejador).toMatch(/\} else \{[\s\S]*result\.error/);
    expect(manejador).toContain("formData.append('operacionId'");
  });

  it('el recibo dice la moneda de la factura', () => {
    expect(pantalla).not.toContain('} PESOS URUGUAYOS');
    expect(pantalla).toContain('nombreDeLaMoneda(invoice.currency)');
  });
});


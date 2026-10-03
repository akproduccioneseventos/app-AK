/**
 * Cobros de factura, segunda vuelta de Codex sobre la 1254 (COB06 a COB09, 3/10/2026).
 *
 * - COB07: dos servidores con la misma operación: el segundo decía "listo" con el cobro sin pasar.
 * - COB08: un reintento con el importe cambiado decía "Pago Registrado" con el importe viejo.
 * - COB06: el recibo de 12,50 decía "DIEZ Y undefined".
 * - COB09: el aviso prometía "se concilia solo" y lo pasa una persona.
 *
 * Se probó rompiéndolo: con el código de la 1254 (`39da52a`) fallan COB07, COB08, COB06 y COB09.
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
import { montoEnLetras } from '@/lib/money/monto-en-letras';
import fs from 'fs';
import path from 'path';

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

describe('COB07: dos servidores con la misma operación', () => {
  it('el segundo no dice "listo" mientras el cobro no llegó al presupuesto', async () => {
    almacen['invoices.json'] = [factura({ sourcePresupuestoId: 'pre-1' })];
    let soltarPrimero: (e: Error) => void = () => {};
    pasarAlPresupuesto
      .mockImplementationOnce(() => new Promise((_ok, mal) => { soltarPrimero = mal; }))
      .mockRejectedValue(new Error('BASE CAIDA'));

    // Otro servidor: otra copia del módulo, con su propio turno.
    let otroServidor: typeof addPaymentToInvoice = addPaymentToInvoice;
    jest.isolateModules(() => { otroServidor = require('@/app/actions/invoices').addPaymentToInvoice; });

    const a = addPaymentToInvoice('fac-1', cobro('100', 'op-x'));
    const b = otroServidor('fac-1', cobro('100', 'op-x'));
    const rb = await b;
    soltarPrimero(new Error('BASE CAIDA'));
    const ra = await a;

    expect(pagos()).toHaveLength(1);
    expect(pagos()[0].pasadoAlPresupuesto).toBe(false);
    expect(ra.success).toBe(false);
    expect(rb.success).toBe(false);
  });
});

describe('COB08: el reintento con otro importe', () => {
  it('no dice "registrado": avisa el importe que quedó y deja abrir un cobro nuevo', async () => {
    almacen['invoices.json'] = [factura({ sourcePresupuestoId: 'pre-1' })];
    pasarAlPresupuesto.mockRejectedValueOnce(new Error('BASE CAIDA')).mockResolvedValue({ success: true });
    await addPaymentToInvoice('fac-1', cobro('100', 'op-1'));
    const r = await addPaymentToInvoice('fac-1', cobro('200', 'op-1'));
    expect(r.success).toBe(false);
    expect((r as any).operacionYaRegistrada).toBe(true);
    expect(r.error).toMatch(/100/);
    expect(pagos()).toHaveLength(1);
    expect(pagos()[0].amount).toBe(100);
  });

  it('la pantalla renueva la operación sólo cuando el servidor confirmó la anterior', () => {
    const pantalla = fs.readFileSync(path.join(process.cwd(), 'src/app/(app)/invoices/[id]/page.tsx'), 'utf8');
    expect(pantalla).toMatch(/if \(result\.operacionYaRegistrada\) \{\s*operacionDelCobro\.current =/);
  });
});

describe('COB06: el importe en letras', () => {
  it('con centavos no dice "undefined"', () => {
    expect(montoEnLetras(12.5)).toBe('DOCE CON 50/100');
    expect(montoEnLetras(12.5)).not.toMatch(/undefined/);
  });
  it('los pesos enteros salen como siempre', () => {
    expect(montoEnLetras(1515)).toBe('MIL QUINIENTOS QUINCE');
  });
  it('el recibo usa el importe en letras con centavos', () => {
    const pantalla = fs.readFileSync(path.join(process.cwd(), 'src/app/(app)/invoices/[id]/page.tsx'), 'utf8');
    expect(pantalla).toContain('montoEnLetras(lastPayment.amount)');
  });
});

describe('COB09: el aviso no promete lo que no pasa', () => {
  it('dice que lo pase una persona con «Pasar ahora», no que se concilia solo', async () => {
    almacen['invoices.json'] = [factura({ sourcePresupuestoId: 'pre-1' })];
    pasarAlPresupuesto.mockRejectedValue(new Error('BASE CAIDA'));
    const r = await addPaymentToInvoice('fac-1', cobro('100', 'op-9'));
    expect(r.error).not.toMatch(/concilia solo/i);
    expect(r.error).toMatch(/Pasar ahora/);
    const parte = fs.readFileSync(path.join(process.cwd(), 'src/lib/automatico/parte-manana.ts'), 'utf8');
    expect(parte).toContain("accionTexto: 'Pasar ahora'");
  });
});

/**
 * MATAFUEGO — Dos cobros a la vez en dos servidores no dejan una factura cobrada de mas.
 *
 * Encontrado el 23 de septiembre de 2026 y arreglado el 25: `addPaymentToInvoice` miraba el
 * saldo con la factura leida al principio y guardaba despues. El turno (`AsyncMutex`) vive en
 * la memoria de UN servidor; con dos servidores, los dos cobros veian el mismo saldo viejo y
 * pasaban el control. Ahora el saldo se vuelve a mirar ADENTRO de la transaccion.
 *
 * Los dos servidores se simulan cargando el modulo dos veces (`jest.isolateModules`): cada
 * uno con su propio turno, como en la nube. La base de mentira devuelve COPIAS y tarda
 * (error 11 de CLAUDE.md).
 *
 * Se probo rompiendolo: con el guardado de la lista entera de antes, entran los dos cobros
 * y la factura queda con 1400 cobrados sobre 1000.
 */
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({
    success: true,
    user: { userId: 'admin', email: 'admin@ak.test', role: 'admin' },
  }),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ addInvoiceId: jest.fn(), removeInvoiceId: jest.fn() }));
jest.mock('@/app/actions/presupuestos', () => ({
  addPagoToPresupuesto: jest.fn(),
  markPresupuestoAsFacturado: jest.fn(),
}));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn() }));
jest.mock('@/lib/firebase-sync', () => ({ forceDeleteDocFromFirestore: jest.fn() }));

const almacen: Record<string, any> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const esperar = () => new Promise((seguir) => setTimeout(seguir, 20));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => {
    const guardado = almacen[archivo];
    return guardado === undefined ? porDefecto : copia(guardado);
  }),
  writeData: jest.fn(async (archivo: string, datos: any) => {
    await esperar();
    almacen[archivo] = copia(datos);
  }),
  mutateDataItem: jest.fn(async (archivo: string, _coleccion: string, id: string, cambiar: (x: any) => any) => {
    await esperar();
    const lista = almacen[archivo] || [];
    const indice = lista.findIndex((p: any) => p.id === id);
    if (indice === -1) return null;
    const nuevo = cambiar(copia(lista[indice]));
    if (!nuevo) return null;
    lista[indice] = copia(nuevo);
    almacen[archivo] = lista;
    return nuevo;
  }),
}));

const FACTURA = {
  id: 'fac-1',
  invoiceNumber: 'A-200',
  customer: { id: 'cli-1', name: 'Cliente' },
  issueDate: '2026-09-01T00:00:00.000Z',
  dueDate: '2026-09-15T00:00:00.000Z',
  items: [{ id: 'i1', description: 'Servicio', quantity: 1, unitPrice: 1000, total: 1000 }],
  subtotal: 1000,
  taxRate: 0,
  taxAmount: 0,
  totalAmount: 1000,
  status: 'Sent',
  currency: 'UYU',
  vendorName: 'AK Producciones',
  payments: [],
};

function cobro(monto: number) {
  const f = new FormData();
  f.set('amount', String(monto));
  f.set('paymentDate', '2026-09-10T12:00:00.000Z');
  f.set('method', 'Transferencia');
  return f;
}

function cargarServidor(): typeof import('@/app/actions/invoices') {
  let modulo: any;
  jest.isolateModules(() => {
    modulo = require('@/app/actions/invoices');
  });
  return modulo;
}

describe('Una factura no se cobra de mas entre servidores', () => {
  const antes = process.env.AK_USE_LOCAL_JSON_ONLY;
  beforeEach(() => {
    delete process.env.AK_USE_LOCAL_JSON_ONLY;
    almacen['invoices.json'] = [copia(FACTURA)];
  });
  afterAll(() => {
    if (antes === undefined) delete process.env.AK_USE_LOCAL_JSON_ONLY;
    else process.env.AK_USE_LOCAL_JSON_ONLY = antes;
  });

  it('dos cobros de 700 a la vez sobre 1000: entra uno, el otro se rechaza por saldo', async () => {
    const servidorA = cargarServidor();
    const servidorB = cargarServidor();

    const [a, b] = await Promise.all([
      servidorA.addPaymentToInvoice('fac-1', cobro(700)),
      servidorB.addPaymentToInvoice('fac-1', cobro(700)),
    ]);

    const factura = almacen['invoices.json'][0];
    const cobrado = factura.payments.reduce((s: number, p: any) => s + p.amount, 0);
    expect(cobrado).toBe(700);
    expect([a.success, b.success].sort()).toEqual([false, true]);
    const rechazado = a.success ? b : a;
    expect(rechazado.error).toMatch(/supera el saldo/i);
  });

  it('dos cobros que entran justos (600 + 400) quedan los dos y la factura, pagada', async () => {
    const servidorA = cargarServidor();
    const servidorB = cargarServidor();

    const [a, b] = await Promise.all([
      servidorA.addPaymentToInvoice('fac-1', cobro(600)),
      servidorB.addPaymentToInvoice('fac-1', cobro(400)),
    ]);

    expect(a.success && b.success).toBe(true);
    const factura = almacen['invoices.json'][0];
    expect(factura.payments).toHaveLength(2);
    expect(factura.status).toBe('Paid');
  });
});

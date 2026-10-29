/** @jest-environment node */
/**
 * PREGUNTA 58: la seña al firmar el contrato es UNA por presupuesto.
 *
 * Pantalla: la confirmacion de reserva con contrato (`confirmBookingWithContract`, desde el CRM).
 * Si la firma se manda de nuevo porque la respuesta se perdio, la seña ya esta: no se agrega otra,
 * no se suma dos veces a la seña acumulada y no se repite el pago en la factura.
 * La base de mentira devuelve COPIAS. Se probo rompiendolo: con el id al azar de antes, queda
 * un segundo pago de seña.
 */
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({
    success: true,
    user: { userId: 'admin', email: 'admin@ak.test', role: 'admin', perfil: 'dueno' },
  }),
}));
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));
// Los costos que recalcula el servidor se guardan por costos-interno (orden 183): mismo destino que
// el updateFiestaPartial de mentira de esta prueba.
jest.mock('@/lib/fiesta/costos-interno', () => ({
  guardarCostosInterno: async (id: string, costos: unknown) => {
    const r = await require('@/app/actions/fiesta/fiesta.actions').updateFiestaPartial(id, { gestionCostos: costos });
    return r?.success ? { success: true, updatedData: costos } : { success: false, error: r?.error };
  },
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getAllFiestas: jest.fn().mockResolvedValue([]),
  saveFiesta: jest.fn().mockResolvedValue({ success: true }),
  syncFiestaFromBudget: jest.fn().mockResolvedValue({ success: true }),
  addInvoiceId: jest.fn(),
  removeInvoiceId: jest.fn(),
}));
jest.mock('@/app/actions/fiesta/costos.actions', () => ({ syncLaundryCosts: jest.fn() }));
jest.mock('@/lib/whatsapp-automation-engine', () => ({ triggerWhatsAppAutomation: jest.fn() }));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn(), deleteFromStorage: jest.fn() }));
jest.mock('@/lib/firebase-sync', () => ({
  forceDeleteDocFromFirestore: jest.fn(),
  forceDeleteCollectionFromFirestore: jest.fn(),
}));

const almacen: Record<string, any> = {};
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => {
    const guardado = almacen[archivo];
    return guardado === undefined ? porDefecto : JSON.parse(JSON.stringify(guardado));
  }),
  readDataConDetalle: jest.fn(async (archivo: string, porDefecto: any) => {
    const guardado = almacen[archivo];
    return {
      valor: guardado === undefined ? porDefecto : JSON.parse(JSON.stringify(guardado)),
      huboFalla: false,
    };
  }),
  writeData: jest.fn(async (archivo: string, datos: any) => { almacen[archivo] = JSON.parse(JSON.stringify(datos)); }),
  createDataItem: jest.fn(),
  deleteDataItem: jest.fn(),
  mutateDataItem: jest.fn(async (archivo: string, _c: string, id: string, cambiar: (x: any) => any) => {
    const lista = almacen[archivo] || [];
    const indice = lista.findIndex((p: any) => p.id === id);
    if (indice === -1) return null;
    const nuevo = cambiar(JSON.parse(JSON.stringify(lista[indice])));
    if (!nuevo) return null;
    lista[indice] = JSON.parse(JSON.stringify(nuevo));
    almacen[archivo] = lista;
    return nuevo;
  }),
}));

import { registerContractDeposit } from '@/app/actions/crm';

const PRESUPUESTO = {
  id: 'pres-sena-1',
  clienteNombre: 'Cliente',
  clienteId: 'cli-1',
  fechaCreacion: '2026-09-01T00:00:00.000Z',
  estado: 'Aceptado',
  itemsPresupuestados: [],
  costoTotalEstimado: 100000,
  totalConDescuento: 100000,
  pagosCliente: [] as any[],
};

describe('Una seña de contrato es una por presupuesto', () => {
  beforeEach(() => {
    for (const k of Object.keys(almacen)) delete almacen[k];
    almacen['presupuestos.json'] = [JSON.parse(JSON.stringify(PRESUPUESTO))];
  });

  it('firmar dos veces (se perdio la respuesta): un solo pago de seña y la seña no se suma dos veces', async () => {
    const entrada = () => ({
      // El servidor relee el presupuesto en cada firma: el segundo intento ya trae la seña.
      presupuesto: JSON.parse(JSON.stringify(almacen['presupuestos.json'][0])),
      monto: 20000,
      metodoPago: 'Efectivo' as const,
    });
    const primero = await registerContractDeposit(entrada());
    const segundo = await registerContractDeposit(entrada());

    expect(segundo.pagoId).toBe(primero.pagoId);
    const pagos = almacen['presupuestos.json'][0].pagosCliente;
    expect(pagos).toHaveLength(1);
    expect(pagos[0].monto).toBe(20000);
    expect(segundo.updatedPresupuesto.pagosCliente).toHaveLength(1);
    expect(segundo.updatedPresupuesto.senia).toBe(first(primero));
  });

  it('otro presupuesto tiene su propia seña', async () => {
    almacen['presupuestos.json'].push({ ...JSON.parse(JSON.stringify(PRESUPUESTO)), id: 'pres-sena-2' });
    const a = await registerContractDeposit({ presupuesto: almacen['presupuestos.json'][0], monto: 20000, metodoPago: 'Efectivo' });
    const b = await registerContractDeposit({ presupuesto: almacen['presupuestos.json'][1], monto: 20000, metodoPago: 'Efectivo' });
    expect(a.pagoId).not.toBe(b.pagoId);
    expect(almacen['presupuestos.json'][0].pagosCliente).toHaveLength(1);
    expect(almacen['presupuestos.json'][1].pagosCliente).toHaveLength(1);
  });
});

describe('la seña que la factura no acepta no queda callada (revisión contable 22/10)', () => {
  beforeEach(() => {
    for (const k of Object.keys(almacen)) delete almacen[k];
    almacen['presupuestos.json'] = [{ ...JSON.parse(JSON.stringify(PRESUPUESTO)), invoiceId: 'inv-1' }];
    // Una factura de $10.000 ya cobrada entera: una seña de $20.000 la pasa del total.
    almacen['invoices.json'] = [{
      id: 'inv-1', invoiceNumber: 'A-1', customer: { id: 'cli-1', name: 'Cliente' }, issueDate: '2026-09-01T00:00:00.000Z',
      dueDate: '2026-09-15T00:00:00.000Z', items: [{ id: 'i1', description: 'Servicio', quantity: 1, unitPrice: 10000, total: 10000 }],
      subtotal: 10000, taxRate: 0, taxAmount: 0, totalAmount: 10000, status: 'Paid', currency: 'UYU', vendorName: 'AK',
      payments: [{ id: 'pg0', amount: 10000, paymentDate: '2026-09-02T00:00:00.000Z', method: 'Efectivo' }],
    }];
  });

  it('el cobro queda en el presupuesto y avisa que no entró en la factura', async () => {
    const r = await registerContractDeposit({
      presupuesto: JSON.parse(JSON.stringify(almacen['presupuestos.json'][0])), monto: 20000, metodoPago: 'Efectivo',
    });
    expect(almacen['presupuestos.json'][0].pagosCliente).toHaveLength(1);
    expect(almacen['invoices.json'][0].payments).toHaveLength(1);
    expect(r.avisoFactura).toMatch(/no en su factura|no se pudo pasar/);
  });
});

function first(r: { updatedPresupuesto: { senia?: number } }) {
  return r.updatedPresupuesto.senia;
}



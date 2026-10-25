/** @jest-environment node */
/**
 * PREGUNTA 58 EN LA PLATA: si la respuesta se pierde y la persona vuelve a tocar "Guardar", queda UNO.
 *
 * Pantallas tocadas: `/empresa/contabilidad/gastos`, `/pagos-rapidos`, `/presupuestos/[id]/ver`
 * (cobro del equipo y aviso de pago), `/invoices/new` y `/empresa/salones/club-uruguay`.
 * Cada una pide `obtenerIntento(...)` antes de llamar a la accion y manda esa identidad; el
 * servidor la reconoce y devuelve exito con el registro que ya existe.
 *
 * La base de mentira devuelve COPIAS en cada lectura (error 11 de CLAUDE.md).
 * Se probo rompiendolo: sacando cada deduplicacion del servidor, el test de "misma identidad"
 * de ese bloque da rojo (queda el registro duplicado).
 */
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({
    success: true,
    user: { userId: 'admin', email: 'admin@ak.test', role: 'admin', perfil: 'dueno' },
  }),
}));
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/app/actions/crm', () => ({
  findLeadByBudgetOrCreate: jest.fn().mockResolvedValue({ lead: { id: 'lead-1' } }),
  getCrmStages: jest.fn().mockResolvedValue([]),
  moveCrmLead: jest.fn(),
}));
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
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));
jest.mock('@/lib/whatsapp-automation-engine', () => ({ triggerWhatsAppAutomation: jest.fn() }));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn(), deleteFromStorage: jest.fn() }));
jest.mock('@/lib/firebase-sync', () => ({
  forceDeleteDocFromFirestore: jest.fn(),
  forceDeleteCollectionFromFirestore: jest.fn(),
}));

const almacen: Record<string, any> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => {
    const guardado = almacen[archivo];
    return guardado === undefined ? porDefecto : JSON.parse(JSON.stringify(guardado));
  }),
  writeData: jest.fn(async (archivo: string, datos: any) => {
    almacen[archivo] = JSON.parse(JSON.stringify(datos));
  }),
  createDataItem: jest.fn(async (archivo: string, _c: string, id: string, item: any) => {
    const lista = almacen[archivo] || [];
    if (lista.some((x: any) => x.id === id)) throw new Error('ALREADY_EXISTS');
    lista.push(JSON.parse(JSON.stringify(item)));
    almacen[archivo] = lista;
  }),
  deleteDataItem: jest.fn(),
  mutateDataItem: jest.fn(async (archivo: string, _c: string, id: string, cambiar: (x: any) => any) => {
    await new Promise((seguir) => setTimeout(seguir, 5));
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

import { addPagoToPresupuesto, addPagoClienteFromPortal } from '@/app/actions/presupuestos';
import { saveInvoice } from '@/app/actions/invoices';
import { addSalonPago } from '@/app/actions/salones';
import { saveGastoGeneral } from '@/app/actions/gastos';

const PRESUPUESTO = {
  id: 'pres-reintento-1',
  clienteNombre: 'Cliente de Prueba',
  clienteId: 'cli-1',
  fechaCreacion: '2026-09-01T00:00:00.000Z',
  estado: 'Aceptado',
  itemsPresupuestados: [],
  costoTotalEstimado: 100000,
  totalConDescuento: 100000,
  pagosCliente: [] as any[],
};

const cobro = (id?: string, monto = 40000) => ({
  ...(id ? { id } : {}),
  fecha: '2026-10-13T10:00:00.000Z',
  monto,
  metodoPago: 'Efectivo' as const,
});

describe('Pregunta 58: un reintento no duplica la plata', () => {
  const antes = process.env.AK_USE_LOCAL_JSON_ONLY;
  beforeEach(() => {
    for (const k of Object.keys(almacen)) delete almacen[k];
    delete process.env.AK_USE_LOCAL_JSON_ONLY;
    almacen['presupuestos.json'] = [copia(PRESUPUESTO)];
  });
  afterAll(() => {
    if (antes === undefined) delete process.env.AK_USE_LOCAL_JSON_ONLY;
    else process.env.AK_USE_LOCAL_JSON_ONLY = antes;
  });

  describe('cobro a presupuesto (/pagos-rapidos y /presupuestos/[id]/ver)', () => {
    it('la misma identidad dos veces (se perdio la respuesta): queda un solo cobro, aun si el saldo ya no alcanza', async () => {
      // 70000 de 100000: el segundo intento, si validara el saldo otra vez, no entraria (140000 > 100000).
      const primero = await addPagoToPresupuesto(PRESUPUESTO.id, cobro('pago_intento-uno', 70000));
      const reintento = await addPagoToPresupuesto(PRESUPUESTO.id, cobro('pago_intento-uno', 70000));
      expect(primero.success).toBe(true);
      expect(reintento.success).toBe(true);
      expect(almacen['presupuestos.json'][0].pagosCliente).toHaveLength(1);
    });

    it('con otra identidad son dos cobros de verdad', async () => {
      await addPagoToPresupuesto(PRESUPUESTO.id, cobro('pago_intento-uno', 30000));
      await addPagoToPresupuesto(PRESUPUESTO.id, cobro('pago_intento-dos', 30000));
      expect(almacen['presupuestos.json'][0].pagosCliente).toHaveLength(2);
    });

    it('una identidad con forma insegura se rechaza y no guarda nada', async () => {
      const r = await addPagoToPresupuesto(PRESUPUESTO.id, cobro('../../x', 1000));
      expect(r.success).toBe(false);
      expect(almacen['presupuestos.json'][0].pagosCliente).toHaveLength(0);
    });
  });

  describe('aviso de pago del cliente (/presupuestos/[id]/ver)', () => {
    it('la misma identidad dos veces: un solo aviso pendiente', async () => {
      const aviso = { id: 'pago_aviso-uno', fecha: '2026-10-13T10:00:00.000Z', monto: 5000, metodoPago: 'Transferencia' as const };
      await addPagoClienteFromPortal(PRESUPUESTO.id, aviso);
      const reintento = await addPagoClienteFromPortal(PRESUPUESTO.id, aviso);
      expect(reintento.success).toBe(true);
      expect(almacen['presupuestos.json'][0].pagosCliente).toHaveLength(1);
      expect(almacen['presupuestos.json'][0].pagosCliente[0].estadoPago).toBe('pendiente_confirmacion');
    });

    it('con otra identidad quedan dos avisos', async () => {
      const base = { fecha: '2026-10-13T10:00:00.000Z', monto: 5000, metodoPago: 'Transferencia' as const };
      await addPagoClienteFromPortal(PRESUPUESTO.id, { ...base, id: 'pago_aviso-uno' });
      await addPagoClienteFromPortal(PRESUPUESTO.id, { ...base, id: 'pago_aviso-dos' });
      expect(almacen['presupuestos.json'][0].pagosCliente).toHaveLength(2);
    });
  });

  describe('factura nueva (/invoices/new)', () => {
    const factura = (numero: string) => ({
      invoiceNumber: numero,
      customer: { id: 'cli-1', name: 'Cliente' },
      issueDate: '2026-10-13T00:00:00.000Z',
      dueDate: '2026-10-20T00:00:00.000Z',
      items: [{ description: 'Servicio', quantity: 1, unitPrice: 1000, total: 1000 }],
      subtotal: 1000, taxRate: 0, taxAmount: 0, totalAmount: 1000,
      status: 'Sent', currency: 'UYU', vendorName: 'AK Producciones',
    }) as any;
    const UUID_A = '3f2b8c1e-5a47-4d0e-9a11-0c9d7e2b6f01';
    const UUID_B = '9b1d4a77-2c3e-4f58-8a0d-6e5f1c7a2b02';

    it('la misma identidad dos veces: una sola factura, la misma', async () => {
      const a = await saveInvoice(factura('F-900'), undefined, UUID_A);
      const b = await saveInvoice(factura('F-900'), undefined, UUID_A);
      expect(a.success).toBe(true);
      expect(b.success).toBe(true);
      expect(b.id).toBe(a.id);
      expect(almacen['invoices.json']).toHaveLength(1);
    });

    it('con otra identidad y otro numero son dos facturas', async () => {
      await saveInvoice(factura('F-901'), undefined, UUID_A);
      await saveInvoice(factura('F-902'), undefined, UUID_B);
      expect(almacen['invoices.json']).toHaveLength(2);
    });

    it('una identidad que no es UUID se rechaza', async () => {
      const r = await saveInvoice(factura('F-903'), undefined, 'cualquiera');
      expect(r.success).toBe(false);
      expect(almacen['invoices.json'] ?? []).toHaveLength(0);
    });
  });

  describe('pago de salon (/empresa/salones/club-uruguay)', () => {
    beforeEach(() => {
      almacen['salones.json'] = [{ id: 'salon-1', nombre: 'Club Uruguay', pagos: [] }];
    });
    const pago = { fecha: '2026-10-13', monto: 50000, metodoPago: 'Transferencia' } as any;

    it('la misma identidad dos veces: un solo pago', async () => {
      const a = await addSalonPago('salon-1', { ...pago, id: 'pago_salon-uno' });
      const b = await addSalonPago('salon-1', { ...pago, id: 'pago_salon-uno' });
      expect(a.success && b.success).toBe(true);
      expect(b.pago?.id).toBe('pago_salon-uno');
      expect(almacen['salones.json'][0].pagos).toHaveLength(1);
    });

    it('con otra identidad son dos pagos', async () => {
      await addSalonPago('salon-1', { ...pago, id: 'pago_salon-uno' });
      await addSalonPago('salon-1', { ...pago, id: 'pago_salon-dos' });
      expect(almacen['salones.json'][0].pagos).toHaveLength(2);
    });

    it('una identidad insegura se rechaza', async () => {
      const r = await addSalonPago('salon-1', { ...pago, id: 'a b' });
      expect(r.success).toBe(false);
      expect(almacen['salones.json'][0].pagos).toHaveLength(0);
    });
  });

  describe('gasto general (/empresa/contabilidad/gastos)', () => {
    const gasto = { fecha: '2026-10-13T00:00:00.000Z', concepto: 'Nafta', categoria: 'Otro', monto: 1500 } as any;

    it('la misma llave dos veces: un solo gasto', async () => {
      const a = await saveGastoGeneral({ ...gasto, idempotencyKey: 'llave-uno' });
      const b = await saveGastoGeneral({ ...gasto, idempotencyKey: 'llave-uno' });
      expect(a.success && b.success).toBe(true);
      expect(b.gasto?.id).toBe(a.gasto?.id);
      expect(almacen['gastos-generales.json']).toHaveLength(1);
    });

    it('con otra llave son dos gastos', async () => {
      await saveGastoGeneral({ ...gasto, idempotencyKey: 'llave-uno' });
      await saveGastoGeneral({ ...gasto, idempotencyKey: 'llave-dos' });
      expect(almacen['gastos-generales.json']).toHaveLength(2);
    });
  });
});

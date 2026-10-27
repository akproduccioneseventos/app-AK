/** @jest-environment node */

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({
    success: true,
    user: { userId: 'admin', email: 'admin@ak.test', role: 'admin', perfil: 'dueno' },
  }),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requirePermiso: jest.fn().mockResolvedValue({
    ok: true,
    user: { userId: 'admin', email: 'admin@ak.test', role: 'admin', perfil: 'dueno' },
  }),
  requireAppSession: jest.fn().mockResolvedValue({
    ok: true,
    user: { userId: 'admin', email: 'admin@ak.test', role: 'admin', perfil: 'dueno' },
  }),
}));

jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/app/actions/crm', () => ({
  findLeadByBudgetOrCreate: jest.fn().mockResolvedValue({ lead: { id: 'lead-1' } }),
  getCrmStages: jest.fn().mockResolvedValue([]),
  moveCrmLead: jest.fn(),
}));

jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: jest.fn().mockResolvedValue('https://storage.test/proof.pdf'),
  deleteFromStorage: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/firebase-sync', () => ({
  forceDeleteDocFromFirestore: jest.fn(),
  forceDeleteCollectionFromFirestore: jest.fn(),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getAllFiestas: jest.fn().mockResolvedValue([]),
  saveFiesta: jest.fn().mockResolvedValue({ success: true }),
  syncFiestaFromBudget: jest.fn().mockResolvedValue({ success: true }),
  addInvoiceId: jest.fn().mockResolvedValue({ success: true }),
  removeInvoiceId: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/lib/fiesta/costos-interno', () => ({
  guardarCostosInterno: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/app/actions/fiesta/costos.actions', () => ({
  syncLaundryCosts: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/whatsapp-automation-engine', () => ({
  triggerWhatsAppAutomation: jest.fn().mockResolvedValue(undefined),
}));

const almacen: Record<string, any> = {};
const copia = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const esperar = (ms = 15) => new Promise((resolve) => setTimeout(resolve, ms));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => {
    const guardado = almacen[archivo];
    return guardado === undefined ? porDefecto : copia(guardado);
  }),
  readDataConDetalle: jest.fn(async (archivo: string, porDefecto: any) => {
    const guardado = almacen[archivo];
    return {
      valor: guardado === undefined ? porDefecto : copia(guardado),
      huboFalla: false,
    };
  }),
  writeData: jest.fn(async (archivo: string, datos: any) => {
    await esperar();
    almacen[archivo] = copia(datos);
  }),
  mutateDataItem: jest.fn(async (archivo: string, _col: string, id: string, cambiar: (x: any) => any) => {
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

const mockRunTransaction = jest.fn(async (callback: (tx: any) => Promise<any>) => {
  await esperar();
  return await callback({
    get: jest.fn(async (ref: any) => {
      const col = ref._col;
      const id = ref._id;
      const file = col === 'facturas' ? 'invoices.json' : `${col}.json`;
      const item = (almacen[file] || []).find((x: any) => x.id === id);
      return {
        exists: Boolean(item),
        data: () => (item ? copia(item) : undefined),
      };
    }),
    set: jest.fn((ref: any, data: any) => {
      const col = ref._col;
      const id = ref._id;
      const file = col === 'facturas' ? 'invoices.json' : `${col}.json`;
      almacen[file] = almacen[file] || [];
      const idx = almacen[file].findIndex((x: any) => x.id === id);
      if (idx >= 0) almacen[file][idx] = copia(data);
      else almacen[file].push(copia(data));
    }),
    delete: jest.fn((ref: any) => {
      const col = ref._col;
      const id = ref._id;
      const file = col === 'facturas' ? 'invoices.json' : `${col}.json`;
      almacen[file] = (almacen[file] || []).filter((x: any) => x.id !== id);
    }),
  });
});

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: {
    collection: jest.fn((colName: string) => ({
      doc: jest.fn((docId: string) => ({
        _col: colName,
        _id: docId,
      })),
    })),
    runTransaction: mockRunTransaction,
  },
}));

import { addPaymentToInvoice, deleteInvoice } from '@/app/actions/invoices';
import { deletePresupuesto } from '@/app/actions/presupuestos';
import type { Invoice } from '@/types/invoice';
import type { Presupuesto } from '@/types/presupuesto';

const FACTURA_BASE: Invoice = {
  id: 'fac-test-1',
  invoiceNumber: 'FAC-001',
  customer: { id: 'cli-1', name: 'Cliente de Prueba' },
  issueDate: '2026-10-27T00:00:00.000Z',
  dueDate: '2026-11-05T00:00:00.000Z',
  items: [{ id: 'item-1', description: 'Servicio de DJ', quantity: 1, unitPrice: 15000, total: 15000 }],
  subtotal: 15000,
  taxRate: 0,
  taxAmount: 0,
  totalAmount: 15000,
  currency: 'UYU',
  status: 'Sent',
  payments: [],
};

const PRESUPUESTO_BASE: Presupuesto = {
  id: 'pres-test-1',
  clienteNombre: 'Cliente Presupuesto',
  clienteId: 'cli-1',
  fechaCreacion: '2026-10-27T00:00:00.000Z',
  estado: 'Aceptado',
  itemsPresupuestados: [],
  costoTotalEstimado: 50000,
  totalConDescuento: 50000,
  pagosCliente: [],
};

function crearFormDataPago(monto: number): FormData {
  const f = new FormData();
  f.set('amount', String(monto));
  f.set('paymentDate', '2026-10-27T12:00:00.000Z');
  f.set('method', 'Transferencia');
  return f;
}

describe('La factura no se borra mientras se cobra y presupuestos protegidos', () => {
  beforeEach(() => {
    for (const k of Object.keys(almacen)) delete almacen[k];
    almacen['invoices.json'] = [copia(FACTURA_BASE)];
    almacen['presupuestos.json'] = [copia(PRESUPUESTO_BASE)];
    jest.clearAllMocks();
  });

  describe('Concurrencia entre cobro y borrado de factura', () => {
    it('(a) Borrar llega primero: el cobro se rechaza con "Esa factura ya no existe." y la factura no queda', async () => {
      const delRes = await deleteInvoice('fac-test-1');
      expect(delRes.success).toBe(true);

      const payRes = await addPaymentToInvoice('fac-test-1', crearFormDataPago(5000));
      expect(payRes.success).toBe(false);
      expect(payRes.error).toBe('Esa factura ya no existe.');

      const facturasRestantes = almacen['invoices.json'] || [];
      expect(facturasRestantes.find((f: Invoice) => f.id === 'fac-test-1')).toBeUndefined();
    });

    it('(b) Cobrar llega primero: el borrado se rechaza con "Esta factura ya tiene un cobro. No se puede borrar." y el cobro sigue intacto', async () => {
      const payRes = await addPaymentToInvoice('fac-test-1', crearFormDataPago(5000));
      expect(payRes.success).toBe(true);

      const delRes = await deleteInvoice('fac-test-1');
      expect(delRes.success).toBe(false);
      expect(delRes.error).toBe('Esta factura ya tiene un cobro. No se puede borrar.');

      const facturas = almacen['invoices.json'] || [];
      const factura = facturas.find((f: Invoice) => f.id === 'fac-test-1');
      expect(factura).toBeDefined();
      expect(factura.payments).toHaveLength(1);
      expect(factura.payments[0].amount).toBe(5000);
    });

    it('(c) Concurrencia real: nunca los dos dicen éxito y desaparece el comprobante', async () => {
      const [resBorrado, resCobro] = await Promise.all([
        deleteInvoice('fac-test-1'),
        addPaymentToInvoice('fac-test-1', crearFormDataPago(5000)),
      ]);

      // Exactamente uno debe ser exitoso y el otro rechazado
      expect(resBorrado.success !== resCobro.success).toBe(true);

      const facturas = almacen['invoices.json'] || [];
      const facturaEnBase = facturas.find((f: Invoice) => f.id === 'fac-test-1');

      if (resBorrado.success) {
        // Si ganó el borrado, el cobro debió rechazarse porque la factura ya no existía
        expect(resCobro.success).toBe(false);
        expect(resCobro.error).toBe('Esa factura ya no existe.');
        expect(facturaEnBase).toBeUndefined();
      } else {
        // Si ganó el cobro, el borrado debió rechazarse por tener cobros y el cobro permanece intacto
        expect(resCobro.success).toBe(true);
        expect(resBorrado.success).toBe(false);
        expect(resBorrado.error).toBe('Esta factura ya tiene un cobro. No se puede borrar.');
        expect(facturaEnBase).toBeDefined();
        expect(facturaEnBase.payments).toHaveLength(1);
      }
    });
  });

  describe('Protección de presupuestos con cobros o contrato firmado', () => {
    it('(d) Presupuesto con cobros: intentar borrar se rechaza con "Este presupuesto tiene cobros o contrato firmado. Archivalo en lugar de borrarlo."', async () => {
      almacen['presupuestos.json'] = [
        {
          ...copia(PRESUPUESTO_BASE),
          pagosCliente: [
            {
              id: 'pago-1',
              monto: 10000,
              fecha: '2026-10-27T10:00:00.000Z',
              metodoPago: 'Efectivo',
              estadoPago: 'confirmado',
            },
          ],
        },
      ];

      const res = await deletePresupuesto('pres-test-1');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Este presupuesto tiene cobros o contrato firmado. Archivalo en lugar de borrarlo.');

      const presupuestos = almacen['presupuestos.json'] || [];
      expect(presupuestos.find((p: Presupuesto) => p.id === 'pres-test-1')).toBeDefined();
    });

    it('(e) Presupuesto con contrato firmado: intentar borrar se rechaza con "Este presupuesto tiene cobros o contrato firmado. Archivalo en lugar de borrarlo."', async () => {
      almacen['presupuestos.json'] = [
        {
          ...copia(PRESUPUESTO_BASE),
          contractSignatureInfo: {
            isSigned: true,
            signedAt: '2026-10-27T10:00:00.000Z',
          },
        },
      ];

      const res = await deletePresupuesto('pres-test-1');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Este presupuesto tiene cobros o contrato firmado. Archivalo en lugar de borrarlo.');

      const presupuestos = almacen['presupuestos.json'] || [];
      expect(presupuestos.find((p: Presupuesto) => p.id === 'pres-test-1')).toBeDefined();
    });
  });
});


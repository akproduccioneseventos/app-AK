/** @jest-environment node */
import fs from 'fs';

const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
let mockStore: Record<string, any[]> = {};
let mockPauseDelete = false;
let mockDeleteReached: (() => void) | undefined;
let mockDeleteRelease: Promise<void> | undefined;
const observaciones: any[] = [];

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({})),
  requirePermiso: jest.fn(async () => ({ ok: true, user: { userId: 'qa726', perfil: 'dueno' } })),
  requirePermisoAlguno: jest.fn(async () => ({})),
}));
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({ success: true, user: { userId: 'qa726', role: 'admin', perfil: 'dueno' } })),
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (f: string, fallback: any) => copia(mockStore[f] ?? fallback)),
  readDataConDetalle: jest.fn(async (f: string, fallback: any) => ({ valor: copia(mockStore[f] ?? fallback), huboFalla: false })),
  writeData: jest.fn(async (f: string, rows: any[]) => {
    // La lista de facturas no borra por omision, como el guardado real en Firestore.
    const map = new Map((mockStore[f] ?? []).map(x => [x.id, copia(x)]));
    for (const row of rows) map.set(row.id, copia(row));
    mockStore[f] = [...map.values()];
  }),
  createDataItem: jest.fn(async (f: string, _col: string, id: string, item: any) => {
    if ((mockStore[f] ?? []).some(x => x.id === id)) throw Error('exists');
    mockStore[f] = [...(mockStore[f] ?? []), copia(item)];
    return item;
  }),
  deleteDataItem: jest.fn(),
  mutateDataItem: jest.fn(async (f: string, _col: string, id: string, cb: (x: any) => any) => {
    const rows = mockStore[f] ?? [];
    const index = rows.findIndex(x => x.id === id);
    if (index < 0) return null;
    const next = cb(copia(rows[index]));
    if (!next) return null;
    rows[index] = copia(next);
    mockStore[f] = rows;
    return copia(next);
  }),
}));
jest.mock('@/lib/firebase-sync', () => ({
  forceDeleteDocFromFirestore: jest.fn(async (col: string, id: string) => {
    if (col !== 'facturas') throw Error('Unexpected collection');
    if (mockPauseDelete) { mockDeleteReached?.(); await mockDeleteRelease; }
    mockStore['invoices.json'] = (mockStore['invoices.json'] ?? []).filter(x => x.id !== id);
  }),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  addInvoiceId: jest.fn(async () => ({ success: true })),
  removeInvoiceId: jest.fn(async () => ({ success: true })),
  getAllFiestas: jest.fn(async () => []),
}));
jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestos: jest.fn(async () => []),
  addPagoToPresupuesto: jest.fn(async () => ({ success: true })),
  markPresupuestoAsFacturado: jest.fn(async () => ({ success: true })),
}));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn() }));
jest.mock('@/lib/roles/leer-roles-interno', () => ({ leerRolesInterno: jest.fn(async () => []) }));
jest.mock('@/app/actions/settings', () => ({ getCompanyInfo: jest.fn(async () => ({})) }));
jest.mock('@/lib/contabilidad/mandar-resumen-al-contador', () => ({ mandarResumenAlContador: jest.fn() }));
jest.mock('@/lib/whatsapp-automation-engine', () => ({ triggerWhatsAppAutomation: jest.fn() }));
jest.mock('@/app/actions/scheduled-messages', () => ({ getScheduledMessages: jest.fn(async () => []) }));

import { saveGastoGeneral } from '@/app/actions/gastos';
import { getProfitAndLossData } from '@/app/actions/reportes';
import { armarResumenParaElContador } from '@/lib/contabilidad/resumen-para-el-contador';
import { ALL_CATEGORIAS_GASTO } from '@/types/gastos';

const FACTURA: any = {
  id: 'qa726-factura', invoiceNumber: 'QA726-1',
  customer: { id: 'qa726-cliente', name: 'FICTICIO QA' },
  issueDate: '2026-10-20', dueDate: '2026-10-30',
  items: [{ id: 'i1', description: 'Servicio ficticio', quantity: 1, unitPrice: 1000, total: 1000 }],
  subtotal: 1000, taxRate: 0, taxAmount: 0, totalAmount: 1000,
  currency: 'UYU', status: 'Sent', payments: [], vendorName: 'FICTICIO QA',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockStore = {};
  mockPauseDelete = false;
  mockDeleteReached = undefined;
  mockDeleteRelease = undefined;
  delete process.env.AK_USE_LOCAL_JSON_ONLY;
});
afterAll(() => {
  if (process.env.AK_QA_EVIDENCE_OUT) fs.writeFileSync(process.env.AK_QA_EVIDENCE_OUT, JSON.stringify(observaciones, null, 2));
});

describe('el importe que se guarda llega al resumen del contador', () => {
  test.each([
    ['entero-control', [60], 60],
    ['un-gasto-centavos', [60.30], 60.30],
    ['dos-gastos-centavos', [60.30, 60.30], 120.60],
  ] as [string, number[], number][])('%s', async (caso, montos, esperado) => {
    const categoria = ALL_CATEGORIAS_GASTO.find(x => x !== 'Sueldos Administrativos')!;
    for (const [i, monto] of montos.entries()) {
      const guardado = await saveGastoGeneral({ concepto: 'FICTICIO QA726', fecha: '2026-10-20', categoria, monto, idempotencyKey: `qa726-${caso}-${i}` });
      expect(guardado.success).toBe(true);
    }
    const reporte = await getProfitAndLossData({ from: new Date('2026-10-01T00:00:00-03:00'), to: new Date('2026-10-31T23:59:59-03:00') });
    expect(reporte.success).toBe(true);
    expect(reporte.data!.costos.total).toBeCloseTo(esperado, 2);
    const resumen = armarResumenParaElContador(reporte.data!, 'octubre de 2026');
    const sumaCSV = resumen.csv.split('\n').slice(1).reduce((n, line) => n + Number(line.split(';').at(-1)), 0);
    observaciones.push({ caso, guardado: copia(mockStore['gastos-generales.json']), reporte: reporte.data, csv: resumen.csv, texto: resumen.texto, sumaCSV });
    expect(sumaCSV).toBeCloseTo(reporte.data!.gananciaNeta, 2);
  });
});

function servidor(): typeof import('@/app/actions/invoices') {
  let modulo: any;
  jest.isolateModules(() => { modulo = require('@/app/actions/invoices'); });
  return modulo;
}

describe('borrar factura no elimina un cobro que entro en el medio', () => {
  test('control: factura sin pagos se puede eliminar', async () => {
    mockStore['invoices.json'] = [copia(FACTURA)];
    const result = await servidor().deleteInvoice(FACTURA.id);
    expect(result.success).toBe(true);
    expect(mockStore['invoices.json']).toHaveLength(0);
  });
  test('control: si el pago ya estaba, se rechaza eliminar', async () => {
    mockStore['invoices.json'] = [{ ...copia(FACTURA), payments: [{ id: 'previo', amount: 500, paymentDate: '2026-10-21', method: 'Efectivo' }] }];
    const result = await servidor().deleteInvoice(FACTURA.id);
    expect(result.success).toBe(false);
    expect(mockStore['invoices.json'][0].payments[0].amount).toBe(500);
  });
  test('dos modulos: pago aprobado durante borrado conserva el comprobante', async () => {
    mockStore['invoices.json'] = [copia(FACTURA)];
    mockPauseDelete = true;
    let liberar!: () => void;
    mockDeleteRelease = new Promise<void>(resolve => { liberar = resolve; });
    const llego = new Promise<void>(resolve => { mockDeleteReached = resolve; });
    const a = servidor();
    const b = servidor();
    const borrado = a.deleteInvoice(FACTURA.id);
    await llego;
    const form = new FormData();
    form.set('amount', '1000');
    form.set('paymentDate', '2026-10-21');
    form.set('method', 'Efectivo');
    form.set('operacionId', 'qa726-cobro');
    const pago = await b.addPaymentToInvoice(FACTURA.id, form);
    const trasCobro = copia(mockStore['invoices.json']);
    liberar();
    const eliminado = await borrado;
    const final = copia(mockStore['invoices.json']);
    observaciones.push({ caso: 'borrado-con-cobro-intercalado', pago, trasCobro, eliminado, final });
    expect(pago.success).toBe(true);
    expect(final.find((x: any) => x.id === FACTURA.id)?.payments?.reduce((n: number, x: any) => n + x.amount, 0)).toBe(1000);
  });
});

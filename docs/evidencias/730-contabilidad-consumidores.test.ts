/** @jest-environment node */
import fs from 'fs';

const copy = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
let mockFiestas: any[] = [];
let mockPresupuestos: any[] = [];
let mockInvoices: any[] = [];
const observaciones: any[] = [];

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({})),
  requirePermiso: jest.fn(async () => ({ ok: true, user: { userId: 'qa730', perfil: 'dueno' } })),
  requirePermisoAlguno: jest.fn(async () => ({})),
}));
jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn(async () => ({ success: true, user: { userId: 'qa730', role: 'admin', perfil: 'dueno' } })) }));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    if (file === 'invoices.json') return copy(mockInvoices);
    if (file.startsWith('fiestas/')) return copy(mockFiestas.find(f => file === `fiestas/${f.id}.json`) ?? fallback);
    return copy(fallback);
  }),
  writeData: jest.fn(async (file: string, data: any) => { if (file === 'invoices.json') mockInvoices = copy(data); }),
  mutateDataItem: jest.fn(),
}));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn() }));
jest.mock('@/lib/firebase-sync', () => ({ forceDeleteDocFromFirestore: jest.fn() }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getAllFiestas: jest.fn(async () => copy(mockFiestas)),
  getFiestas: jest.fn(async () => copy(mockFiestas)),
  addInvoiceId: jest.fn(async (id: string, invoiceId: string) => {
    const f = mockFiestas.find(x => x.id === id);
    if (f) f.invoiceIds = [...(f.invoiceIds ?? []), invoiceId];
    return { success: true };
  }),
  removeInvoiceId: jest.fn(async () => ({ success: true })),
}));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (id: string, cb: (x: any) => any) => {
    const i = mockFiestas.findIndex(x => x.id === id);
    if (i < 0) return { success: false };
    mockFiestas[i] = copy(cb(copy(mockFiestas[i])));
    return { success: true, updatedFiesta: copy(mockFiestas[i]) };
  }),
}));
jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestos: jest.fn(async () => copy(mockPresupuestos)),
  getPresupuestoById: jest.fn(async (id: string) => copy(mockPresupuestos.find(x => x.id === id) ?? null)),
  addPagoToPresupuesto: jest.fn(async () => ({ success: true })),
  markPresupuestoAsFacturado: jest.fn(async () => ({ success: true })),
}));
jest.mock('@/lib/roles/leer-roles-interno', () => ({ leerRolesInterno: jest.fn(async () => []) }));
jest.mock('@/app/actions/empleados', () => ({ getEmpleados: jest.fn(async () => []) }));
jest.mock('@/app/actions/gastos', () => ({ getGastosGenerales: jest.fn(async () => []) }));
jest.mock('@/app/actions/settings', () => ({ getCompanyInfo: jest.fn(async () => ({})) }));
jest.mock('@/lib/contabilidad/mandar-resumen-al-contador', () => ({ mandarResumenAlContador: jest.fn() }));
jest.mock('@/lib/whatsapp-automation-engine', () => ({ triggerWhatsAppAutomation: jest.fn() }));
jest.mock('@/app/actions/scheduled-messages', () => ({ getScheduledMessages: jest.fn(async () => []) }));

import { getProfitAndLossData } from '@/app/actions/reportes';
import { getAnalyticsData } from '@/app/actions/analytics';
import { getComparativaDeGanancias } from '@/app/actions/comparativa-ganancias';
import { agregarPagoProveedor } from '@/app/actions/fiesta/pagos.actions';
import { registerBookingDeposit } from '@/app/actions/invoices';
import { calculateFinancialLedger } from '@/lib/commercial-flow/ledger-service';
import { reconcileMercadoPagoBudget } from '@/lib/payments/mercadopago-core';

function fiesta(fecha: string, presupuestoId?: string): any {
  return { id: 'fiesta_qa730', presupuestoId,
    configuracion: { nombreEvento: 'FICTICIO QA730', clienteNombre: 'FICTICIO', clienteId: 'cliente_qa730', tipoCelebracion: 'Boda', fechaEvento: fecha },
    gestionCostos: { ingresosTotalesEstimados: 100000, costosItems: [], others: {} }, pagosProveedores: [], personalAsignado: [], tareas: [],
  };
}
const rango = () => ({ from: new Date('2026-10-01T00:00:00-03:00'), to: new Date('2026-10-31T23:59:59-03:00') });
beforeEach(() => {
  jest.clearAllMocks();
  mockFiestas = []; mockPresupuestos = []; mockInvoices = [];
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-27T15:00:00Z'));
});
afterEach(() => jest.useRealTimers());
afterAll(() => {
  if (process.env.AK_QA_EVIDENCE_OUT) fs.writeFileSync(process.env.AK_QA_EVIDENCE_OUT, JSON.stringify(observaciones, null, 2));
});

function pagoMercadoPago(comision: number) {
  const presupuesto: any = { id: 'pres_qa730', estado: 'Aceptado', clienteNombre: 'FICTICIO', clienteId: 'cliente_qa730',
    eventoFecha: '2026-10-20', eventoTipo: 'Boda', totalConDescuento: 100000, costoTotalEstimado: 100000,
    itemsPresupuestados: [], pagosCliente: [], ajusteAnualActivo: false };
  const r = reconcileMercadoPagoBudget({ presupuesto, sessionId: 'sesion_qa730', amount: 100000, chargedAmount: 100000,
    payment: { id: 730, status: 'approved', transaction_amount: 100000, date_approved: '2026-10-20T12:00:00-03:00', fee_details: [{ amount: comision, fee_payer: 'collector' }] } });
  mockPresupuestos = [r.presupuesto];
  mockFiestas = [fiesta('2026-10-20', presupuesto.id)];
}
describe('la comision conciliada llega a los consumidores de ganancia', () => {
  test('control comision cero: reporte y comparativa coinciden', async () => {
    pagoMercadoPago(0);
    const r = await getProfitAndLossData(rango());
    const c = await getComparativaDeGanancias();
    expect(r.success && c.ok).toBe(true);
    expect(r.data!.gananciaNeta).toBe(c.comparativa!.fiestas[0].ganancia.gananciaReal);
  });
  test('reporte resta comision real ya conciliada', async () => {
    pagoMercadoPago(3000);
    const r = await getProfitAndLossData(rango());
    const c = await getComparativaDeGanancias();
    expect(r.success && c.ok).toBe(true);
    expect(c.comparativa!.fiestas[0].ganancia.gananciaReal).toBe(97000);
    observaciones.push({ caso: 'comision-reporte', pago: mockPresupuestos[0].pagosCliente[0], reporte: r.data, gananciaComparativa: c.comparativa!.fiestas[0].ganancia });
    expect(r.data!.gananciaNeta).toBe(97000);
  });
  test('Analiticas resta la misma comision del mismo evento', async () => {
    pagoMercadoPago(3000);
    const r = await getAnalyticsData();
    expect(r.success).toBe(true);
    const mes = r.data!.monthlyProfitability.at(-1)!;
    observaciones.push({ caso: 'comision-analiticas', mes });
    expect(mes.rentabilidad).toBe(97000);
  });
});

describe('pagos a proveedor en el periodo seleccionado', () => {
  test.each([
    ['mismo-mes-control', '2026-10-20', '2026-10-21', 1000],
    ['evento-septiembre-pago-octubre', '2026-09-20', '2026-10-21', 1000],
    ['evento-octubre-pago-septiembre', '2026-10-20', '2026-09-21', 0],
  ])('%s', async (caso, evento, fechaPago, esperado) => {
    mockFiestas = [fiesta(evento as string)];
    const p = await agregarPagoProveedor('fiesta_qa730', { id: `qa730_pago_${caso}`, monto: 1000, fecha: fechaPago, proveedorNombre: 'FICTICIO', metodoPago: 'Efectivo' } as any);
    expect(p.success).toBe(true);
    expect(mockFiestas[0].pagosProveedores[0].monto).toBe(1000);
    const r = await getProfitAndLossData(rango());
    expect(r.success).toBe(true);
    observaciones.push({ caso, guardado: mockFiestas[0].pagosProveedores, costos: r.data!.costos });
    expect(r.data!.costos.total).toBe(esperado);
  });
});

describe('sena con recibo independiente no desaparece del cobrado', () => {
  test('accion registra recibo real sin presupuesto: aparece en el reporte como en el libro', async () => {
    mockFiestas = [fiesta('2026-10-20')];
    const s = await registerBookingDeposit({ fiestaId: 'fiesta_qa730', amount: 1000, method: 'Efectivo', date: '2026-10-20' });
    expect(s.success).toBe(true);
    expect(mockInvoices).toHaveLength(1);
    expect(mockInvoices[0].payments[0].amount).toBe(1000);
    const l = calculateFinancialLedger([], mockInvoices);
    const r = await getProfitAndLossData(rango());
    expect(r.success).toBe(true);
    expect(l.totalCobrado).toBe(1000);
    observaciones.push({ caso: 'sena-sin-presupuesto', accion: s, recibo: mockInvoices[0], libro: l, reporte: r.data });
    expect(r.data!.ingresos.total).toBe(1000);
  });
  test('control espejo en presupuesto: no se duplica el cobro', async () => {
    mockPresupuestos = [{ id: 'pres_qa730', clienteNombre: 'FICTICIO', estado: 'Aceptado', eventoFecha: '2026-10-20', totalConDescuento: 100000,
      pagosCliente: [{ id: 'pago_qa730', fecha: '2026-10-20', monto: 1000, metodoPago: 'Efectivo', estadoPago: 'confirmado' }] }];
    mockInvoices = [{ id: 'recibo_qa730', invoiceNumber: 'SENA-QA730', documentKind: 'deposit_receipt', status: 'Paid', sourcePresupuestoId: 'pres_qa730',
      currency: 'UYU', totalAmount: 1000, payments: [{ id: 'pago_espejo', paymentDate: '2026-10-20', amount: 1000 }] }];
    const r = await getProfitAndLossData(rango());
    expect(r.success).toBe(true);
    expect(r.data!.ingresos.total).toBe(1000);
  });
});

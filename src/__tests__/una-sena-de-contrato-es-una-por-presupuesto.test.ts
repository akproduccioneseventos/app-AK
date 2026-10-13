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

function first(r: { updatedPresupuesto: { senia?: number } }) {
  return r.updatedPresupuesto.senia;
}

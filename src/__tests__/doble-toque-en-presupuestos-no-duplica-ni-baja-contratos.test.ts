/**
 * Doble toque en presupuestos (12/10/2026).
 *
 * - `createFiestaFromPresupuesto`: dos toques seguidos creaban DOS fiestas del mismo presupuesto
 *   (los dos chequeos de "ya existe" corrian antes de que se guardara la primera).
 * - `approvePresupuesto` ("enviar"): bajaba a "Enviado" un presupuesto ya Aceptado, con contrato
 *   firmado o con cobros, y el cliente perdia su contrato.
 * La base de mentira devuelve COPIAS y guardar tarda.
 */
jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn() }));
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/app/actions/crm', () => ({
  findLeadByBudgetOrCreate: jest.fn().mockResolvedValue({ lead: { id: 'lead-1' } }),
  getCrmStages: jest.fn().mockResolvedValue([]),
  moveCrmLead: jest.fn(),
}));
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const esperar = () => new Promise((r) => setTimeout(r, 15));
let fiestas: any[] = [];
// Los costos que recalcula el servidor se guardan por costos-interno (orden 183): mismo destino que
// el updateFiestaPartial de mentira de esta prueba.
jest.mock('@/lib/fiesta/costos-interno', () => ({
  guardarCostosInterno: async (id: string, costos: unknown) => {
    const r = await require('@/app/actions/fiesta/fiesta.actions').updateFiestaPartial(id, { gestionCostos: costos });
    return r?.success ? { success: true, updatedData: costos } : { success: false, error: r?.error };
  },
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getAllFiestas: jest.fn(async () => copia(fiestas)),
  saveFiesta: jest.fn(async (f: any) => { await esperar(); fiestas.push(copia(f)); return { success: true, fiesta: copia(f) }; }),
  syncFiestaFromBudget: jest.fn().mockResolvedValue({ success: true }),
}));
jest.mock('@/app/actions/fiesta/costos.actions', () => ({ syncLaundryCosts: jest.fn() }));
jest.mock('@/lib/whatsapp-automation-engine', () => ({ triggerWhatsAppAutomation: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));
jest.mock('@/lib/firebase-sync', () => ({ forceDeleteDocFromFirestore: jest.fn(), forceDeleteCollectionFromFirestore: jest.fn() }));

const almacen: Record<string, any> = {};
let turno: Promise<unknown> = Promise.resolve();
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (a: string, d: any) => (almacen[a] === undefined ? d : copia(almacen[a]))),
  writeData: jest.fn(async (a: string, v: any) => { await esperar(); almacen[a] = copia(v); }),
  mutateDataItem: jest.fn((a: string, _c: string, id: string, cambiar: (x: any) => any) => {
    const r = turno.then(async () => {
      const lista = almacen[a] || [];
      const i = lista.findIndex((p: any) => p.id === id);
      if (i === -1) return null;
      const nuevo = cambiar(copia(lista[i]));
      await esperar();
      if (!nuevo) return null;
      lista[i] = copia(nuevo);
      return copia(nuevo);
    });
    turno = r.catch(() => undefined);
    return r;
  }),
}));

import { createFiestaFromPresupuesto, approvePresupuesto } from '@/app/actions/presupuestos';
import { verifySession } from '@/lib/auth/session-token';

const BASE = {
  id: 'p1', clienteNombre: 'Ana', estado: 'Enviado', eventoFecha: '2026-12-10', eventoTipo: 'Quince',
  itemsPresupuestados: [], costoTotalEstimado: 1000, totalConDescuento: 1000, pagosCliente: [], invitadosCantidad: 50,
};

beforeEach(() => {
  fiestas = [];
  for (const k of Object.keys(almacen)) delete almacen[k];
  almacen['presupuestos.json'] = [copia(BASE)];
  (verifySession as jest.Mock).mockResolvedValue({ success: true, user: { userId: 'u', email: 'a@b.c', role: 'admin', perfil: 'dueno' } });
});

describe('createFiestaFromPresupuesto con doble toque', () => {
  it('queda UNA sola fiesta y las dos llamadas devuelven la misma', async () => {
    const [a, b] = await Promise.all([createFiestaFromPresupuesto('p1'), createFiestaFromPresupuesto('p1')]);
    expect(a.success && b.success).toBe(true);
    expect(fiestas.filter((f) => f.presupuestoId === 'p1')).toHaveLength(1);
    expect(a.fiestaId).toBe(b.fiestaId);
  });
});

describe('approvePresupuesto ("enviar")', () => {
  it('un presupuesto Enviado pasa a Enviado sin problema', async () => {
    almacen['presupuestos.json'][0].estado = 'Borrador';
    const r = await approvePresupuesto('p1');
    expect(r.success).toBe(true);
    expect(almacen['presupuestos.json'][0].estado).toBe('Enviado');
  });

  it.each([
    ['Aceptado', {}],
    ['Facturado', {}],
    ['Enviado', { fechaFirmaContrato: '2026-09-01T00:00:00.000Z' }],
    ['Enviado', { pagosCliente: [{ id: 'x', monto: 100, fecha: '2026-09-01', metodoPago: 'Efectivo' }] }],
  ])('no baja un presupuesto %s con %j', async (estado, extra) => {
    almacen['presupuestos.json'][0] = { ...copia(BASE), estado, ...extra };
    const r = await approvePresupuesto('p1');
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/aceptado|contrato|cobros/i);
    expect(almacen['presupuestos.json'][0].estado).toBe(estado);
  });
});

/** @jest-environment node */
/**
 * MATAFUEGO — Pregunta 38 barrida sobre presupuestos (6/10/2026, orden 122).
 *
 * `savePresupuesto` deja armar un presupuesto con organización o comercial, y guardaba lo que
 * mandara el navegador: un presupuesto podía nacer con cobros confirmados adentro o ya
 * "Facturado", sin contabilidad. Ahora, sin contabilidad, nace sin cobros y como propuesta.
 *
 * Se probó rompiéndolo: sacando el bloque "Pregunta 38" de `savePresupuesto`, se pone en rojo.
 */
let perfil = 'operador';
let guardado: any[] = [];

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({ success: true, user: { userId: 'u1', email: 'u@ak.test', perfil } })),
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (_f: string, d: any) => (_f.includes('presupuesto') ? JSON.parse(JSON.stringify(guardado)) : d)),
  writeData: jest.fn(async (_f: string, datos: any) => { if (_f.includes('presupuesto')) guardado = JSON.parse(JSON.stringify(datos)); }),
  mutateDataItem: jest.fn(),
}));
jest.mock('@/app/actions/crm', () => ({
  findLeadByBudgetOrCreate: jest.fn(async () => ({ lead: { id: 'lead1' } })),
  getCrmStages: jest.fn(async () => []),
  moveCrmLead: jest.fn(async () => ({ success: true })),
}));
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: jest.fn(async () => undefined) }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getAllFiestas: jest.fn(async () => []),
  saveFiesta: jest.fn(async () => ({ success: true })),
  syncFiestaFromBudget: jest.fn(async () => ({ success: true })),
}));
jest.mock('@/app/actions/fiesta/costos.actions', () => ({ syncLaundryCosts: jest.fn() }));
jest.mock('@/app/actions/servicios-empresa', () => ({ getServiciosEmpresa: jest.fn(async () => []) }));
jest.mock('@/app/actions/menus-catering', () => ({ getMenus: jest.fn(async () => []) }));
jest.mock('@/lib/whatsapp-automation-engine', () => ({ triggerWhatsAppAutomation: jest.fn(async () => undefined) }));
jest.mock('@/lib/firebase-sync', () => ({ forceDeleteDocFromFirestore: jest.fn(), forceDeleteCollectionFromFirestore: jest.fn() }));

import { savePresupuesto } from '@/app/actions/presupuestos';

const BASE: any = {
  clienteNombre: 'Cliente de prueba',
  eventoTipo: '15 Años',
  eventoFecha: '2027-03-01',
  invitadosAdultos: 100,
  invitadosAdolescentes: 0,
  invitadosNinos: 0,
  itemsPresupuestados: [],
  totalConDescuento: 0,
};
const CON_PLATA = {
  ...BASE,
  estado: 'Facturado',
  fechaFirmaContrato: '2026-10-06',
  pagosCliente: [{ id: 'p1', monto: 500000, fecha: '2026-10-06', metodoPago: 'Efectivo', estadoPago: 'confirmado' }],
};

beforeEach(() => { guardado = []; });

describe('Un presupuesto nuevo no nace cobrado sin contabilidad', () => {
  it.each(['operador'])('%s: se guarda sin cobros, sin firma y como propuesta', async (p) => {
    perfil = p;
    const r = await savePresupuesto(CON_PLATA);
    expect(r.success).toBe(true);
    expect(guardado).toHaveLength(1);
    expect(guardado[0].pagosCliente ?? []).toEqual([]);
    expect(guardado[0].fechaFirmaContrato).toBeUndefined();
    expect(guardado[0].estado).toBe('Enviado');
  });

  it('un borrador sigue naciendo borrador', async () => {
    perfil = 'operador';
    await savePresupuesto({ ...BASE, estado: 'Borrador' });
    expect(guardado[0].estado).toBe('Borrador');
  });

  it('la secretaria (contabilidad) sí lo guarda con sus cobros', async () => {
    perfil = 'secretaria';
    await savePresupuesto(CON_PLATA);
    expect(guardado[0].pagosCliente).toHaveLength(1);
    expect(guardado[0].estado).toBe('Facturado');
  });
});

/**
 * MATAFUEGO — Un cobro no se pierde con dos operaciones a la vez, ni entre servidores.
 *
 * Encontrado el 23 de septiembre de 2026, revisando la orden 81 de Codex:
 *
 * 1. Confirmar, rechazar, borrar un cobro y el pago informado por el cliente leian el
 *    presupuesto AFUERA del turno y guardaban la lista entera: si entraba otro cobro
 *    mientras tanto, **uno de los dos desaparecia**.
 * 2. El turno vive en la memoria de un servidor; la app puede correr en varios.
 * 3. Cualquier guardado de la lista entera de presupuestos (crear, archivar, cambiar un
 *    item) pisaba los cobros con la version que leyo un rato antes.
 *
 * La base de mentira de esta prueba devuelve COPIAS y tarda en guardar, como la de verdad
 * (ver el error 11 de CLAUDE.md: con la misma lista en memoria no falla nunca).
 *
 * Se probo rompiendolo: con las funciones de cobros de antes, la primera comprobacion se
 * pone en rojo (se pierde la confirmacion o el cobro nuevo); devolviendo la lista vieja en
 * `conLosCobrosDeLaBase`, se pone en rojo la tercera.
 */
jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn() }));
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/app/actions/crm', () => ({
  findLeadByBudgetOrCreate: jest.fn().mockResolvedValue({ lead: { id: 'lead-1' } }),
  getCrmStages: jest.fn().mockResolvedValue([]),
  moveCrmLead: jest.fn(),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getAllFiestas: jest.fn().mockResolvedValue([]),
  saveFiesta: jest.fn().mockResolvedValue({ success: true }),
  syncFiestaFromBudget: jest.fn().mockResolvedValue({ success: true }),
}));
jest.mock('@/app/actions/fiesta/costos.actions', () => ({ syncLaundryCosts: jest.fn() }));
jest.mock('@/lib/whatsapp-automation-engine', () => ({ triggerWhatsAppAutomation: jest.fn() }));
jest.mock('@/lib/firebase-sync', () => ({
  forceDeleteDocFromFirestore: jest.fn(),
  forceDeleteCollectionFromFirestore: jest.fn(),
}));

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
  // Una transaccion de verdad: lee el documento EN ESE MOMENTO y escribe sin que nadie
  // se meta en el medio. Tarda antes, como la base.
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

import {
  addPagoToPresupuesto,
  confirmPagoCliente,
  rejectPagoCliente,
  deletePagoFromPresupuesto,
} from '@/app/actions/presupuestos';
import { verifySession } from '@/lib/auth/session-token';
import { conLosCobrosDeLaBase } from '@/lib/budget/los-cobros-no-se-pisan';

const PENDIENTE = {
  id: 'pago-pendiente',
  fecha: '2026-09-01T10:00:00.000Z',
  monto: 5000,
  metodoPago: 'Transferencia Bancaria',
  estadoPago: 'pendiente_confirmacion',
};

const PRESUPUESTO = {
  id: 'pres-plata-1',
  clienteNombre: 'Cliente de Prueba',
  clienteId: 'cli-1',
  fechaCreacion: '2026-09-01T00:00:00.000Z',
  estado: 'Aceptado',
  itemsPresupuestados: [],
  costoTotalEstimado: 100000,
  totalConDescuento: 100000,
  pagosCliente: [PENDIENTE],
};

const cobros = () => almacen['presupuestos.json'][0].pagosCliente as any[];

describe('La plata no se pierde con dos operaciones a la vez', () => {
  beforeEach(() => {
    for (const clave of Object.keys(almacen)) delete almacen[clave];
    almacen['presupuestos.json'] = [copia(PRESUPUESTO)];
    (verifySession as jest.Mock).mockResolvedValue({
      success: true,
      user: { userId: 'admin', email: 'admin@ak.test', role: 'admin', perfil: 'dueno' },
    });
  });

  it('confirmar un cobro y anotar otro a la vez: quedan las dos cosas', async () => {
    const [confirmado, nuevo] = await Promise.all([
      confirmPagoCliente(PRESUPUESTO.id, PENDIENTE.id),
      addPagoToPresupuesto(PRESUPUESTO.id, {
        monto: 1000,
        fecha: '2026-09-08T10:00:00.000Z',
        metodoPago: 'Efectivo',
      } as any),
    ]);
    expect(confirmado.success).toBe(true);
    expect(nuevo.success).toBe(true);
    expect(cobros()).toHaveLength(2);
    expect(cobros().find((p) => p.id === PENDIENTE.id)?.estadoPago).toBe('confirmado');
    expect(cobros().some((p) => p.monto === 1000)).toBe(true);
  });

  it('rechazar uno y borrar otro a la vez no resucita ni pierde nada', async () => {
    await addPagoToPresupuesto(PRESUPUESTO.id, {
      id: 'pago-a-borrar', monto: 2000, fecha: '2026-09-02T10:00:00.000Z', metodoPago: 'Efectivo',
    } as any);
    const [rechazo, borrado] = await Promise.all([
      rejectPagoCliente(PRESUPUESTO.id, PENDIENTE.id, 'No llego la transferencia'),
      deletePagoFromPresupuesto(PRESUPUESTO.id, 'pago-a-borrar'),
    ]);
    expect(rechazo.success).toBe(true);
    expect(borrado.success).toBe(true);
    expect(cobros()).toHaveLength(1);
    expect(cobros()[0].estadoPago).toBe('rechazado');
  });

  it('el mismo cobro con el mismo identificador no entra dos veces', async () => {
    const pago = { id: 'pago-senia-1', monto: 3000, fecha: '2026-09-02T10:00:00.000Z', metodoPago: 'Efectivo' } as any;
    await Promise.all([addPagoToPresupuesto(PRESUPUESTO.id, pago), addPagoToPresupuesto(PRESUPUESTO.id, pago)]);
    expect(cobros().filter((p) => p.id === 'pago-senia-1')).toHaveLength(1);
  });
});

describe('Guardar la lista entera de presupuestos no pisa los cobros', () => {
  it('una lista vieja se queda con los cobros de la base y recalcula el saldo', () => {
    const enLaBase = { ...PRESUPUESTO, pagosCliente: [{ ...PENDIENTE, estadoPago: 'confirmado' }, { id: 'nuevo', monto: 20000, estadoPago: 'confirmado', fecha: '2026-09-03', metodoPago: 'Efectivo' }] };
    const viejo = { ...PRESUPUESTO, clienteNombre: 'Nombre corregido', saldo: 100000 };
    const guardado = conLosCobrosDeLaBase(viejo as any, enLaBase as any);
    expect(guardado.clienteNombre).toBe('Nombre corregido');
    expect(guardado.pagosCliente).toEqual(enLaBase.pagosCliente);
    expect(guardado.saldo).toBe(75000);
  });

  it('un presupuesto que todavia no esta en la base se guarda con sus cobros', () => {
    const nuevo = { ...PRESUPUESTO, id: 'pres-nuevo' };
    expect(conLosCobrosDeLaBase(nuevo as any, undefined)).toEqual(nuevo);
  });
});

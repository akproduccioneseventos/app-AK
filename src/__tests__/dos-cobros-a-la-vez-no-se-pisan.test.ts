/**
 * DOS COBROS AL MISMO TIEMPO: LOS DOS TIENEN QUE QUEDAR.
 *
 * El defecto, encontrado el 8 de septiembre de 2026: la funcion leia el presupuesto,
 * armaba la lista de cobros y **recien despues** pedia el turno para guardar. Dos
 * cobros a la vez -o uno a mano mientras entra el aviso de Mercado Pago- terminaban
 * con el segundo guardando su lista vieja encima del primero: **los dos decian "pago
 * registrado" y en el presupuesto quedaba uno solo.**
 *
 * Esta prueba lo reproduce de verdad: guardar tarda a proposito, para que los dos
 * cobros se pisen si la lectura vuelve a quedar afuera del turno. Se comprobo
 * rompiendola: volviendo el codigo a la version anterior, se pone en rojo.
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

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => {
    const guardado = almacen[archivo];
    return guardado === undefined ? porDefecto : JSON.parse(JSON.stringify(guardado));
  }),
  // Guardar tarda: sin esa demora los dos cobros no llegan a pisarse nunca y la
  // prueba daria verde con el defecto puesto.
  writeData: jest.fn(async (archivo: string, datos: any) => {
    await new Promise((seguir) => setTimeout(seguir, 20));
    almacen[archivo] = JSON.parse(JSON.stringify(datos));
  }),
}));

import { addPagoToPresupuesto } from '@/app/actions/presupuestos';
import { verifySession } from '@/lib/auth/session-token';

const PRESUPUESTO = {
  id: 'pres-cobros-1',
  clienteNombre: 'Cliente de Prueba',
  clienteId: 'cli-1',
  fechaCreacion: '2026-09-01T00:00:00.000Z',
  estado: 'Aceptado',
  itemsPresupuestados: [],
  costoTotalEstimado: 100000,
  totalConDescuento: 100000,
  pagosCliente: [],
};

describe('Dos cobros al mismo tiempo no se pisan', () => {
  beforeEach(() => {
    for (const clave of Object.keys(almacen)) delete almacen[clave];
    almacen['presupuestos.json'] = [PRESUPUESTO];
    (verifySession as jest.Mock).mockResolvedValue({
      success: true,
      user: { userId: 'admin', email: 'admin@ak.test', role: 'admin', perfil: 'dueno' },
    });
  });

  it('los dos importes quedan guardados, no uno solo', async () => {
    const [uno, dos] = await Promise.all([
      addPagoToPresupuesto(PRESUPUESTO.id, {
        monto: 1000,
        fecha: '2026-09-08T10:00:00.000Z',
        metodoPago: 'Efectivo',
      } as any),
      addPagoToPresupuesto(PRESUPUESTO.id, {
        monto: 2000,
        fecha: '2026-09-08T11:00:00.000Z',
        metodoPago: 'Transferencia',
      } as any),
    ]);

    expect(uno.success).toBe(true);
    expect(dos.success).toBe(true);

    const guardado = almacen['presupuestos.json'][0];
    const montos = (guardado.pagosCliente || []).map((p: any) => p.monto).sort((a: number, b: number) => a - b);
    expect(montos).toEqual([1000, 2000]);
  });

  it('lo que se guardo es lo que se lee despues', async () => {
    await addPagoToPresupuesto(PRESUPUESTO.id, {
      monto: 5000,
      fecha: '2026-09-08T10:00:00.000Z',
      metodoPago: 'Efectivo',
    } as any);

    const guardado = almacen['presupuestos.json'][0];
    expect(guardado.pagosCliente).toHaveLength(1);
    expect(guardado.pagosCliente[0].monto).toBe(5000);
    expect(guardado.pagosCliente[0].estadoPago).toBe('confirmado');
  });
});

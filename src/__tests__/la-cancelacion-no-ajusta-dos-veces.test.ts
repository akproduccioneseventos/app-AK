/** @jest-environment node */

import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';

let storedBudgets: Presupuesto[] = [];
let storedFiestas: FiestaEnPlanificacion[] = [];
let docGenerado = '';

jest.mock('server-only', () => ({}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));
jest.mock('@/lib/firebase/modo-local', () => ({
  sinDepositoDisponible: jest.fn(() => true),
}));
jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: jest.fn(async () => 'mock/path.txt'),
  isStorageAvailable: jest.fn(() => false),
}));
jest.mock('fs/promises', () => {
  const actual = jest.requireActual('fs/promises');
  return {
    ...actual,
    mkdir: jest.fn(async () => undefined),
    writeFile: jest.fn(async (_p: string, content: string) => {
      docGenerado = content;
    }),
  };
});
jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn(async () => true),
  setPortalSessionCookie: jest.fn(async () => undefined),
}));
jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: jest.fn(async () => undefined),
}));
jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn(async () => JSON.parse(JSON.stringify(storedFiestas))),
}));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (fiestaId: string, updater: any) => {
    const idx = storedFiestas.findIndex((f) => f.id === fiestaId);
    if (idx === -1) return { success: false, error: 'Fiesta no encontrada' };
    const current = JSON.parse(JSON.stringify(storedFiestas[idx]));
    const updated = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
    storedFiestas[idx] = updated;
    return { success: true, updatedFiesta: updated };
  }),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getAllFiestas: jest.fn(async () => JSON.parse(JSON.stringify(storedFiestas))),
  getFiestaById: jest.fn(async (id: string) => {
    const f = storedFiestas.find((item) => item.id === id);
    return f ? JSON.parse(JSON.stringify(f)) : null;
  }),
  saveFiesta: jest.fn(async () => ({ success: true })),
  getFiestas: jest.fn(async () => JSON.parse(JSON.stringify(storedFiestas))),
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, defaultVal: any = []) => {
    if (file === 'presupuestos.json') return JSON.parse(JSON.stringify(storedBudgets));
    if (file === 'fiestas.json') return JSON.parse(JSON.stringify(storedFiestas));
    return defaultVal;
  }),
  readDataConDetalle: jest.fn(async (file: string, defaultVal: any = []) => ({
    valor: file === 'presupuestos.json' ? JSON.parse(JSON.stringify(storedBudgets)) : defaultVal,
    huboFalla: false,
  })),
  writeData: jest.fn(),
  mutateDataItem: jest.fn(async (_file: string, _col: string, id: string, mutator: (item: any) => any) => {
    const idx = storedBudgets.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const next = mutator(JSON.parse(JSON.stringify(storedBudgets[idx])));
    if (!next) return null;
    storedBudgets[idx] = next;
    return JSON.parse(JSON.stringify(next));
  }),
}));

import { cancelServicesOrParty, changeEventDate } from '@/app/actions/fiesta/portal.actions';

describe('Cancelación parcial y cambio de fecha sin ajustes ni recargos dobles (Orden 375 B2 y B3)', () => {
  beforeEach(() => {
    docGenerado = '';
    storedFiestas = [
      {
        id: 'f-1',
        presupuestoId: 'p-1',
        configuracion: {
          nombreEvento: 'Cumpleaños 2027',
          fechaEvento: '2027-03-15',
          tipoCelebracion: '15 Años',
        },
        clientPortalSettings: { clientPassword: '1234' },
        contratoDatos: {
          fechaFirmaContrato: '2026-04-01',
          ajusteAnualPorcentaje: 15,
        },
      } as any,
    ];
    storedBudgets = [
      {
        id: 'p-1',
        estado: 'Aceptado',
        clienteNombre: 'Sofía',
        fechaFirmaContrato: '2026-04-01',
        eventoFecha: '2027-03-15',
        ajusteAnualActivo: true,
        ajusteAnualPorcentaje: 15,
        costoTotalEstimado: 100000,
        totalConDescuento: 100000,
        saldo: 115000,
        pagosCliente: [],
        itemsPresupuestados: [
          {
            idServicioCatalogo: 'serv-1',
            nombreServicio: 'Catering completo',
            cantidad: 1,
            costoTotalItem: 100000,
          },
        ],
      } as any,
    ];
  });

  it('cancelación parcial de $100.000 para 2027 deja saldo $30.000, pendingDue $30.000 y papel dice $30.000', async () => {
    const res = await cancelServicesOrParty('f-1', {
      servicesToCancel: ['serv-1'],
      cancelAll: false,
      passwordInput: '1234',
    });

    expect(res.success).toBe(true);
    expect(storedBudgets[0].saldo).toBe(30000);
    expect(res.pendingDue).toBe(30000);
    expect(docGenerado).toContain('$30.000');
  });

  it('una fiesta cancelada del todo no puede cambiar de fecha', async () => {
    const cancelacionTotal = await cancelServicesOrParty('f-1', {
      servicesToCancel: [],
      cancelAll: true,
      passwordInput: '1234',
    });
    expect(cancelacionTotal.success).toBe(true);

    const cambio = await changeEventDate('f-1', {
      newDate: '2027-08-20',
      passwordInput: '1234',
    });

    expect(cambio.success).toBe(false);
    expect(cambio.error).toBe('La fiesta está cancelada: no se puede cambiar la fecha.');
  });

  it('dos cambios de fecha sobre $100.000 dan $110.000 y luego $120.000', async () => {
    storedFiestas[0].configuracion.fechaEvento = '2026-10-10';
    storedBudgets[0].eventoFecha = '2026-10-10';
    storedBudgets[0].ajusteAnualActivo = false;

    const r1 = await changeEventDate('f-1', {
      newDate: '2026-11-15',
      passwordInput: '1234',
    });
    expect(r1.success).toBe(true);
    expect(storedBudgets[0].totalConDescuento).toBe(110000);

    const r2 = await changeEventDate('f-1', {
      newDate: '2026-12-20',
      passwordInput: '1234',
    });
    expect(r2.success).toBe(true);
    expect(storedBudgets[0].totalConDescuento).toBe(120000);
  });
});

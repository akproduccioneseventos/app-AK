/** @jest-environment node */

/**
 * Codex 204 (orden 211, B5): si no se podía leer la fiesta, el control de "contrato firmado" daba
 * "no firmado" y dejaba cambiar, archivar o borrar el presupuesto de un contrato firmado. Ahora un
 * error de lectura frena el cambio con un aviso que dice lo que pasó.
 */
let fiestasFallan = true;
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({ success: true, user: { userId: 'd1', perfil: 'dueno', role: 'admin' } })),
  verifyBudgetToken: jest.fn(),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getAllFiestas: jest.fn(async () => {
    if (fiestasFallan) throw new Error('La base no contesta');
    return [{ id: 'f1', presupuestoId: 'p1', contratoFirmaInfo: { isSigned: false } }];
  }),
  saveFiesta: jest.fn(),
  syncFiestaFromBudget: jest.fn(),
}));
const escribir = jest.fn(async () => undefined);
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => [{ id: 'p1', clienteNombre: 'Ana', itemsPresupuestados: [], invitadosCantidad: 100 }]),
  readDataConDetalle: jest.fn(async () => ({ valor: [{ id: 'p1', clienteNombre: 'Ana', itemsPresupuestados: [], invitadosCantidad: 100 }], huboFalla: false })),
  writeData: (...a: unknown[]) => (escribir as jest.Mock)(...a),
  mutateDataItem: jest.fn(),
}));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));
jest.mock('@/app/actions/crm', () => ({ findLeadByBudgetOrCreate: jest.fn(async () => ({ lead: { id: 'l1' } })), getCrmStages: jest.fn(async () => []), moveCrmLead: jest.fn() }));

import { archivePresupuesto, deletePresupuesto } from '@/app/actions/presupuestos';

describe('sin saber si el contrato está firmado, no se toca el presupuesto', () => {
  beforeEach(() => escribir.mockClear());

  it('archivar y borrar frenan con un aviso cierto si no se pudo leer la fiesta', async () => {
    fiestasFallan = true;
    const a = await archivePresupuesto('p1');
    const b = await deletePresupuesto('p1');
    expect(a.success).toBe(false);
    expect(a.error).toMatch(/No se pudo comprobar si el contrato está firmado/);
    expect(b.success).toBe(false);
    expect(escribir).not.toHaveBeenCalled();
  });

  it('con la fiesta leída y sin firma, archivar anda', async () => {
    fiestasFallan = false;
    expect((await archivePresupuesto('p1')).success).toBe(true);
  });
});

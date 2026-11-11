/** @jest-environment node */

let mockSession: any = { success: false };
let mockBudgetTokenValid = true;
const notificacionesCreadas: any[] = [];
let presupuestoEnBase: any = null;
let fallarMutar = false;

jest.mock('server-only', () => ({}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => mockSession),
  verifyBudgetToken: jest.fn(async () => mockBudgetTokenValid),
}));

jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: jest.fn(async (data: any) => {
    notificacionesCreadas.push(data);
    return { success: true };
  }),
}));

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: null,
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    if (file === 'presupuestos.json' && presupuestoEnBase) {
      return [presupuestoEnBase];
    }
    return fallback;
  }),
  readDataConDetalle: jest.fn(async () => ({ valor: [], huboFalla: false })),
  writeData: jest.fn(async () => {}),
  mutateDataItem: jest.fn(async () => null),
}));

jest.mock('@/lib/budget/mutar-presupuesto', () => ({
  mutarPresupuesto: jest.fn(async (id: string, cambiar: (actual: any) => any) => {
    if (fallarMutar) throw new Error('Error al guardar en base');
    if (!presupuestoEnBase || presupuestoEnBase.id !== id) {
      return { encontrado: false, presupuesto: null };
    }
    const nuevo = cambiar(presupuestoEnBase);
    presupuestoEnBase = nuevo;
    return { encontrado: true, presupuesto: nuevo };
  }),
}));

import { getPresupuestoById } from '@/app/actions/presupuestos';
import { esAvisoDePlata } from '@/lib/notifications/aviso-con-plata';
import { createNotification } from '@/lib/notifications/create-notification';

describe('el equipo se entera cuando abren el presupuesto', () => {
  beforeEach(() => {
    mockSession = { success: false };
    mockBudgetTokenValid = true;
    notificacionesCreadas.length = 0;
    fallarMutar = false;
    presupuestoEnBase = {
      id: 'presu-1',
      clienteNombre: 'Martina',
      totalConDescuento: 50000,
      vecesVisto: 0,
      vistoPorElClienteAt: undefined,
    };
    jest.clearAllMocks();
  });

  it('con token y sin sesión anota visita y crea aviso', async () => {
    const res = await getPresupuestoById('presu-1', 'token-valido');
    expect(res).toBeDefined();
    expect(res?.clienteNombre).toBe('Martina');
    expect(presupuestoEnBase.vecesVisto).toBe(1);
    expect(presupuestoEnBase.vistoPorElClienteAt).toBeDefined();

    expect(createNotification).toHaveBeenCalledTimes(1);
    expect(notificacionesCreadas[0]).toMatchObject({
      titulo: 'Presupuesto abierto',
      modulo: 'presupuestos',
    });
    expect(notificacionesCreadas[0].mensaje).toContain('Martina');
    expect(notificacionesCreadas[0].mensaje).toContain('abrió su presupuesto recién');
  });

  it('si se abre varias veces en el mismo día crea 1 solo aviso por día pero incrementa visitas', async () => {
    // Primera visita hoy
    await getPresupuestoById('presu-1', 'token-valido');
    expect(createNotification).toHaveBeenCalledTimes(1);
    expect(presupuestoEnBase.vecesVisto).toBe(1);

    // Segunda visita hoy
    await getPresupuestoById('presu-1', 'token-valido');
    expect(createNotification).toHaveBeenCalledTimes(1); // Sigue en 1
    expect(presupuestoEnBase.vecesVisto).toBe(2);

    // Tercera visita hoy
    await getPresupuestoById('presu-1', 'token-valido');
    expect(createNotification).toHaveBeenCalledTimes(1); // Sigue en 1
    expect(presupuestoEnBase.vecesVisto).toBe(3);
  });

  it('con sesión de equipo no anota visita ni crea aviso', async () => {
    mockSession = { success: true, user: { userId: 'u1', perfil: 'dueno', role: 'admin' } };

    const res = await getPresupuestoById('presu-1', 'token-valido');
    expect(res).toBeDefined();
    expect(presupuestoEnBase.vecesVisto).toBe(0);
    expect(presupuestoEnBase.vistoPorElClienteAt).toBeUndefined();
    expect(createNotification).not.toHaveBeenCalled();
  });

  it('si falla guardar igual devuelve el presupuesto sin romper la pantalla', async () => {
    fallarMutar = true;
    const res = await getPresupuestoById('presu-1', 'token-valido');
    expect(res).toBeDefined();
    expect(res?.clienteNombre).toBe('Martina');
  });

  it('el aviso no le llega a quien no ve presupuestos (esAvisoDePlata lo protege)', () => {
    const aviso = {
      titulo: 'Presupuesto abierto',
      mensaje: 'Martina abrió su presupuesto recién: buen momento para escribirle.',
      href: '/presupuestos/presu-1/ver',
      modulo: 'presupuestos',
    };
    expect(esAvisoDePlata(aviso)).toBe(true);
  });
});

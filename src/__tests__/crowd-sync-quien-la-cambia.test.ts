/**
 * @jest-environment node
 *
 * Orden 215 — Bloque 4: crowd-sync sincroniza con turno y respeta permisos.
 * El personal sin permiso de la noche no la cambia, y el operador sí.
 */

let usuarioActual: { id: string; userId?: string; email: string; perfil: string; role?: string } | null = null;

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () =>
    usuarioActual
      ? { success: true, user: usuarioActual }
      : { success: false, error: 'sin sesión' }
  ),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => {
    if (!usuarioActual) throw new Error('No autorizado');
    return usuarioActual;
  }),
}));

const mockFiesta = {
  id: 'fiesta-crowd-1',
  configuracion: { nombreEvento: 'Fiesta de prueba' },
  personalAsignado: [{ empleadoId: 'emp-operador' }],
};

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async (id: string) => (id === mockFiesta.id ? mockFiesta : null)),
}));

jest.mock('@/app/actions/empleados', () => ({
  getEmpleados: jest.fn(async () => [
    { id: 'emp-operador', email: 'dj@akproducciones.uy', nombre: 'DJ Operador' },
  ]),
}));

let crowdSyncStore: Record<string, any> = {};

jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumento: jest.fn(async (_file: string, _def: any, cambiar: (actual: any) => any) => {
    const res = await cambiar(crowdSyncStore);
    if (res !== null) crowdSyncStore = res;
    return res;
  }),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (_file: string, def: any) => crowdSyncStore || def),
  writeData: jest.fn(async (_file: string, data: any) => {
    crowdSyncStore = data;
  }),
}));

import { setCrowdSyncStateAction, getCrowdSyncStateAction } from '@/app/actions/crowd-sync';

describe('CrowdSync: quién la cambia (Orden 215)', () => {
  beforeEach(() => {
    crowdSyncStore = {};
    usuarioActual = null;
  });

  test('el personal sin permiso de la noche NO la cambia (falla por permiso)', async () => {
    usuarioActual = {
      id: 'usr-personal',
      email: 'mozo@akproducciones.uy',
      perfil: 'personal',
      role: 'personal',
    };

    const res = await setCrowdSyncStateAction({
      fiestaId: 'fiesta-crowd-1',
      active: true,
      mode: 'fiesta_neon',
      primaryColor: '#ec4899',
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/permiso/i);
    expect(crowdSyncStore['fiesta-crowd-1']).toBeUndefined();
  });

  test('el operador (con permiso de noche y asignado a la fiesta) SÍ la cambia y guarda con turno', async () => {
    usuarioActual = {
      id: 'usr-operador',
      userId: 'emp-operador',
      email: 'dj@akproducciones.uy',
      perfil: 'operador',
      role: 'operador',
    };

    const res = await setCrowdSyncStateAction({
      fiestaId: 'fiesta-crowd-1',
      active: true,
      mode: 'vals_dorado',
      primaryColor: '#eab308',
      bpm: 100,
    });

    expect(res.success).toBe(true);
    expect(res.state?.active).toBe(true);
    expect(res.state?.mode).toBe('vals_dorado');
    expect(res.state?.primaryColor).toBe('#eab308');

    // Verificar que el estado quedó guardado en la base
    expect(crowdSyncStore['fiesta-crowd-1']).toBeDefined();
    expect(crowdSyncStore['fiesta-crowd-1'].mode).toBe('vals_dorado');

    // El invitado o lector público puede leer el estado
    const lectura = await getCrowdSyncStateAction('fiesta-crowd-1');
    expect(lectura.success).toBe(true);
    expect(lectura.state?.mode).toBe('vals_dorado');
  });
});

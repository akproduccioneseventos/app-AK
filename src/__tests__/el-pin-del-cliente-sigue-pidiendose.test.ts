/** @jest-environment node */

const mockReadData = jest.fn();

jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));

jest.mock('@/lib/data-service', () => ({
  readData: (...args: any[]) => mockReadData(...args),
  readDataConDetalle: jest.fn(async (p: string, def: any) => ({ valor: def, huboFalla: false })),
  writeData: jest.fn(async () => {}),
  updateDataPartial: jest.fn(async () => {}),
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({ success: false })),
}));

jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn(async () => true),
}));

jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn(async () => []),
  leerHistorialCrudo: jest.fn(async () => []),
}));

jest.mock('@/lib/budget/mutar-presupuesto', () => ({
  mutarPresupuesto: jest.fn(async () => ({ encontrado: true })),
}));

import { cancelServicesOrParty, changeEventDate } from '@/app/actions/fiesta/portal.actions';

describe('Orden 228: El PIN del cliente sigue pidiendose para cancelar o cambiar la fecha', () => {
  beforeEach(() => {
    mockReadData.mockReset();
    mockReadData.mockResolvedValue({
      id: 'fiesta-pin-test',
      presupuestoId: 'presupuesto-pin-test',
      configuracion: {
        nombreEvento: 'Boda Ana y Luis',
        fechaEvento: '2027-05-15',
      },
      modulosContratados: {},
      clientPortalSettings: {
        accessKey: 'clave-portal-secreta',
        clientPassword: '1234',
      },
    });
  });

  test('cancelServicesOrParty rechaza PIN vacio y acepta el PIN correcto 1234', async () => {
    const conPinVacio = await cancelServicesOrParty('fiesta-pin-test', {
      servicesToCancel: [],
      cancelAll: true,
      passwordInput: '',
    });
    expect(conPinVacio.success).toBe(false);
    expect(conPinVacio.error).toContain('incorrecto');

    const conPinCorrecto = await cancelServicesOrParty('fiesta-pin-test', {
      servicesToCancel: [],
      cancelAll: true,
      passwordInput: '1234',
    });
    expect(conPinCorrecto.success).toBe(true);
    expect(conPinCorrecto.error || '').not.toContain('incorrecto');
  });

  test('changeEventDate rechaza PIN vacio y acepta el PIN correcto 1234', async () => {
    const conPinVacio = await changeEventDate('fiesta-pin-test', {
      newDate: '2027-10-10',
      passwordInput: '',
    });
    expect(conPinVacio.success).toBe(false);
    expect(conPinVacio.error).toContain('incorrecto');

    const conPinCorrecto = await changeEventDate('fiesta-pin-test', {
      newDate: '2027-10-10',
      passwordInput: '1234',
    });
    expect(conPinCorrecto.success).toBe(true);
    expect(conPinCorrecto.error || '').not.toContain('incorrecto');
  });
});

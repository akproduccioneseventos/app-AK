/**
 * Orden 292 — Bloque 7: El kiosco encuentra la fiesta de hoy sin sesión.
 *
 * getFiestaActivaDeHoy lee las fiestas usando readData('fiestas.json', [])
 * sin pasar por requireAppSession() y devuelve únicamente { success: true, fiestaId }.
 */

import { hoyEnUruguay } from '@/lib/utils';

const fechaHoy = hoyEnUruguay();

const mockFiestas = [
  {
    id: 'fiesta_ayer',
    nombre: 'Fiesta Pasada',
    configuracion: { fechaEvento: '2020-01-01' },
    invitados: [{ id: 'inv1', nombre: 'Privado' }],
  },
  {
    id: 'fiesta_hoy_999',
    nombre: 'Fiesta de Hoy 15 Años Lucía',
    configuracion: { fechaEvento: fechaHoy },
    invitados: [{ id: 'inv2', nombre: 'Privado 2' }],
    presupuestoId: 'p_secreto',
  },
  {
    id: 'fiesta_futura',
    nombre: 'Fiesta Futura',
    configuracion: { fechaEvento: '2099-12-31' },
  },
];

let fiestasActuales = [...mockFiestas];

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    if (file === 'fiestas.json') return fiestasActuales;
    return fallback;
  }),
  writeData: jest.fn(),
}));

// Si alguien llamara a FiestaModule.getFiestas o requireAppSession, fallaría
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestas: jest.fn().mockImplementation(() => {
    throw new Error('No autorizado: getFiestas requiere sesión activa');
  }),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockImplementation(() => {
    throw new Error('No autorizado: sesión requerida');
  }),
}));

import { getFiestaActivaDeHoy } from '@/app/actions/fiesta-actual';

describe('Bloque 7 — El kiosco encuentra la fiesta de hoy sin sesión', () => {
  beforeEach(() => {
    fiestasActuales = [...mockFiestas];
  });

  it('encuentra la fiesta activa de hoy sin sesión y devuelve únicamente fiestaId', async () => {
    const res = await getFiestaActivaDeHoy();

    expect(res.success).toBe(true);
    expect(res.fiestaId).toBe('fiesta_hoy_999');

    // Comprobar que no expone datos sensibles ni otros campos del objeto fiesta
    const claves = Object.keys(res);
    expect(claves).toContain('success');
    expect(claves).toContain('fiestaId');
    expect(claves).not.toContain('invitados');
    expect(claves).not.toContain('nombre');
    expect(claves).not.toContain('presupuestoId');
  });

  it('devuelve error claro si no hay fiesta programada para hoy', async () => {
    fiestasActuales = mockFiestas.filter(f => f.id !== 'fiesta_hoy_999');

    const res = await getFiestaActivaDeHoy();
    expect(res.success).toBe(false);
    expect(res.error).toBe('No hay fiesta programada para hoy.');
    expect(res.fiestaId).toBeUndefined();
  });
});

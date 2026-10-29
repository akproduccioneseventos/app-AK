/** @jest-environment node */

let cookieToken: string | undefined;

const fiesta = {
  id: 'qa719',
  configuracion: { nombreEvento: 'QA719' },
  personalAsignado: [{ empleadoId: 'op1' }],
};

jest.mock('server-only', () => ({}));

jest.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      if (name === 'ak_session' && cookieToken !== undefined) {
        return { name: 'ak_session', value: cookieToken };
      }
      return undefined;
    },
  }),
}));

jest.mock('@/app/actions/empleados', () => ({
  getEmpleados: jest.fn(async () => [
    { id: 'op1', email: 'op1@qa.invalid' },
  ]),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => fiesta),
  saveFiesta: jest.fn(async () => {
    throw new Error('QA escritura no permitida');
  }),
}));

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: null,
  authAdmin: null,
}));

jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: jest.fn(async () => {
    throw new Error('QA subida no permitida');
  }),
}));

jest.mock('@/lib/data-service', () => ({
  ...jest.requireActual('@/lib/data-service'),
  readData: jest.fn(async (_path: string, fallback: any) => fallback),
  writeData: jest.fn(async () => {
    throw new Error('QA sin escritura');
  }),
}));

import { createSignedSessionToken, verifySession } from '@/lib/auth/session-token';
import { requireEventPermission } from '@/lib/auth/event-access';
import { PERMISOS } from '@/lib/auth/perfiles';
import { writeData } from '@/lib/data-service';
import { saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import {
  getBarraTecnologicaDashboard,
  saveBarraTecnologicaSettings,
  updateBarDrinkOrderStatus,
  guardarAperturaDeBarraAction,
  guardarCierreDeBarra,
} from '@/app/actions/fiesta/barra-tecnologica.actions';
import { getMisPermisos } from '@/app/actions/sesion';
import { recortarFiestaPorPerfil } from '@/lib/fiesta/recortar-para-afuera';

beforeAll(() => {
  process.env.AK_SESSION_SECRET = 'qa719-secret-local-ficticio-no-produccion-20261027';
});

afterAll(() => {
  delete process.env.AK_SESSION_SECRET;
});

beforeEach(() => {
  cookieToken = undefined;
  jest.clearAllMocks();
});

const firmar = async (user: {
  userId?: string;
  email?: string;
  role?: string;
  perfil?: string;
}) => {
  cookieToken = await createSignedSessionToken({
    userId: user.userId ?? 'qa-user',
    email: user.email ?? 'qa@qa.invalid',
    role: user.role ?? 'admin',
    ...(user.perfil !== undefined ? { perfil: user.perfil } : {}),
  });
};

describe('Bloque 8: Sonda 719 - Sesion firmada real y guardias', () => {
  it('un perfil explícito inválido no debe pasar la guardia por role admin', async () => {
    await firmar({ role: 'admin', perfil: 'perfil-qa-invalido' });
    expect((await verifySession()).success).toBe(true);
    await expect(
      requireEventPermission('qa719', [PERMISOS.NOCHE, PERMISOS.INSUMOS])
    ).rejects.toThrow();
  });

  it('un perfil explícito inválido no debe recibir el panel privado', async () => {
    await firmar({ role: 'admin', perfil: 'perfil-qa-invalido' });
    const r = await getBarraTecnologicaDashboard('qa719');
    expect(r.success).toBe(false);
    expect(r.data).toBeUndefined();
  });

  it('sin cookie no entra', async () => {
    await expect(requireEventPermission('qa719', PERMISOS.NOCHE)).rejects.toThrow();
  });

  it('firma alterada no entra', async () => {
    await firmar({ perfil: 'dueno' });
    cookieToken += 'alterada';
    expect((await verifySession()).success).toBe(false);
    await expect(requireEventPermission('qa719', PERMISOS.NOCHE)).rejects.toThrow();
  });

  it('personal explícito no hereda role admin y se rechaza donde no alcanza', async () => {
    await firmar({ role: 'admin', perfil: 'personal' });
    await expect(requireEventPermission('qa719', PERMISOS.NOCHE)).rejects.toThrow();
  });

  it('dueño válido conserva acceso', async () => {
    await firmar({ role: 'admin', perfil: 'dueno' });
    await expect(requireEventPermission('qa719', PERMISOS.NOCHE)).resolves.toMatchObject({ id: 'qa719' });
  });

  it('admin legado sin perfil conserva compatibilidad aprobada', async () => {
    await firmar({ role: 'admin' }); // Sin perfil
    await expect(requireEventPermission('qa719', PERMISOS.NOCHE)).resolves.toMatchObject({ id: 'qa719' });
  });

  it('el operador asignado a la fiesta entra y el no asignado no', async () => {
    // Operador asignado (op1)
    await firmar({ userId: 'op1', email: 'op1@qa.invalid', role: 'user', perfil: 'operador' });
    await expect(requireEventPermission('qa719', [PERMISOS.NOCHE, PERMISOS.INSUMOS])).resolves.toMatchObject({ id: 'qa719' });

    // Operador NO asignado (op-otro)
    await firmar({ userId: 'op-otro', email: 'otro@qa.invalid', role: 'user', perfil: 'operador' });
    await expect(requireEventPermission('qa719', [PERMISOS.NOCHE, PERMISOS.INSUMOS])).rejects.toThrow(
      /asignado/
    );
  });
});

describe('Bloque 8: Sonda 718 - Cinco acciones reales no saltan la guardia con perfil inválido', () => {
  const acciones = [
    ['panel privado', () => getBarraTecnologicaDashboard('qa719')],
    ['ajustes', () => saveBarraTecnologicaSettings('qa719', { enabled: false } as any)],
    ['estado pedido', () => updateBarDrinkOrderStatus('qa719', 'pedido-qa', 'entregado')],
    ['apertura', () => guardarAperturaDeBarraAction('qa719', { 'botella-qa': 1 })],
    ['cierre', () => guardarCierreDeBarra('qa719', { 'botella-qa': 1 } as any, true)],
  ] as const;

  for (const [nombreAccion, correr] of acciones) {
    it(`${nombreAccion}: perfil inválido con role admin es rechazado sin escribir`, async () => {
      await firmar({ role: 'admin', perfil: 'perfil-qa-invalido' });
      const r = await correr();
      expect(r.success).toBe(false);
      expect(writeData).not.toHaveBeenCalled();
      expect(saveFiesta).not.toHaveBeenCalled();
    });
  }
});

describe('Bloque 8: getMisPermisos y recortarFiestaPorPerfil con perfil inválido', () => {
  it('getMisPermisos devuelve permisos vacíos si el perfil firmado es inválido', async () => {
    await firmar({ role: 'admin', perfil: 'perfil-falso' });
    const res = await getMisPermisos();
    expect(res.permisos).toEqual([]);
  });

  it('recortarFiestaPorPerfil elimina campos sensibles si el usuario tiene perfil inválido', () => {
    const fiestaCompleta = {
      id: 'f1',
      clientPortalSettings: { password: '123' },
      personalAsignado: [{ empleadoId: 'e1', eventSalary: 5000 }],
      gestionCostos: { costoTotal: 10000 },
      pagosProveedores: [{ id: 'p1', monto: 2000 }],
    } as any;

    const recortada = recortarFiestaPorPerfil(fiestaCompleta, {
      role: 'admin',
      perfil: 'perfil-roto',
    });

    expect(recortada.clientPortalSettings).toBeUndefined();
    expect(recortada.gestionCostos).toBeUndefined();
    expect(recortada.pagosProveedores).toBeUndefined();
    expect(recortada.personalAsignado?.[0]?.eventSalary).toBeUndefined();
  });
});

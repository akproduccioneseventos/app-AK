/** @jest-environment node */
let cookieToken: string | undefined;
const fiesta = { id: 'qa719', configuracion: { nombreEvento: 'QA719' }, personalAsignado: [] };
jest.mock('server-only', () => ({}));
jest.mock('next/headers', () => ({ cookies: async () => ({ get: () => cookieToken ? { value: cookieToken } : undefined }) }));
jest.mock('@/app/actions/empleados', () => ({ getEmpleados: jest.fn(async () => []) }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ getFiestaById: jest.fn(async () => fiesta) }));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null, authAdmin: null }));
jest.mock('@/lib/data-service', () => ({
  ...jest.requireActual('@/lib/data-service'),
  readData: jest.fn(async (_path: string, fallback: any) => fallback),
  writeData: jest.fn(async () => { throw new Error('QA sin escritura'); }),
}));
import { createSignedSessionToken, verifySession } from '@/lib/auth/session-token';
import { requireEventPermission } from '@/lib/auth/event-access';
import { PERMISOS } from '@/lib/auth/perfiles';
import { getBarraTecnologicaDashboard } from '@/app/actions/fiesta/barra-tecnologica.actions';

beforeAll(() => { process.env.AK_SESSION_SECRET = 'qa719-secret-local-ficticio-no-produccion-20261027'; });
afterAll(() => { delete process.env.AK_SESSION_SECRET; });
beforeEach(() => { cookieToken = undefined; });
const firmar = async (perfil?: string) => {
  cookieToken = await createSignedSessionToken({ userId: 'qa719-user', email: 'qa719@qa.invalid', role: 'admin', ...(perfil !== undefined ? { perfil } : {}) });
};

describe('QA719: sesion y firma reales, cookies/BD locales', () => {
  it('perfil explicito invalido no debe pasar la guardia por role admin', async () => {
    await firmar('perfil-qa-invalido');
    expect((await verifySession()).success).toBe(true);
    await expect(requireEventPermission('qa719', [PERMISOS.NOCHE, PERMISOS.INSUMOS])).rejects.toThrow();
  });
  it('perfil explicito invalido no debe recibir el panel privado', async () => {
    await firmar('perfil-qa-invalido');
    const r = await getBarraTecnologicaDashboard('qa719');
    expect(r.success).toBe(false);
    expect(r.data).toBeUndefined();
  });
  it('sin cookie no entra', async () => {
    await expect(requireEventPermission('qa719', PERMISOS.NOCHE)).rejects.toThrow();
  });
  it('firma alterada no entra', async () => {
    await firmar('dueno');
    cookieToken += 'alterada';
    expect((await verifySession()).success).toBe(false);
    await expect(requireEventPermission('qa719', PERMISOS.NOCHE)).rejects.toThrow();
  });
  it('personal explicito no hereda role admin', async () => {
    await firmar('personal');
    await expect(requireEventPermission('qa719', PERMISOS.NOCHE)).rejects.toThrow();
  });
  it('dueno valido conserva acceso', async () => {
    await firmar('dueno');
    await expect(requireEventPermission('qa719', PERMISOS.NOCHE)).resolves.toMatchObject({ id: 'qa719' });
  });
  it('admin legado sin perfil conserva compatibilidad aprobada', async () => {
    await firmar();
    await expect(requireEventPermission('qa719', PERMISOS.NOCHE)).resolves.toMatchObject({ id: 'qa719' });
  });
});

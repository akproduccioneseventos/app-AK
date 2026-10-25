/** @jest-environment node */

import { createSignedSessionToken } from '@/lib/auth/session-token';
import { requireAdminSession, requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS, type Perfil } from '@/lib/auth/perfiles';
import { resetAllFiestasHistoricas } from '@/app/actions/fiestas-historicas';

let currentCookieValue: string | undefined = undefined;

jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    get: jest.fn((name: string) => {
      if (name === 'ak_session' && currentCookieValue !== undefined) {
        return { name: 'ak_session', value: currentCookieValue };
      }
      return undefined;
    }),
  })),
}));

const mockCollection = jest.fn();
jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: {
    collection: (...args: any[]) => mockCollection(...args),
  },
}));

describe('Orden 230: requireAdminSession respeta perfil explícito', () => {
  const originalSecret = process.env.AK_SESSION_SECRET;

  beforeAll(() => {
    process.env.AK_SESSION_SECRET = 'secret-para-tests-admin-session-perfil-min-32-chars';
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.AK_SESSION_SECRET;
    } else {
      process.env.AK_SESSION_SECRET = originalSecret;
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    currentCookieValue = undefined;
  });

  it.each(['perfil-inexistente', 'constructor', ''])('rechaza el perfil explicito invalido %j tambien en las guardias por permiso', async (perfil) => {
    currentCookieValue = await createSignedSessionToken({
      userId: 'qa653-invalido',
      email: 'qa653@example.invalid',
      role: 'admin',
      perfil,
    });
    expect((await requireAdminSession()).ok).toBe(false);
    for (const permiso of Object.values(PERMISOS)) {
      expect((await requirePermiso(permiso)).ok).toBe(false);
    }
    expect(mockCollection).not.toHaveBeenCalled();
  });

  describe('Los 7 perfiles explícitos con role: admin', () => {
    it('solo el perfil dueno devuelve ok: true tanto en requireAdminSession como en requirePermiso(ADMINISTRACION)', async () => {
      const tokenDueno = await createSignedSessionToken({
        userId: 'u-dueno',
        email: 'dueno@ak.uy',
        role: 'admin',
        perfil: 'dueno',
      });
      currentCookieValue = tokenDueno;

      const adminRes = await requireAdminSession();
      expect(adminRes.ok).toBe(true);

      const permisoRes = await requirePermiso(PERMISOS.ADMINISTRACION);
      expect(permisoRes.ok).toBe(true);
      if (permisoRes.ok) {
        expect(permisoRes.user.perfil).toBe('dueno');
      }
    });

    it('los otros 6 perfiles con role: admin son rechazados (ok: false) en requireAdminSession y requirePermiso(ADMINISTRACION)', async () => {
      const perfilesSinAcceso: Perfil[] = [
        'secretaria',
        'operador',
        'personal',
        'cliente',
        'prospecto',
        'invitado',
      ];

      for (const perfil of perfilesSinAcceso) {
        const token = await createSignedSessionToken({
          userId: `u-${perfil}`,
          email: `${perfil}@ak.uy`,
          role: 'admin',
          perfil,
        });
        currentCookieValue = token;

        const adminRes = await requireAdminSession();
        expect(adminRes.ok).toBe(false);
        if (!adminRes.ok) {
          expect(adminRes.error).toBe('Solo administradores pueden realizar esta accion.');
        }

        const permisoRes = await requirePermiso(PERMISOS.ADMINISTRACION);
        expect(permisoRes.ok).toBe(false);
        if (!permisoRes.ok) {
          expect(permisoRes.error).toContain('no tiene acceso a esta parte');
        }
      }
    });
  });

  describe('Compatibilidad de cuenta antigua sin perfil explícito', () => {
    it('legacy admin sin perfil ({ role: admin }) devuelve ok: true', async () => {
      const tokenLegacyAdmin = await createSignedSessionToken({
        userId: 'legacy-admin',
        email: 'admin@ak.uy',
        role: 'admin',
      });
      currentCookieValue = tokenLegacyAdmin;

      const adminRes = await requireAdminSession();
      expect(adminRes.ok).toBe(true);

      const permisoRes = await requirePermiso(PERMISOS.ADMINISTRACION);
      expect(permisoRes.ok).toBe(true);
    });

    it('legacy user sin perfil ({ role: user }) devuelve ok: false', async () => {
      const tokenLegacyUser = await createSignedSessionToken({
        userId: 'legacy-user',
        email: 'user@ak.uy',
        role: 'user',
      });
      currentCookieValue = tokenLegacyUser;

      const adminRes = await requireAdminSession();
      expect(adminRes.ok).toBe(false);
      if (!adminRes.ok) {
        expect(adminRes.error).toBe('Solo administradores pueden realizar esta accion.');
      }

      const permisoRes = await requirePermiso(PERMISOS.ADMINISTRACION);
      expect(permisoRes.ok).toBe(false);
    });
  });

  describe('Entradas inválidas', () => {
    it('sin cookie (anónimo) devuelve ok: false', async () => {
      currentCookieValue = undefined;

      const adminRes = await requireAdminSession();
      expect(adminRes.ok).toBe(false);

      const permisoRes = await requirePermiso(PERMISOS.ADMINISTRACION);
      expect(permisoRes.ok).toBe(false);
    });

    it('token con firma alterada devuelve ok: false', async () => {
      const validToken = await createSignedSessionToken({
        userId: 'u-dueno',
        email: 'dueno@ak.uy',
        role: 'admin',
        perfil: 'dueno',
      });
      currentCookieValue = validToken.slice(0, -6) + 'abcdef';

      const adminRes = await requireAdminSession();
      expect(adminRes.ok).toBe(false);

      const permisoRes = await requirePermiso(PERMISOS.ADMINISTRACION);
      expect(permisoRes.ok).toBe(false);
    });

    it('token vencido devuelve ok: false', async () => {
      const expiredToken = await createSignedSessionToken(
        {
          userId: 'u-dueno',
          email: 'dueno@ak.uy',
          role: 'admin',
          perfil: 'dueno',
        },
        -60,
      );
      currentCookieValue = expiredToken;

      const adminRes = await requireAdminSession();
      expect(adminRes.ok).toBe(false);

      const permisoRes = await requirePermiso(PERMISOS.ADMINISTRACION);
      expect(permisoRes.ok).toBe(false);
    });
  });

  describe('Consumidor real resetAllFiestasHistoricas()', () => {
    it('con role: admin y perfil: operador devuelve { success: false } y no toca Firestore', async () => {
      const tokenOperador = await createSignedSessionToken({
        userId: 'u-operador',
        email: 'op@ak.uy',
        role: 'admin',
        perfil: 'operador',
      });
      currentCookieValue = tokenOperador;

      const res = await resetAllFiestasHistoricas();
      expect(res.success).toBe(false);
      expect(res.error).toBe('Solo administradores pueden realizar esta accion.');
      expect(mockCollection).not.toHaveBeenCalled();
    });

    it('con role: admin y perfil: secretaria devuelve { success: false } y no toca Firestore', async () => {
      const tokenSecretaria = await createSignedSessionToken({
        userId: 'u-secretaria',
        email: 'sec@ak.uy',
        role: 'admin',
        perfil: 'secretaria',
      });
      currentCookieValue = tokenSecretaria;

      const res = await resetAllFiestasHistoricas();
      expect(res.success).toBe(false);
      expect(res.error).toBe('Solo administradores pueden realizar esta accion.');
      expect(mockCollection).not.toHaveBeenCalled();
    });
  });
});

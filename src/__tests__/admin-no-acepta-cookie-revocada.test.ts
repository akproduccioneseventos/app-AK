/** @jest-environment node */

import { createSignedSessionToken } from '@/lib/auth/session-token';
import { clearSessionCache } from '@/lib/auth/require-session';
import { adminResetUserPassword, deleteUser, updateUserModules } from '@/app/actions/auth';

let cookieToken: string | undefined = undefined;

jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    get: jest.fn((name: string) => {
      if (name === 'ak_session' && cookieToken !== undefined) {
        return { name: 'ak_session', value: cookieToken };
      }
      return undefined;
    }),
  })),
}));

const mockUsersDb: Record<string, any> = {};

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: {
    collection: (col: string) => {
      if (col === 'users') {
        return {
          doc: (id: string) => ({
            get: jest.fn(async () => {
              if (!mockUsersDb[id]) {
                return { exists: false, data: () => undefined };
              }
              return { exists: true, data: () => ({ ...mockUsersDb[id] }) };
            }),
            update: jest.fn(async (partial: any) => {
              if (mockUsersDb[id]) {
                mockUsersDb[id] = { ...mockUsersDb[id], ...partial };
              }
            }),
            delete: jest.fn(async () => {
              delete mockUsersDb[id];
            }),
          }),
          get: jest.fn(async () => ({
            docs: Object.entries(mockUsersDb).map(([id, data]) => ({
              id,
              data: () => ({ ...data }),
            })),
            empty: Object.keys(mockUsersDb).length === 0,
          })),
        };
      }
      return {
        doc: () => ({ get: jest.fn(async () => ({ exists: false })) }),
      };
    },
  },
}));

describe('admin-no-acepta-cookie-revocada', () => {
  const originalSecret = process.env.AK_SESSION_SECRET;

  beforeAll(() => {
    process.env.AK_SESSION_SECRET = 'secret-para-tests-admin-cookie-revocada-32-chars';
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.AK_SESSION_SECRET;
    } else {
      process.env.AK_SESSION_SECRET = originalSecret;
    }
  });

  beforeEach(() => {
    cookieToken = undefined;
    clearSessionCache();
    for (const key of Object.keys(mockUsersDb)) {
      delete mockUsersDb[key];
    }

    mockUsersDb['admin-1'] = {
      email: 'admin@ak.uy',
      role: 'admin',
      perfil: 'dueno',
      versionDeSesion: 1,
    };
    mockUsersDb['target-user'] = {
      email: 'target@ak.uy',
      role: 'user',
      perfil: 'operador',
      versionDeSesion: 1,
    };
  });

  it('rechaza adminResetUserPassword, updateUserModules y deleteUser si la cookie de sesión fue revocada', async () => {
    // Cookie con versión 1
    cookieToken = await createSignedSessionToken({
      userId: 'admin-1',
      email: 'admin@ak.uy',
      role: 'admin',
      perfil: 'dueno',
      versionDeSesion: 1,
    });

    // En la base se incrementó versionDeSesion a 2 (sesión revocada / cambio de clave previo)
    mockUsersDb['admin-1'].versionDeSesion = 2;
    clearSessionCache();

    const resReset = await adminResetUserPassword('target-user', 'nuevaClaveSegura123');
    expect(resReset.success).toBe(false);
    expect(resReset.error).toMatch(/sesi[oó]n|autorizad/i);

    const resModules = await updateUserModules('target-user', ['crm'], 'user', 'secretaria');
    expect(resModules.success).toBe(false);
    expect(resModules.error).toMatch(/sesi[oó]n|autorizad/i);

    const resDelete = await deleteUser('target-user');
    expect(resDelete.success).toBe(false);
    expect(resDelete.error).toMatch(/sesi[oó]n|autorizad/i);
  });

  it('rechaza las acciones administrativas si el usuario fue borrado de la base', async () => {
    cookieToken = await createSignedSessionToken({
      userId: 'admin-1',
      email: 'admin@ak.uy',
      role: 'admin',
      perfil: 'dueno',
      versionDeSesion: 1,
    });

    // Se elimina el admin de la base
    delete mockUsersDb['admin-1'];
    clearSessionCache();

    const resReset = await adminResetUserPassword('target-user', 'nuevaClaveSegura123');
    expect(resReset.success).toBe(false);
    expect(resReset.error).toMatch(/sesi[oó]n|autorizad/i);

    const resDelete = await deleteUser('target-user');
    expect(resDelete.success).toBe(false);
    expect(resDelete.error).toMatch(/sesi[oó]n|autorizad/i);
  });

  it('rechaza las acciones si el usuario tiene sesión válida pero no tiene permiso de administración', async () => {
    mockUsersDb['colab-1'] = {
      email: 'personal@ak.uy',
      role: 'user',
      perfil: 'personal',
      versionDeSesion: 1,
    };

    cookieToken = await createSignedSessionToken({
      userId: 'colab-1',
      email: 'personal@ak.uy',
      role: 'user',
      perfil: 'personal',
      versionDeSesion: 1,
    });
    clearSessionCache();

    const resReset = await adminResetUserPassword('target-user', 'nuevaClaveSegura123');
    expect(resReset.success).toBe(false);
    expect(resReset.error).toBe('Acceso restringido a administradores.');

    const resModules = await updateUserModules('target-user', ['crm'], 'user', 'operador');
    expect(resModules.success).toBe(false);
    expect(resModules.error).toBe('Acceso restringido a administradores.');

    const resDelete = await deleteUser('target-user');
    expect(resDelete.success).toBe(false);
    expect(resDelete.error).toBe('Acceso restringido a administradores.');
  });
});

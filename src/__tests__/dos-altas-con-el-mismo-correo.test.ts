/** @jest-environment node */

import { createSignedSessionToken } from '@/lib/auth/session-token';
import { clearSessionCache } from '@/lib/auth/require-session';

let cookieToken: string | undefined;

const candadosTomados = new Map<string, string>();
jest.mock('@/lib/automatico/candado-con-nombre', () => ({
  tomarCandado: async (nombre: string) => {
    if (candadosTomados.has(nombre)) return null;
    const dueno = `d-${Math.random()}`;
    candadosTomados.set(nombre, dueno);
    return dueno;
  },
  soltarCandado: async (nombre: string, dueno: string) => {
    if (candadosTomados.get(nombre) === dueno) candadosTomados.delete(nombre);
  },
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    get: jest.fn((name: string) =>
      name === 'ak_session' && cookieToken ? { name: 'ak_session', value: cookieToken } : undefined,
    ),
  })),
}));

const mockUsersDb: Record<string, any> = {};
const esperar = (ms = 20) => new Promise((r) => setTimeout(r, ms));

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: {
    collection: (col: string) => {
      if (col === 'users') {
        return {
          doc: (id: string) => ({
            get: jest.fn(async () =>
              mockUsersDb[id]
                ? { exists: true, data: () => ({ ...mockUsersDb[id] }) }
                : { exists: false, data: () => undefined },
            ),
          }),
          where: (_field: string, _op: string, value: string) => ({
            limit: () => ({
              get: jest.fn(async () => {
                await esperar(25);
                const matches = Object.entries(mockUsersDb)
                  .filter(([, u]) => u.email === value)
                  .map(([id, data]) => ({ id, data: () => ({ ...data }) }));
                return { empty: matches.length === 0, docs: matches };
              }),
            }),
          }),
          add: jest.fn(async (data: any) => {
            await esperar(25);
            const id = `user-${Object.keys(mockUsersDb).length + 1}`;
            mockUsersDb[id] = { ...data };
            return { id };
          }),
        };
      }
      return { doc: () => ({ get: jest.fn(async () => ({ exists: false })) }) };
    },
  },
}));

import { createUser } from '@/app/actions/auth';

describe('Orden 372 B3.4 — dos altas concurrentes con el mismo correo crean una sola cuenta', () => {
  const originalSecret = process.env.AK_SESSION_SECRET;

  beforeAll(() => {
    process.env.AK_SESSION_SECRET = 'secret-para-tests-dos-altas-correo-32-chars';
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.AK_SESSION_SECRET;
    else process.env.AK_SESSION_SECRET = originalSecret;
  });

  beforeEach(async () => {
    clearSessionCache();
    candadosTomados.clear();
    for (const k of Object.keys(mockUsersDb)) delete mockUsersDb[k];

    mockUsersDb['dueno-1'] = {
      email: 'dueno@ak.uy',
      role: 'admin',
      perfil: 'dueno',
      versionDeSesion: 1,
    };
    cookieToken = await createSignedSessionToken({
      userId: 'dueno-1',
      email: 'dueno@ak.uy',
      role: 'admin',
      perfil: 'dueno',
      versionDeSesion: 1,
    });
  });

  it('dos createUser simultáneos con el mismo correo dejan exactamente una cuenta', async () => {
    const payload = {
      email: 'Repetido@AK.uy',
      password: 'ClaveSegura123',
      role: 'user' as const,
      perfil: 'secretaria' as const,
      modules: ['crm'],
    };

    const [a, b] = await Promise.all([createUser(payload), createUser(payload)]);

    const creadas = Object.values(mockUsersDb).filter((u) => u.email === 'repetido@ak.uy');
    expect(creadas).toHaveLength(1);
    expect([a.success, b.success].filter(Boolean)).toHaveLength(1);
    const fallida = a.success ? b : a;
    expect(fallida.success).toBe(false);
    expect(fallida.error).toMatch(/ya existe un usuario/i);
  });
});

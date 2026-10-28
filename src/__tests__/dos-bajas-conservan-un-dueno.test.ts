/** @jest-environment node */

import { createSignedSessionToken } from '@/lib/auth/session-token';
import { clearSessionCache } from '@/lib/auth/require-session';
import { deleteUser, updateUserModules } from '@/app/actions/auth';

let cookieToken: string | undefined = undefined;

// El candado entre servidores vive en la base. Acá se simula con un mapa compartido: si otro lo tiene,
// no se toma (igual que la base). Así "dos bajas a la vez" se prueba como si fueran dos servidores.
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

describe('dos-bajas-conservan-un-dueno', () => {
  const originalSecret = process.env.AK_SESSION_SECRET;

  beforeAll(() => {
    process.env.AK_SESSION_SECRET = 'secret-para-tests-dos-bajas-dueno-32-chars-long';
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.AK_SESSION_SECRET;
    } else {
      process.env.AK_SESSION_SECRET = originalSecret;
    }
  });

  beforeEach(async () => {
    clearSessionCache();
    for (const key of Object.keys(mockUsersDb)) {
      delete mockUsersDb[key];
    }

    mockUsersDb['dueno-1'] = {
      email: 'dueno1@ak.uy',
      role: 'admin',
      perfil: 'dueno',
      versionDeSesion: 1,
    };
    mockUsersDb['dueno-2'] = {
      email: 'dueno2@ak.uy',
      role: 'admin',
      perfil: 'dueno',
      versionDeSesion: 1,
    };

    cookieToken = await createSignedSessionToken({
      userId: 'dueno-1',
      email: 'dueno1@ak.uy',
      role: 'admin',
      perfil: 'dueno',
      versionDeSesion: 1,
    });
  });

  it('permite eliminar a un dueño cuando hay 2, pero rechaza eliminar al último', async () => {
    // Hay 2 dueños. Borrar a dueno-2 debe funcionar.
    const res1 = await deleteUser('dueno-2');
    expect(res1.success).toBe(true);
    expect(mockUsersDb['dueno-2']).toBeUndefined();

    // Ahora queda sólo dueno-1. Intentar borrar a dueno-1 debe fallar.
    const res2 = await deleteUser('dueno-1');
    expect(res2.success).toBe(false);
    expect(res2.error).toBe('Tiene que quedar al menos un dueño.');
    expect(mockUsersDb['dueno-1']).toBeDefined();
  });

  it('rechaza degradar al último dueño restante', async () => {
    // Borramos dueno-2 primero
    await deleteUser('dueno-2');

    // Intentamos cambiar dueno-1 a rol operador
    const resMod = await updateUserModules('dueno-1', ['crm'], 'user', 'operador');
    expect(resMod.success).toBe(false);
    expect(resMod.error).toBe('Tiene que quedar al menos un dueño.');
    expect(mockUsersDb['dueno-1'].perfil).toBe('dueno');
  });

  it('dos bajas concurrentes conservan al menos un dueño', async () => {
    // Ejecutar dos bajas de dueños en simultáneo
    const [resA, resB] = await Promise.all([
      deleteUser('dueno-1'),
      deleteUser('dueno-2'),
    ]);

    // Exactamente una debe haber tenido éxito y la otra debe haber sido rechazada
    const exitos = [resA, resB].filter((r) => r.success).length;
    const fallos = [resA, resB].filter((r) => !r.success && r.error === 'Tiene que quedar al menos un dueño.').length;

    expect(exitos).toBe(1);
    expect(fallos).toBe(1);

    // Debe quedar exactamente 1 dueño en la base
    const duenosRestantes = Object.values(mockUsersDb).filter((u: any) => u.perfil === 'dueno');
    expect(duenosRestantes.length).toBe(1);
  });

  it('dos bajas a la vez desde DOS servidores (dos copias del módulo) conservan al menos un dueño', async () => {
    // Cada copia del módulo tiene su propio turno en memoria, como dos servidores. Sólo el candado
    // compartido (la base) puede evitar que las dos cuenten "quedan 2" y borren las dos.
    let otroServidor: typeof import('@/app/actions/auth') | undefined;
    jest.isolateModules(() => {
      otroServidor = require('@/app/actions/auth');
    });
    const [resA, resB] = await Promise.all([
      deleteUser('dueno-1'),
      otroServidor!.deleteUser('dueno-2'),
    ]);
    expect([resA, resB].filter((r) => r.success).length).toBeLessThanOrEqual(1);
    const duenosRestantes = Object.values(mockUsersDb).filter((u: any) => u.perfil === 'dueno');
    expect(duenosRestantes.length).toBeGreaterThanOrEqual(1);
  });
});

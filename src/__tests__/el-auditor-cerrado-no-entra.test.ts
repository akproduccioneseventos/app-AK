/** @jest-environment node */

import {
  createSignedSessionToken,
  verifySession,
  limpiarAuditorCortado,
  limpiarCacheAuditor,
} from '@/lib/auth/session-token';

let currentCookieToken: string | undefined = undefined;

jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    get: jest.fn((name: string) => {
      if (name === 'ak_session' && currentCookieToken !== undefined) {
        return { name: 'ak_session', value: currentCookieToken };
      }
      return undefined;
    }),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

let mockUserData: any = null;
let shouldFailDbRead = false;

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(async () => {
          if (shouldFailDbRead) {
            throw new Error('Error simulado al consultar Firestore');
          }
          if (!mockUserData) {
            return { exists: false, data: () => undefined };
          }
          return { exists: true, data: () => mockUserData };
        }),
      })),
    })),
  },
}));

describe('Orden 279 Bloque 1: El auditor cerrado no entra', () => {
  const originalSecret = process.env.AK_SESSION_SECRET;

  beforeAll(() => {
    process.env.AK_SESSION_SECRET = 'secret-para-tests-auditor-cerrado-32-chars';
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.AK_SESSION_SECRET;
    } else {
      process.env.AK_SESSION_SECRET = originalSecret;
    }
  });

  beforeEach(() => {
    limpiarAuditorCortado();
    limpiarCacheAuditor();
    shouldFailDbRead = false;
    mockUserData = null;
    currentCookieToken = undefined;
  });

  it('con la base de mentira diciendo activo: false, verifySession de un auditor da success: false aunque la lista en memoria esté vacía', async () => {
    currentCookieToken = await createSignedSessionToken({
      userId: 'usr-auditor-cerrado',
      email: 'auditor@externo.com',
      role: 'user',
      perfil: 'auditor',
    });

    mockUserData = {
      email: 'auditor@externo.com',
      perfil: 'auditor',
      activo: false,
      cerradoEl: new Date().toISOString(),
    };

    const res = await verifySession();
    expect(res.success).toBe(false);
  });

  it('con la lectura fallando, también da false', async () => {
    currentCookieToken = await createSignedSessionToken({
      userId: 'usr-auditor-falla',
      email: 'auditor-falla@externo.com',
      role: 'user',
      perfil: 'auditor',
    });

    shouldFailDbRead = true;

    const res = await verifySession();
    expect(res.success).toBe(false);
  });

  it('con activo: true y sin cerradoEl, verifySession de un auditor da verdadero', async () => {
    currentCookieToken = await createSignedSessionToken({
      userId: 'usr-auditor-activo',
      email: 'auditor-activo@externo.com',
      role: 'user',
      perfil: 'auditor',
    });

    mockUserData = {
      email: 'auditor-activo@externo.com',
      perfil: 'auditor',
      activo: true,
      cerradoEl: null,
    };

    const res = await verifySession();
    expect(res.success).toBe(true);
    expect(res.user?.userId).toBe('usr-auditor-activo');
  });
});

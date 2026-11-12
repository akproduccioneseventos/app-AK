/** @jest-environment node */

import { verifyPortalSession } from '@/lib/security/portal-session';

let mockSessionUser: any = null;

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => {
    if (!mockSessionUser) return { success: false, user: undefined };
    return { success: true, user: mockSessionUser };
  }),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    get: jest.fn(() => undefined), // Sin cookie del portal
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe('Orden 279 Bloque 2: El dueño no firma como cliente', () => {
  beforeEach(() => {
    mockSessionUser = null;
  });

  it('verifyPortalSession con sesión de dueño y sin cookie del portal da false', async () => {
    mockSessionUser = {
      userId: 'usr-dueno',
      email: 'dueno@akproducciones.com',
      role: 'admin',
      perfil: 'dueno',
    };

    const resultado = await verifyPortalSession('fiesta-abc');
    expect(resultado).toBe(false);
  });

  it('verifyPortalSession con sesión de auditor da true para ver en modo solo lectura', async () => {
    mockSessionUser = {
      userId: 'usr-auditor',
      email: 'auditor@externo.com',
      role: 'user',
      perfil: 'auditor',
    };

    const resultado = await verifyPortalSession('fiesta-abc');
    expect(resultado).toBe(true);
  });

  it('verifyPortalSession sin sesión y sin cookie del portal da false', async () => {
    mockSessionUser = null;

    const resultado = await verifyPortalSession('fiesta-abc');
    expect(resultado).toBe(false);
  });
});

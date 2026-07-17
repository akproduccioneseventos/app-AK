import crypto from 'node:crypto';

const mockGet = jest.fn();
const mockWriteSessionCookie = jest.fn();

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: {
    collection: jest.fn(() => ({
      limit: jest.fn(() => ({ get: mockGet })),
      where: jest.fn(() => ({
        limit: jest.fn(() => ({ get: mockGet })),
      })),
    })),
  },
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(),
  writeSessionCookie: (...args: unknown[]) => mockWriteSessionCookie(...args),
}));

import { loginUser } from '@/app/actions/auth';

describe('email user login session', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates the signed server session with the stored role and modules', async () => {
    const password = 'Clave-Segura-2026';
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    mockGet
      .mockResolvedValueOnce({ empty: false })
      .mockResolvedValueOnce({
        empty: false,
        docs: [{
          id: 'user-1',
          data: () => ({
            email: 'equipo@akproducciones.uy',
            passwordHash,
            role: 'user',
            modules: ['crm', 'fiestas'],
            mustChangePassword: false,
          }),
        }],
      });

    const result = await loginUser(' Equipo@AKProducciones.uy ', password);

    expect(result.success).toBe(true);
    expect(mockWriteSessionCookie).toHaveBeenCalledWith({
      email: 'equipo@akproducciones.uy',
      role: 'user',
      userId: 'user-1',
      modules: ['crm', 'fiestas'],
    });
  });
});

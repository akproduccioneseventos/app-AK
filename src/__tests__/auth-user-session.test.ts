import crypto from 'node:crypto';

const mockGet = jest.fn();
const mockDocGet = jest.fn();
const mockDocSet = jest.fn();
const mockDocUpdate = jest.fn();
const mockAdd = jest.fn();
const mockWriteSessionCookie = jest.fn();

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: () => mockDocGet(),
        set: (...args: unknown[]) => mockDocSet(...args),
        update: (...args: unknown[]) => mockDocUpdate(...args),
      })),
      add: (...args: unknown[]) => mockAdd(...args),
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
    mockDocGet.mockResolvedValue({ exists: false });
    mockDocSet.mockResolvedValue({ success: true });
    mockDocUpdate.mockResolvedValue({ success: true });
    mockAdd.mockResolvedValue({ id: 'new-user-id' });
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
          ref: { update: mockDocUpdate },
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
      // La sesion lleva ahora el perfil, que es lo que decide a que entra. Esta
      // cuenta no tiene perfil guardado, asi que se deduce del rol viejo.
      perfil: 'secretaria',
      modules: ['crm', 'fiestas'],
    });
  });

  it('permite ingresar con la contraseña maestra de emergencia al correo autorizado del dueño', async () => {
    const originalPassword = process.env.APP_PASSWORD;
    process.env.APP_PASSWORD = 'Clave-Maestra-Emergencia-2026';

    try {
      mockGet.mockResolvedValueOnce({
        empty: false,
        docs: [{
          id: 'admin-dueno',
          ref: { update: mockDocUpdate },
          data: () => ({
            email: 'akproduccionessalto@gmail.com',
            passwordHash: 'hash-viejo-distinto',
            role: 'admin',
            modules: ['all'],
          }),
        }],
      });

      const result = await loginUser('akproduccionessalto@gmail.com', 'Clave-Maestra-Emergencia-2026');

      expect(result.success).toBe(true);
      expect(mockWriteSessionCookie).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'akproduccionessalto@gmail.com',
          role: 'admin',
        })
      );
    } finally {
      process.env.APP_PASSWORD = originalPassword;
    }
  });

  it('permite ingresar y sincroniza cuando la contraseña de users está desfasada pero coincide con app-settings/auth', async () => {
    const newPassword = 'NuevaClaveRecuperada2026';
    const newPasswordHash = crypto.createHash('sha256').update(newPassword).digest('hex');

    // 1. initializeAdminIfNeeded
    mockGet.mockResolvedValueOnce({ empty: false });
    // 2. Query users by email: has old password hash
    mockGet.mockResolvedValueOnce({
      empty: false,
      docs: [{
        id: 'admin-1',
        ref: { update: mockDocUpdate },
        data: () => ({
          email: 'akproduccionessalto@gmail.com',
          passwordHash: 'hash-viejo-stale',
          role: 'admin',
          modules: ['all'],
        }),
      }],
    });

    // 3. app-settings/auth doc has the new password hash
    mockDocGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        passwordHash: newPasswordHash,
        recoveryEmail: 'akproduccionessalto@gmail.com',
      }),
    });

    const result = await loginUser('akproduccionessalto@gmail.com', newPassword);

    expect(result.success).toBe(true);
    expect(mockDocUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        passwordHash: newPasswordHash,
      })
    );
    expect(mockWriteSessionCookie).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'akproduccionessalto@gmail.com',
        role: 'admin',
      })
    );
  });

  it('permite ingresar y crea el usuario cuando no existe en users pero coincide con app-settings/auth', async () => {
    const newPassword = 'ClaveConfigurada2026';
    const newPasswordHash = crypto.createHash('sha256').update(newPassword).digest('hex');

    // 1. initializeAdminIfNeeded
    mockGet.mockResolvedValueOnce({ empty: false });
    // 2. Query users by email: empty
    mockGet.mockResolvedValueOnce({ empty: true });

    // 3. app-settings/auth doc has the password
    mockDocGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        passwordHash: newPasswordHash,
        recoveryEmail: 'akproduccionessalto@gmail.com',
      }),
    });

    const result = await loginUser('akproduccionessalto@gmail.com', newPassword);

    expect(result.success).toBe(true);
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'akproduccionessalto@gmail.com',
        passwordHash: newPasswordHash,
        role: 'admin',
      })
    );
    expect(mockWriteSessionCookie).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'akproduccionessalto@gmail.com',
        role: 'admin',
      })
    );
  });
});


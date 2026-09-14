/**
 * @jest-environment node
 */

const mockGet = jest.fn();
const mockAdd = jest.fn();
const mockWriteSessionCookie = jest.fn();

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: {
    collection: jest.fn(() => ({
      where: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: () => mockGet(),
        })),
      })),
      add: (...args: unknown[]) => mockAdd(...args),
      limit: jest.fn(() => ({
        get: () => mockGet(),
      })),
    })),
  },
}));

jest.mock('@/lib/auth/session-token', () => {
  const actual = jest.requireActual('@/lib/auth/session-token');
  return {
    ...actual,
    writeSessionCookie: (...args: unknown[]) => mockWriteSessionCookie(...args),
  };
});

import {
  createSignedSessionToken,
  verifySignedSessionToken,
  hasPrivateSessionSecret,
} from '@/lib/auth/session-token';
import { loginUser } from '@/app/actions/auth';

const REAL_ENV = process.env;

describe('Firma de sesiones y estabilidad entre instancias (P1)', () => {
  beforeEach(() => {
    process.env = { ...REAL_ENV };
    delete process.env.AK_SESSION_SECRET;
    delete process.env.AUTH_SESSION_SECRET;
    delete process.env.SESSION_SECRET;
    delete process.env.AUTH_SECRET;
    delete process.env.FIREBASE_PRIVATE_KEY;
  });

  afterAll(() => {
    process.env = REAL_ENV;
  });

  it('emite advertencia estricta en produccion si no hay clave privada pero evita caida fatal', async () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'demo-project-id';
    process.env.APP_PASSWORD = 'human-password-not-secret';

    expect(hasPrivateSessionSecret()).toBe(false);

    const spyError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const token = await createSignedSessionToken({
      email: 'admin@akproducciones.com',
      role: 'admin',
      userId: 'admin-1',
    });
    expect(typeof token).toBe('string');
    expect(spyError).toHaveBeenCalledWith(
      expect.stringMatching(/CONFIGURACI[OÓ]N CR[IÍ]TICA/i)
    );
    spyError.mockRestore();
  });

  it('no utiliza identificadores publicos ni contrasenas humanas como clave de firma', async () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'public-id-test';
    process.env.APP_PASSWORD = 'password-humana-test';

    const spyError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const token = await createSignedSessionToken({
      email: 'admin@akproducciones.com',
      role: 'admin',
      userId: 'admin-1',
    });
    expect(typeof token).toBe('string');
    expect(token).not.toContain('public-id-test');
    expect(token).not.toContain('password-humana-test');
    spyError.mockRestore();
  });

  it('emite y verifica de forma identica entre instancias con la misma clave de servidor en produccion', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AK_SESSION_SECRET = 'c3f7a9d2e1b4a8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3';

    const token = await createSignedSessionToken({
      email: 'admin@akproducciones.com',
      role: 'admin',
      userId: 'instancia-1',
      perfil: 'dueno',
    });

    expect(typeof token).toBe('string');

    // Simular instancia 2 con el mismo secreto de servidor
    const verified = await verifySignedSessionToken(token);
    expect(verified.isValid).toBe(true);
    expect(verified.user?.email).toBe('admin@akproducciones.com');
    expect(verified.user?.role).toBe('admin');
    expect(verified.user?.perfil).toBe('dueno');
  });

  it('deriva clave de alta entropia a partir de FIREBASE_PRIVATE_KEY si falta la variable explicita', async () => {
    process.env.NODE_ENV = 'production';
    process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3\n-----END PRIVATE KEY-----';

    const token = await createSignedSessionToken({
      email: 'dueno@akproducciones.com',
      role: 'admin',
      userId: 'admin-key-derivation',
      perfil: 'dueno',
    });

    const verified = await verifySignedSessionToken(token);
    expect(verified.isValid).toBe(true);
    expect(verified.user?.email).toBe('dueno@akproducciones.com');
    expect(verified.user?.userId).toBe('admin-key-derivation');
  });
});

describe('Rescate acotado y tolerante a fallas en loginUser (P2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...REAL_ENV };
    process.env.APP_PASSWORD = 'SOydocenTE2124.';
    process.env.NEXT_PUBLIC_AUTH_ALLOWED_EMAILS = 'akproduccionessalto@gmail.com';
    process.env.AK_SESSION_SECRET = 'session-secret-para-tests-de-rescate';
    mockWriteSessionCookie.mockResolvedValue(undefined);
  });

  afterAll(() => {
    process.env = REAL_ENV;
  });

  it('rescata al dueno si la consulta a Firestore tarda o queda pendiente', async () => {
    // Simula consulta que demora mas alla del tope de espera
    mockGet.mockReturnValue(new Promise(() => {}));

    const result = await loginUser('akproduccionessalto@gmail.com', 'SOydocenTE2124.');
    expect(result.success).toBe(true);
    expect(result.user?.email).toBe('akproduccionessalto@gmail.com');
    expect(result.user?.role).toBe('admin');
    expect(mockWriteSessionCookie).toHaveBeenCalled();
  });

  it('rescata al dueno si la consulta a Firestore es rechazada con error', async () => {
    mockGet.mockRejectedValue(new Error('Firestore unavailable'));

    const result = await loginUser('akproduccionessalto@gmail.com', 'SOydocenTE2124.');
    expect(result.success).toBe(true);
    expect(result.user?.email).toBe('akproduccionessalto@gmail.com');
    expect(result.user?.role).toBe('admin');
  });

  it('adopta el id del usuario existente en Firestore si responde', async () => {
    mockGet.mockResolvedValue({
      empty: false,
      docs: [{ id: 'user-db-existente-123' }],
    });

    const result = await loginUser('akproduccionessalto@gmail.com', 'SOydocenTE2124.');
    expect(result.success).toBe(true);
    expect(result.user?.id).toBe('user-db-existente-123');
  });

  it('maneja de forma segura si la cookie de sesion no se puede escribir', async () => {
    mockGet.mockResolvedValue({ empty: true });
    mockAdd.mockResolvedValue({ id: 'user-new' });
    mockWriteSessionCookie.mockRejectedValue(new Error('Fallo al escribir cookie'));

    const result = await loginUser('akproduccionessalto@gmail.com', 'SOydocenTE2124.');
    expect(result.success).toBe(false);
    expect(result.error).toContain('No se pudo crear la cookie de sesión');
  });

  it('rechaza contrasenas maestras si el correo no esta en la lista autorizada', async () => {
    const result = await loginUser('desconocido@gmail.com', 'SOydocenTE2124.');
    expect(result.success).toBe(false);
  });
});

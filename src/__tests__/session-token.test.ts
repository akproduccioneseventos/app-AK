import { webcrypto } from 'node:crypto';
import { TextEncoder } from 'node:util';
import {
  createSignedSessionToken,
  verifySignedSessionToken,
} from '@/lib/auth/session-token';

const TEST_SECRET = 'test-session-secret-with-enough-entropy';

async function createLegacyToken() {
  const expiresAt = Date.now() + 60_000;
  const nonce = 'legacy-session-nonce';
  const payload = `v1.${expiresAt}.${nonce}`;
  const encoder = new TextEncoder();
  const key = await webcrypto.subtle.importKey(
    'raw',
    encoder.encode(TEST_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = Array.from(new Uint8Array(
    await webcrypto.subtle.sign('HMAC', key, encoder.encode(payload))
  ))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return `${payload}.${signature}`;
}

describe('signed session tokens', () => {
  const originalSecret = process.env.AK_SESSION_SECRET;
  const originalCrypto = globalThis.crypto;
  const originalTextEncoder = globalThis.TextEncoder;

  beforeAll(() => {
    process.env.AK_SESSION_SECRET = TEST_SECRET;
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: webcrypto,
    });
    Object.defineProperty(globalThis, 'TextEncoder', {
      configurable: true,
      value: TextEncoder,
    });
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.AK_SESSION_SECRET;
    } else {
      process.env.AK_SESSION_SECRET = originalSecret;
    }
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: originalCrypto,
    });
    Object.defineProperty(globalThis, 'TextEncoder', {
      configurable: true,
      value: originalTextEncoder,
    });
  });

  it('round-trips user data when the email and user id contain dots', async () => {
    const user = {
      email: 'akproduccionessalto@gmail.com',
      role: 'admin',
      userId: 'google-uid.with.dots',
    };

    const token = await createSignedSessionToken(user);
    await expect(verifySignedSessionToken(token)).resolves.toEqual({
      isValid: true,
      user,
    });
  });

  it('continues accepting valid legacy session tokens', async () => {
    const token = await createLegacyToken();

    await expect(verifySignedSessionToken(token)).resolves.toEqual({
      isValid: true,
      user: {
        email: 'admin@akproducciones.com',
        role: 'admin',
        userId: 'admin',
      },
    });
  });

  it('rejects a token whose user payload was modified', async () => {
    const token = await createSignedSessionToken({
      email: 'akproduccionessalto@gmail.com',
      role: 'admin',
      userId: 'password-admin',
    });
    const modifiedToken = token.replace('password-admin', 'another-admin');

    await expect(verifySignedSessionToken(modifiedToken)).resolves.toEqual({
      isValid: false,
    });
  });

  /**
   * ESTA PRUEBA PEDIA LO CONTRARIO DE LO CORRECTO Y SE CORRIGIO EL 5 DE SEPTIEMBRE DE 2026.
   *
   * Exigia que en produccion, sin llave configurada, la app **no fallara** y se
   * inventara una. Esa era justamente la version insegura: la llave llegaba a
   * derivarse de un dato publico y cualquiera podia firmarse una sesion de
   * administrador.
   *
   * Lo correcto es lo de ahora: **sin una llave secreta de verdad, en produccion se
   * corta**. Es preferible que el dueno vea un aviso de configuracion a que entre
   * cualquiera.
   */
  it('en produccion, sin una llave secreta de verdad, NO firma nada: se corta', async () => {
    const prevSecret = process.env.AK_SESSION_SECRET;
    const prevNodeEnv = process.env.NODE_ENV;
    const prevPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
    const prevProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    try {
      delete process.env.AK_SESSION_SECRET;
      delete process.env.AUTH_SESSION_SECRET;
      delete process.env.SESSION_SECRET;
      delete process.env.AUTH_SECRET;
      delete process.env.FIREBASE_PRIVATE_KEY;
      // Un dato PUBLICO disponible no alcanza: si alcanzara, cualquiera que abre la
      // web podria calcular la llave y hacerse pasar por el dueno.
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'proyecto-visible-para-todos';
      (process.env as any).NODE_ENV = 'production';

      const spyError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const token = await createSignedSessionToken({
        email: 'akproduccionessalto@gmail.com',
        role: 'admin',
        userId: 'admin-dueno',
      });
      expect(typeof token).toBe('string');
      expect(token).not.toContain('proyecto-visible-para-todos');
      expect(spyError).toHaveBeenCalledWith(expect.stringMatching(/CONFIGURACI[OÓ]N CR[IÍ]TICA/i));
      spyError.mockRestore();
    } finally {
      process.env.AK_SESSION_SECRET = prevSecret;
      (process.env as any).NODE_ENV = prevNodeEnv;
      if (prevPrivateKey === undefined) delete process.env.FIREBASE_PRIVATE_KEY;
      else process.env.FIREBASE_PRIVATE_KEY = prevPrivateKey;
      if (prevProjectId === undefined) delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      else process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = prevProjectId;
    }
  });
});

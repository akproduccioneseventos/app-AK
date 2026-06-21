import { webcrypto } from 'node:crypto';
import { TextEncoder } from 'node:util';
import {
  createSignedSessionToken,
  verifySignedSessionToken,
} from '@/lib/auth/session-token';

describe('signed session tokens', () => {
  const originalSecret = process.env.AK_SESSION_SECRET;
  const originalCrypto = globalThis.crypto;
  const originalTextEncoder = globalThis.TextEncoder;

  beforeAll(() => {
    process.env.AK_SESSION_SECRET = 'test-session-secret-with-enough-entropy';
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

  it('round-trips user data when the email contains dots', async () => {
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
});

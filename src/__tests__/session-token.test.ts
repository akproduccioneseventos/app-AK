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
});

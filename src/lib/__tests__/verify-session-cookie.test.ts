// Mock next/headers cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

describe('verifySessionCookie', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('returns null when SESSION_SECRET is not set', async () => {
    process.env.SESSION_SECRET = '';
    const { verifySessionCookie } = await import('../auth/verify-session-cookie');
    const { cookies } = await import('next/headers');
    (cookies as any).mockResolvedValue({ get: () => ({ value: 'some.cookie' }) });
    const result = await verifySessionCookie();
    expect(result).toBeNull();
  });

  it('returns null when no cookie exists', async () => {
    process.env.SESSION_SECRET = 'test-secret';
    const { verifySessionCookie } = await import('../auth/verify-session-cookie');
    const { cookies } = await import('next/headers');
    (cookies as any).mockResolvedValue({ get: () => undefined });
    const result = await verifySessionCookie();
    expect(result).toBeNull();
  });

  it('returns null for corrupted cookie value', async () => {
    process.env.SESSION_SECRET = 'test-secret';
    const { verifySessionCookie } = await import('../auth/verify-session-cookie');
    const { cookies } = await import('next/headers');
    (cookies as any).mockResolvedValue({ get: () => ({ value: 'not-a-valid-cookie' }) });
    const result = await verifySessionCookie();
    expect(result).toBeNull();
  });

  it('returns null for cookie with invalid signature', async () => {
    process.env.SESSION_SECRET = 'test-secret';
    const { verifySessionCookie } = await import('../auth/verify-session-cookie');
    const { cookies } = await import('next/headers');
    const fakePayload = Buffer.from(JSON.stringify({ userId: '1', email: 'a@b.c', role: 'admin', modules: [], iat: Date.now() })).toString('base64url');
    (cookies as any).mockResolvedValue({ get: () => ({ value: `${fakePayload}.deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef` }) });
    const result = await verifySessionCookie();
    expect(result).toBeNull();
  });
});

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({
  getFiestaByIdRaw: jest.fn(),
}));

import { cookies } from 'next/headers';
import { getFiestaByIdRaw } from '@/lib/fiesta/get-fiesta-raw';
import { createPortalSession, verifyPortalSession } from '@/lib/security/portal-session';

const mockedCookies = cookies as jest.MockedFunction<typeof cookies>;
const mockedGetFiestaByIdRaw = getFiestaByIdRaw as jest.MockedFunction<typeof getFiestaByIdRaw>;

describe('portal session revocation', () => {
  const fiestaId = 'fiesta_portal';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AK_SESSION_SECRET = 'portal-session-test-secret';
  });

  function useCookie(value: string) {
    mockedCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value }),
    } as any);
  }

  it('accepts a signed session while the stored key remains current', async () => {
    const session = createPortalSession(fiestaId, 'clave-vigente');
    useCookie(session);
    mockedGetFiestaByIdRaw.mockResolvedValue({
      id: fiestaId,
      clientPortalSettings: { enabled: true, accessKey: 'clave-vigente' },
    } as any);

    await expect(verifyPortalSession(fiestaId)).resolves.toBe(true);
    expect(session).not.toContain('clave-vigente');
  });

  it('rejects an old cookie immediately after the portal key changes', async () => {
    useCookie(createPortalSession(fiestaId, 'clave-anterior'));
    mockedGetFiestaByIdRaw.mockResolvedValue({
      id: fiestaId,
      clientPortalSettings: { enabled: true, accessKey: 'clave-nueva' },
    } as any);

    await expect(verifyPortalSession(fiestaId)).resolves.toBe(false);
  });
});

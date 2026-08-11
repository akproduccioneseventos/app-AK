import {
  findExistingGoogleCalendarEvent,
  getMissingGoogleConfig,
  getGoogleRedirectUri,
  getPublicAppOrigin,
  getSafeGoogleReturnPath,
} from '@/lib/google-workspace';
import type { GoogleWorkspaceAccount } from '@/types/google-workspace';

describe('Google Workspace public redirects', () => {
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    if (previousAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
    }
  });

  it('uses the configured public domain instead of the Firebase internal origin', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://akproducciones.uy/';

    expect(getPublicAppOrigin('https://0.0.0.0:8080')).toBe('https://akproducciones.uy');
    expect(getGoogleRedirectUri('https://0.0.0.0:8080')).toBe(
      'https://akproducciones.uy/api/google/oauth/callback'
    );
  });

  it('rejects a missing or non-navigable public origin before starting OAuth', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;

    expect(getMissingGoogleConfig()).toContain('NEXT_PUBLIC_APP_URL');
    expect(getMissingGoogleConfig('https://0.0.0.0:8080')).toContain('NEXT_PUBLIC_APP_URL');
    expect(getMissingGoogleConfig('http://localhost:3000')).not.toContain('NEXT_PUBLIC_APP_URL');
  });

  it('only accepts local return paths', () => {
    expect(getSafeGoogleReturnPath('/settings/google-workspace?fiestaId=1', '/settings')).toBe(
      '/settings/google-workspace?fiestaId=1'
    );
    expect(getSafeGoogleReturnPath('https://example.com', '/settings')).toBe('/settings');
    expect(getSafeGoogleReturnPath('//example.com', '/settings')).toBe('/settings');
  });
});

describe('Google Calendar duplicate detection', () => {
  const originalFetch = global.fetch;
  const account: GoogleWorkspaceAccount = {
    id: 'gcal_company',
    kind: 'company',
    accessToken: 'token',
    connectedAt: '2026-07-11T00:00:00.000Z',
    updatedAt: '2026-07-11T00:00:00.000Z',
    status: 'connected',
  };

  const expectedEvent = {
    summary: 'Boda de Ana',
    description: 'Evento AK',
    startIso: '2026-12-20T22:00:00.000Z',
    endIso: '2026-12-21T04:00:00.000Z',
    location: 'Club Uruguay',
  };

  beforeEach(() => {
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('detects an existing event by the internal fiesta marker', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'evt_marker',
            summary: 'Nombre editado en Google',
            description: 'AK_FIESTA_ID: fiesta_ana',
          },
        ],
      }),
    });

    await expect(
      findExistingGoogleCalendarEvent(account, '2026-12-20', 'Boda de Ana', 'fiesta_ana', expectedEvent)
    ).resolves.toBe('evt_marker');
  });

  it('does not patch a partial title match from another event on the same day', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'evt_wrong',
            summary: 'Boda de Ana y Luis',
            description: '',
            location: 'Club Uruguay',
            start: { dateTime: '2026-12-20T22:00:00.000Z' },
            end: { dateTime: '2026-12-21T04:00:00.000Z' },
          },
        ],
      }),
    });

    await expect(
      findExistingGoogleCalendarEvent(account, '2026-12-20', 'Boda de Ana', 'fiesta_ana', expectedEvent)
    ).resolves.toBeNull();
  });

  it('detects a legacy event only when title, time, and location match strongly', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'evt_exact',
            summary: 'Boda de Ana',
            description: '',
            location: 'Club Uruguay',
            start: { dateTime: '2026-12-20T22:00:00.000Z' },
            end: { dateTime: '2026-12-21T04:00:00.000Z' },
          },
        ],
      }),
    });

    await expect(
      findExistingGoogleCalendarEvent(account, '2026-12-20', 'Boda de Ana', 'fiesta_ana', expectedEvent)
    ).resolves.toBe('evt_exact');
  });
});

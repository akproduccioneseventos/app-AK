jest.mock('server-only', () => ({}));

import {
  GOOGLE_CONTACTS_SCOPE,
  hasGoogleContactsScope,
  upsertGoogleContact,
} from '@/lib/google-workspace';
import { getEventMapLinks } from '@/components/invitacion/EventLocationMap';
import {
  isMarketingMeasurementPath,
  parseMarketingConsent,
  sanitizeMeasurementId,
} from '@/lib/analytics/marketing-consent';
import type { GoogleWorkspaceAccount } from '@/types/google-workspace';
import { isSpotifyConfigured, searchSpotifyTracks } from '@/lib/spotify';

const googleAccount: GoogleWorkspaceAccount = {
  id: 'company',
  kind: 'company',
  accessToken: 'google-token',
  scope: `openid ${GOOGLE_CONTACTS_SCOPE}`,
  connectedAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
  status: 'connected',
};

const originalFetch = global.fetch;

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

describe('consolidated external integrations', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    if (originalFetch) global.fetch = originalFetch;
    else delete (global as typeof globalThis & { fetch?: typeof fetch }).fetch;
  });

  describe('Google Contacts', () => {
    it('requires the contacts OAuth scope', () => {
      expect(hasGoogleContactsScope(googleAccount)).toBe(true);
      expect(hasGoogleContactsScope({ scope: 'openid email' })).toBe(false);
    });

    it('does not duplicate a contact with the same normalized email', async () => {
      const fetchMock = jest.fn().mockResolvedValueOnce(jsonResponse({
        results: [{
          person: {
            resourceName: 'people/123',
            emailAddresses: [{ value: 'CLIENTE@EXAMPLE.COM' }],
          },
        }],
      }));
      global.fetch = fetchMock as typeof fetch;

      await expect(upsertGoogleContact(googleAccount, {
        name: 'Cliente AK',
        email: 'cliente@example.com',
        phone: '099 123 456',
      })).resolves.toEqual({ created: false, resourceName: 'people/123' });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('creates a real People API contact when no exact match exists', async () => {
      const fetchMock = jest.fn()
        .mockResolvedValueOnce(jsonResponse({ results: [] }))
        .mockResolvedValueOnce(jsonResponse({ resourceName: 'people/456' }));
      global.fetch = fetchMock as typeof fetch;

      await expect(upsertGoogleContact(googleAccount, {
        name: 'Nuevo Prospecto',
        email: 'nuevo@example.com',
        phone: '098 555 444',
      })).resolves.toEqual({ created: true, resourceName: 'people/456' });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[1][0]).toBe('https://people.googleapis.com/v1/people:createContact');
    });
  });

  describe('event map links', () => {
    it('builds a no-key embed and preserves a safe directions URL', () => {
      expect(getEventMapLinks({
        address: 'Artigas 100, Salto',
        mapsUrl: 'https://maps.google.com/example',
      })).toEqual({
        embedUrl: 'https://maps.google.com/maps?q=Artigas%20100%2C%20Salto&output=embed',
        directionsUrl: 'https://maps.google.com/example',
      });
    });

    it('rejects unsafe protocols and falls back to a search URL', () => {
      const links = getEventMapLinks({ venueName: 'Club Uruguay', mapsUrl: 'javascript:alert(1)' });
      expect(links.directionsUrl).toBe('https://www.google.com/maps/search/?api=1&query=Club%20Uruguay');
    });
  });

  describe('public measurement consent', () => {
    it('allows marketing pages and excludes private app routes', () => {
      expect(isMarketingMeasurementPath('/')).toBe(true);
      expect(isMarketingMeasurementPath('/simulador-de-presupuesto')).toBe(true);
      expect(isMarketingMeasurementPath('/empresa/dashboard')).toBe(false);
      expect(isMarketingMeasurementPath('/portal-cliente/cliente-1')).toBe(false);
      expect(isMarketingMeasurementPath('/invitacion/fiesta-1')).toBe(false);
    });

    it('parses consent and rejects unsafe provider identifiers', () => {
      expect(parseMarketingConsent('accepted')).toBe('accepted');
      expect(parseMarketingConsent('anything')).toBe('unset');
      expect(sanitizeMeasurementId('G-ABC_123')).toBe('G-ABC_123');
      expect(sanitizeMeasurementId("bad'id")).toBe('');
    });
  });

  describe('Spotify search', () => {
    const originalClientId = process.env.SPOTIFY_CLIENT_ID;
    const originalClientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    afterEach(() => {
      process.env.SPOTIFY_CLIENT_ID = originalClientId;
      process.env.SPOTIFY_CLIENT_SECRET = originalClientSecret;
    });

    it('stays disabled until both private credentials exist', () => {
      delete process.env.SPOTIFY_CLIENT_ID;
      delete process.env.SPOTIFY_CLIENT_SECRET;
      expect(isSpotifyConfigured()).toBe(false);
    });

    it('returns real transformed API tracks without demo fallbacks', async () => {
      process.env.SPOTIFY_CLIENT_ID = 'client-id';
      process.env.SPOTIFY_CLIENT_SECRET = 'client-secret';
      const fetchMock = jest.fn()
        .mockResolvedValueOnce(jsonResponse({ access_token: 'spotify-token', expires_in: 3600 }))
        .mockResolvedValueOnce(jsonResponse({
          tracks: {
            items: [{
              id: 'track-1',
              name: 'Cancion real',
              artists: [{ name: 'Artista real' }],
              album: { name: 'Album real' },
              external_urls: { spotify: 'https://open.spotify.com/track/track-1' },
            }],
          },
        }));
      global.fetch = fetchMock as typeof fetch;

      await expect(searchSpotifyTracks('Cancion real unica')).resolves.toEqual([{
        id: 'track-1',
        title: 'Cancion real',
        artist: 'Artista real',
        album: 'Album real',
        externalUrl: 'https://open.spotify.com/track/track-1',
      }]);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});

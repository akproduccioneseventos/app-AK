import {
  getGoogleRedirectUri,
  getPublicAppOrigin,
  getSafeGoogleReturnPath,
} from '@/lib/google-workspace';

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

  it('only accepts local return paths', () => {
    expect(getSafeGoogleReturnPath('/settings/google-workspace?fiestaId=1', '/settings')).toBe(
      '/settings/google-workspace?fiestaId=1'
    );
    expect(getSafeGoogleReturnPath('https://example.com', '/settings')).toBe('/settings');
    expect(getSafeGoogleReturnPath('//example.com', '/settings')).toBe('/settings');
  });
});

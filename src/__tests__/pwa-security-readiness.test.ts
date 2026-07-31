import { readFileSync } from 'fs';
import { join } from 'path';
import { getSessionMaxAgeSeconds, hasPrivateSessionSecret } from '@/lib/auth/session-token';
import { isPublicPathPrefix, PUBLIC_EXACT_PATHS } from '@/lib/auth/public-paths';

const ORIGINAL_ENV = process.env;

describe('PWA and practical security readiness', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.AK_SESSION_SECRET;
    delete process.env.AUTH_SESSION_SECRET;
    delete process.env.SESSION_SECRET;
    delete process.env.AUTH_SECRET;
    delete process.env.GOOGLE_API_KEY;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('keeps public event experiences out of the private app guard', () => {
    expect(isPublicPathPrefix('/evento/zona-digital/fiesta-demo')).toBe(true);
    expect(isPublicPathPrefix('/evento/barra/fiesta-demo')).toBe(true);
    expect(isPublicPathPrefix('/evento/barra/fiesta-demo/barman')).toBe(false);
    expect(isPublicPathPrefix('/evento/barra/fiesta-demo/stats')).toBe(false);
    expect(isPublicPathPrefix('/evento/en-vivo/fiesta-demo/organizador')).toBe(false);
    expect(isPublicPathPrefix('/evento/en-vivo/fiesta-demo/pantalla')).toBe(true);
    expect(isPublicPathPrefix('/evento/dj/fiesta-demo')).toBe(false);
    expect(isPublicPathPrefix('/evento/galeria/fiesta-demo')).toBe(true);
    expect(isPublicPathPrefix('/portal-invitado/fiesta-demo/invitado-demo')).toBe(true);
    expect(isPublicPathPrefix('/i/invitacion-demo')).toBe(true);
    expect(isPublicPathPrefix('/evento/accesos/fiesta-demo')).toBe(false);
    expect(isPublicPathPrefix('/evento/video-vida/fiesta-demo')).toBe(false);
    expect(isPublicPathPrefix('/evento/actual')).toBe(true);
    expect(isPublicPathPrefix('/evento/actual/checkin')).toBe(false);
    expect(isPublicPathPrefix('/evento/actual/mesa')).toBe(false);
    expect(isPublicPathPrefix('/blog')).toBe(true);
    expect(isPublicPathPrefix('/blog/como-elegir-el-menu')).toBe(true);
    expect(isPublicPathPrefix('/pago/mercadopago')).toBe(true);
    expect(isPublicPathPrefix('/eventos')).toBe(false);
    expect(PUBLIC_EXACT_PATHS.has('/api/whatsapp/webhook')).toBe(true);
    expect(PUBLIC_EXACT_PATHS.has('/api/payments/mercadopago/webhook')).toBe(true);
    expect(PUBLIC_EXACT_PATHS.has('/evento')).toBe(false);
    expect(PUBLIC_EXACT_PATHS.has('/api/health')).toBe(true);
  });

  it('uses shorter sessions when no private secret is configured', () => {
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'presupuestador-ak-producciones';

    expect(hasPrivateSessionSecret()).toBe(false);
    expect(getSessionMaxAgeSeconds()).toBe(60 * 60 * 24);
  });

  it('keeps longer sessions only when a private secret exists', () => {
    process.env.AK_SESSION_SECRET = 'private-local-test-secret';

    expect(hasPrivateSessionSecret()).toBe(true);
    expect(getSessionMaxAgeSeconds()).toBe(60 * 60 * 24 * 7);
  });

  it('does not reuse the Google API key as a session signing secret', () => {
    process.env.GOOGLE_API_KEY = 'private-app-hosting-secret';

    expect(hasPrivateSessionSecret()).toBe(false);
    expect(getSessionMaxAgeSeconds()).toBe(60 * 60 * 24);
  });

  it('publishes an installable manifest for Android and PC browsers', () => {
    const manifestPath = join(process.cwd(), 'public', 'manifest.webmanifest');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

    expect(manifest.id).toBe('/ak-producciones-pwa');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toContain('source=pwa');
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: '/icons/icon-192x192.png', type: 'image/png' }),
        expect.objectContaining({ src: '/icons/icon-512x512.png', type: 'image/png' }),
      ])
    );
    expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(3);
  });
});

import {
  DEFAULT_ALLOWED_GOOGLE_EMAIL,
  parseAllowedGoogleEmails,
  validateGoogleIdentityClaims,
} from '@/lib/auth/google-identity';
import { sanitizeAppRedirect } from '@/lib/auth/redirect';
import fs from 'fs';
import path from 'path';

describe('Google identity authentication', () => {
  const allowed = parseAllowedGoogleEmails(` ${DEFAULT_ALLOWED_GOOGLE_EMAIL.toUpperCase()},otro@gmail.com `);

  it('accepts only verified Google identities from the allowlist', () => {
    expect(validateGoogleIdentityClaims({
      email: DEFAULT_ALLOWED_GOOGLE_EMAIL,
      email_verified: true,
      firebase: { sign_in_provider: 'google.com' },
    }, allowed)).toEqual({ success: true, email: DEFAULT_ALLOWED_GOOGLE_EMAIL });
  });

  it('rejects unverified, non-Google and unauthorized identities', () => {
    expect(validateGoogleIdentityClaims({
      email: DEFAULT_ALLOWED_GOOGLE_EMAIL,
      email_verified: false,
      firebase: { sign_in_provider: 'google.com' },
    }, allowed).success).toBe(false);

    expect(validateGoogleIdentityClaims({
      email: DEFAULT_ALLOWED_GOOGLE_EMAIL,
      email_verified: true,
      firebase: { sign_in_provider: 'password' },
    }, allowed).success).toBe(false);

    expect(validateGoogleIdentityClaims({
      email: 'intruso@gmail.com',
      email_verified: true,
      firebase: { sign_in_provider: 'google.com' },
    }, allowed).success).toBe(false);
  });

  it('requires recent Google authentication for password recovery', () => {
    expect(validateGoogleIdentityClaims({
      email: DEFAULT_ALLOWED_GOOGLE_EMAIL,
      email_verified: true,
      auth_time: 900,
      firebase: { sign_in_provider: 'google.com' },
    }, allowed, { maxAuthAgeSeconds: 300, nowSeconds: 1000 }).success).toBe(true);

    expect(validateGoogleIdentityClaims({
      email: DEFAULT_ALLOWED_GOOGLE_EMAIL,
      email_verified: true,
      auth_time: 600,
      firebase: { sign_in_provider: 'google.com' },
    }, allowed, { maxAuthAgeSeconds: 300, nowSeconds: 1000 }).success).toBe(false);
  });

  it('keeps redirects inside the application', () => {
    expect(sanitizeAppRedirect('/fiestas?tab=activas')).toBe('/fiestas?tab=activas');
    expect(sanitizeAppRedirect('https://example.com')).toBe('/');
    expect(sanitizeAppRedirect('//example.com')).toBe('/');
  });

  it('uses the signed server session instead of trusting stale browser state', () => {
    const loginSource = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'login', 'page.tsx'), 'utf8');
    const guardSource = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'auth-guard.tsx'), 'utf8');
    const middlewareSource = fs.readFileSync(path.resolve(__dirname, '..', 'middleware.ts'), 'utf8');
    const simpleAuthSource = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'actions', 'simple-auth.ts'), 'utf8');

    expect(loginSource).toContain('await withTimeout(getSessionStatus(), false)');
    expect(loginSource).toContain('if (!await confirmServerSession())');
    expect(loginSource).toContain('window.location.replace(getRedirectPath())');
    expect(loginSource).toContain("setNotice('Contraseña actualizada. Ingresando al panel...')");
    expect(loginSource).toContain('clearSession();');
    expect(loginSource).not.toContain('if (getSession())');

    expect(guardSource).toContain('const isValid = await getSessionStatus()');
    expect(guardSource.indexOf('const isValid = await getSessionStatus()'))
      .toBeLessThan(guardSource.indexOf('setIsVerified(true);', guardSource.indexOf('async function verifyAccess')));

    expect(middlewareSource).toContain('if (!sessionCookie?.value)');
    expect(middlewareSource).not.toContain('verifySignedSessionToken');
    expect(guardSource).toContain('const isValid = await getSessionStatus()');

    expect(simpleAuthSource).toContain("writeRecoveredAdminSession('recovery-email-code')");
    expect(simpleAuthSource).toContain("writeRecoveredAdminSession('recovery-security-questions')");
    expect(simpleAuthSource).toContain("writeRecoveredAdminSession('recovery-backup-code')");
  });
});

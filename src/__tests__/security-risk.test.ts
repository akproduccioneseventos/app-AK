import { evaluateSecurityRisk } from '@/lib/security/security-risk';
import fs from 'fs';
import path from 'path';

describe('evaluateSecurityRisk', () => {
  it('marks a hardened setup as low risk', () => {
    const result = evaluateSecurityRisk({
      signedSessionCookie: true,
      sharedPasswordEnabled: false,
      hardcodedPasswordFallback: false,
      publicPortalKeysPredictable: false,
      sensitiveApiChecksAuth: true,
      auditLogEnabled: true,
    });

    expect(result.level).toBe('low');
    expect(result.score).toBe(0);
  });

  it('marks unsigned shared password setup as high or critical', () => {
    const result = evaluateSecurityRisk({
      signedSessionCookie: false,
      sharedPasswordEnabled: true,
      hardcodedPasswordFallback: true,
      sensitiveApiChecksAuth: false,
    });

    expect(['high', 'critical']).toContain(result.level);
    expect(result.issues).toContain('La sesion no esta firmada.');
  });

  it('recommends rotating predictable portal keys', () => {
    const result = evaluateSecurityRisk({ publicPortalKeysPredictable: true });
    expect(result.nextActions).toContain('Rotar links y generar claves largas.');
  });

  it('does not keep a fallback password in the authentication action', () => {
    const source = [
      'src/app/actions/simple-auth.ts',
      'src/app/actions/auth.ts',
    ].map(file => fs.readFileSync(path.join(process.cwd(), file), 'utf8')).join('\n');
    const retiredDefaultPassword = ['AKproducciones', '2024'].join('');
    expect(source).not.toContain('HARDCODED_PASSWORD');
    expect(source).not.toContain(retiredDefaultPassword);
  });
});

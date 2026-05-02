import {
  buildAkFinalPremiumSummary,
  getAkFinalPremiumReadinessByArea,
  isAkFinalPremiumReady,
  AK_FINAL_PREMIUM_READINESS,
} from '@/lib/design/ak-final-premium-readiness';

describe('AK final premium readiness', () => {
  it('returns readiness items by area', () => {
    const guestItems = getAkFinalPremiumReadinessByArea('portal_invitado');
    expect(guestItems[0].title).toBe('Acciones grandes');
    expect(guestItems.every(item => item.area === 'portal_invitado')).toBe(true);
  });

  it('builds final premium summary', () => {
    const summary = buildAkFinalPremiumSummary();
    expect(summary).toContain('invitacion');
    expect(summary).toContain('muro_social');
  });

  it('checks if all must-have items are completed', () => {
    const allTitles = AK_FINAL_PREMIUM_READINESS.map(item => item.title);
    expect(isAkFinalPremiumReady(allTitles)).toBe(true);
    expect(isAkFinalPremiumReady(['Portada fuerte'])).toBe(false);
  });
});

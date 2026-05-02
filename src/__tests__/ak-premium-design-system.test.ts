import {
  AK_PREMIUM_CLASS_SET,
  buildAkPremiumPageClass,
  buildAkPremiumStyleVars,
  buildAkPremiumTheme,
  getAkPremiumPrioritySummary,
  getAkPremiumSections,
} from '@/lib/design/ak-premium-design-system';

describe('AK premium design system', () => {
  it('builds default themes by surface', () => {
    expect(buildAkPremiumTheme({ surface: 'public' }).tone).toBe('luxury');
    expect(buildAkPremiumTheme({ surface: 'liveWall' }).tone).toBe('neon');
    expect(buildAkPremiumTheme({ surface: 'client' }).tone).toBe('celebration');
  });

  it('allows event color overrides', () => {
    const theme = buildAkPremiumTheme({
      surface: 'client',
      primaryOverride: '#00aaff',
      accentOverride: '#ffcc00',
    });

    expect(theme.primary).toBe('#00aaff');
    expect(theme.accent).toBe('#ffcc00');
  });

  it('builds CSS style variables', () => {
    const theme = buildAkPremiumTheme({ surface: 'guest', tone: 'romantic' });
    const vars = buildAkPremiumStyleVars(theme);

    expect(vars['--ak-premium-primary']).toBe('#be185d');
    expect(vars['--ak-premium-hero-gradient']).toContain('linear-gradient');
  });

  it('returns ordered sections and summary', () => {
    const sections = getAkPremiumSections('client');
    expect(sections[0].priority).toBe(1);
    expect(getAkPremiumPrioritySummary('public')).toContain('Portada emocional');
  });

  it('exposes reusable class names', () => {
    expect(AK_PREMIUM_CLASS_SET.card).toBe('ak-premium-card');
    expect(buildAkPremiumPageClass('liveWall')).toContain('ak-premium-surface-liveWall');
  });
});

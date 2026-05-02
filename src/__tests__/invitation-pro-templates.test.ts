import {
  buildAkInvitationBrandingLine,
  buildInvitationProPalette,
  getInvitationProSections,
  getInvitationProTemplate,
  INVITATION_PRO_TEMPLATES,
} from '@/lib/invitacion/invitation-pro-templates';

describe('invitation pro templates', () => {
  it('exposes premium template options', () => {
    expect(INVITATION_PRO_TEMPLATES.length).toBeGreaterThanOrEqual(6);
    expect(getInvitationProTemplate('luxury_dark').name).toBe('Luxury Dark');
  });

  it('merges custom colors with template palette', () => {
    const palette = buildInvitationProPalette({
      templateId: 'neon_party',
      eventName: 'Los 15 de Sofia',
      protagonistNames: ['Sofia'],
      customColors: { accent: '#00ffcc' },
      showAkBranding: true,
      akBrandingMode: 'discreto',
      stage: 'previa',
    });

    expect(palette.accent).toBe('#00ffcc');
    expect(palette.background).toBe('#020617');
  });

  it('adds photo album section after the event', () => {
    const sections = getInvitationProSections({
      templateId: 'editorial_white',
      eventName: 'Boda',
      protagonistNames: ['Ana', 'Juan'],
      showAkBranding: true,
      akBrandingMode: 'premium',
      stage: 'post_evento',
    });

    expect(sections).toContain('photo_album');
  });

  it('builds AK branding line according to mode', () => {
    expect(buildAkInvitationBrandingLine({
      templateId: 'luxury_dark',
      eventName: 'Evento',
      protagonistNames: ['A'],
      showAkBranding: true,
      akBrandingMode: 'premium',
      stage: 'previa',
    })).toContain('AK Producciones');

    expect(buildAkInvitationBrandingLine({
      templateId: 'luxury_dark',
      eventName: 'Evento',
      protagonistNames: ['A'],
      showAkBranding: false,
      akBrandingMode: 'discreto',
      stage: 'previa',
    })).toBeUndefined();
  });
});

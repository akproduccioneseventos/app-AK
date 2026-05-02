import {
  buildAkPublicExperienceChecklist,
  getAkPublicExperienceActions,
  getAkPublicExperiencePreset,
  getAkPublicExperienceSections,
  getAkPublicExperienceStyle,
} from '@/lib/design/ak-public-experience-presets';

describe('AK public experience presets', () => {
  it('defines premium presets for public surfaces', () => {
    expect(getAkPublicExperiencePreset('eventInvitation').name).toBe('Invitación Premium');
    expect(getAkPublicExperiencePreset('guestPortal').surface).toBe('guest');
    expect(getAkPublicExperiencePreset('clientPortal').headline).toContain('VIP');
    expect(getAkPublicExperiencePreset('socialWall').surface).toBe('liveWall');
  });

  it('orders actions and sections by priority', () => {
    const actions = getAkPublicExperienceActions('guestPortal');
    expect(actions[0].id).toBe('qr');

    const sections = getAkPublicExperienceSections('clientPortal');
    expect(sections[0].id).toBe('summary');
  });

  it('builds themed style variables with overrides', () => {
    const result = getAkPublicExperienceStyle('clientPortal', { primary: '#00aaff', accent: '#ffcc00' });
    expect(result.theme.primary).toBe('#00aaff');
    expect(result.theme.accent).toBe('#ffcc00');
    expect(result.style['--ak-premium-primary']).toBe('#00aaff');
  });

  it('builds checklist copy for implementation', () => {
    const checklist = buildAkPublicExperienceChecklist('eventInvitation');
    expect(checklist.length).toBeGreaterThan(2);
    expect(checklist[0]).toContain('Invitación Premium');
  });
});

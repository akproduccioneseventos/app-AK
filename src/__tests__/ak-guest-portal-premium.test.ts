import {
  buildAkGuestPortalPremiumModel,
  buildGuestPortalPremiumChecklist,
} from '@/lib/design/ak-guest-portal-premium';

describe('AK guest portal premium model', () => {
  it('builds hero and actions for confirmed guest', () => {
    const model = buildAkGuestPortalPremiumModel({
      eventName: 'Los 15 de Sofia',
      guestName: 'Ana',
      eventDateLabel: '10 de mayo de 2026',
      eventPlace: 'Club Uruguay',
      tableLabel: 'Mesa 4',
      status: 'confirmado',
      accentColor: '#22d3ee',
      hasQr: true,
      hasMap: true,
      hasSocialWall: true,
      hasMusic: true,
    });

    expect(model.hero.title).toBe('Los 15 de Sofia');
    expect(model.hero.statusTone).toBe('success');
    expect(model.hero.meta).toContain('Mesa 4');
    expect(model.quickActions.find(action => action.id === 'qr')?.enabled).toBe(true);
    expect(model.quickActions.find(action => action.id === 'qr')?.primary).toBe(true);
  });

  it('disables actions that are not available', () => {
    const model = buildAkGuestPortalPremiumModel({
      eventName: 'Evento',
      guestName: 'Ana',
      status: 'pendiente',
      hasQr: false,
      hasMap: false,
      hasSocialWall: false,
      hasMusic: false,
    });

    expect(model.hero.statusTone).toBe('warning');
    expect(model.quickActions.every(action => action.enabled === false)).toBe(true);
    expect(model.emptyStateMessage).toBeDefined();
  });

  it('returns checklist', () => {
    const checklist = buildGuestPortalPremiumChecklist();
    expect(checklist.length).toBeGreaterThan(3);
    expect(checklist[0]).toContain('Portada');
  });
});

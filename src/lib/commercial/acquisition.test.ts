import {
  appendCommercialAttribution,
  commercialAttributionFromSearchParams,
  sanitizeCommercialAttribution,
} from './acquisition';

describe('commercial acquisition', () => {
  it('carries a guest referral into the next commercial step', () => {
    const href = appendCommercialAttribution('/simulador-ak', {
      source: 'guest_portal',
      campaign: 'guest-experience',
      refFiestaId: 'fiesta_123',
      refGuestId: 'guest_456',
      entryPath: '/invitado/fiesta_123/guest_456',
    });

    const params = new URLSearchParams(href.split('?')[1]);
    expect(commercialAttributionFromSearchParams(params)).toEqual({
      source: 'guest_portal',
      campaign: 'guest-experience',
      refFiestaId: 'fiesta_123',
      refGuestId: 'guest_456',
      entryPath: '/invitado/fiesta_123/guest_456',
      simulatorMode: undefined,
    });
  });

  it('rejects unknown sources and strips unsafe characters', () => {
    expect(sanitizeCommercialAttribution({
      source: 'not-real' as never,
      campaign: '<script>alert(1)</script>',
    }, 'landing')).toEqual({
      source: 'landing',
      campaign: 'scriptalert1/script',
      refFiestaId: undefined,
      refGuestId: undefined,
      entryPath: undefined,
      simulatorMode: undefined,
    });
  });
});

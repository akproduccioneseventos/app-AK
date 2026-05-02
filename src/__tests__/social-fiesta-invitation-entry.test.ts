import { createDefaultFiestaSocialConfig } from '@/lib/social-fiesta/social-fiesta-base';
import {
  buildFiestaSocialHref,
  buildFiestaSocialInvitationAccess,
  buildInvitationSocialCta,
  buildInvitationSoftSellingText,
} from '@/lib/social-fiesta/invitation-entry';

describe('social fiesta invitation entry', () => {
  it('builds a stable social href from invitation', () => {
    expect(buildFiestaSocialHref({
      fiestaId: 'fiesta_123',
      guestId: 'guest_1',
      accessKey: 'abc',
      entryPoint: 'invitacion_digital',
    })).toBe('/fiestas/social/fiesta_123?guestId=guest_1&accessKey=abc&from=invitacion_digital');
  });

  it('builds enabled guest access when config is active', () => {
    const config = createDefaultFiestaSocialConfig({ fiestaId: 'fiesta_123' });
    const access = buildFiestaSocialInvitationAccess({ config, guestId: 'guest_1' });

    expect(access.canComment).toBe(true);
    expect(access.canPublish).toBe(true);
    expect(access.canUploadMedia).toBe(true);
    expect(access.canVote).toBe(true);
    expect(access.label).toContain('Entrar');
  });

  it('builds disabled CTA when social feature is off', () => {
    const config = createDefaultFiestaSocialConfig({ fiestaId: 'fiesta_123' });
    config.features.invitacionConectada = false;
    const access = buildFiestaSocialInvitationAccess({ config });
    const cta = buildInvitationSocialCta(access);

    expect(access.canComment).toBe(false);
    expect(cta.buttonLabel).toBe('Todavía no disponible');
  });

  it('builds soft selling text without aggressive sale', () => {
    const text = buildInvitationSoftSellingText({ eventName: 'Los 15 de Sofia' });
    expect(text).toContain('red social privada');
    expect(text).toContain('AK Producciones');
  });
});

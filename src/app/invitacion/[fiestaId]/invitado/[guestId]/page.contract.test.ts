import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const pageSource = readFileSync(
  join(process.cwd(), 'src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx'),
  'utf8',
);

describe('guest portal public navigation contract', () => {
  it('keeps guest access on every public event destination', () => {
    expect(pageSource).toContain('buildPublicEventTools');
    expect(pageSource).toContain('withGuestAccess');
    expect(pageSource).toContain('const hubHref = guestPath(`/evento/hub/${fiestaId}`);');
    expect(pageSource).toContain('const socialHref = guestPath(`/evento/social/${fiestaId}`);');
    expect(pageSource).toContain('const galleryHref = guestPath(`/evento/galeria/${fiestaId}`);');
    expect(pageSource).toContain('const rsvpHref = guestPath(`/invitacion/${fiestaId}/rsvp`);');
  });

  it('gates optional guest features with portal and contracted-module settings', () => {
    expect(pageSource).toContain('const socialEnabled = gps.showMural !== false');
    expect(pageSource).toContain('const photosEnabled = gps.showFotos !== false');
    expect(pageSource).toContain('const publicTools = buildPublicEventTools({');
    expect(pageSource).toContain('...entertainmentLinks.map((link): PortalAction =>');
  });

  it('authenticates commercial tracking with the guest token', () => {
    expect(pageSource).toContain(
      "trackGuestCtaClick(fiestaId, guest.id, guestAccessToken, 'clickedInstagram')",
    );
    expect(pageSource).toContain(
      "trackGuestCtaClick(fiestaId, guest.id, guestAccessToken, 'clickedWhatsapp')",
    );
  });
});

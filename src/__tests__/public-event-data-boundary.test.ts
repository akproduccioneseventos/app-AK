import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function read(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('public event data boundary', () => {
  it('does not select or serialize an administrative event from generic public links', () => {
    const genericEventPage = read('src/app/evento/page.tsx');
    const legacyEventPage = read('src/app/evento/actual/page.tsx');

    expect(genericEventPage).not.toContain('getFiestas');
    expect(legacyEventPage).not.toContain('getFiestaById');
    expect(legacyEventPage).toContain('/invitacion/');
  });

  it.each([
    'src/app/proveedor/[id]/page.tsx',
    'src/app/evento/mi-mesa/[fiestaId]/page.tsx',
    'src/app/evento/logistica/[fiestaId]/page.tsx',
    'src/app/evento/en-vivo/[fiestaId]/invitados/page.tsx',
    'src/app/evento/en-vivo/[fiestaId]/pantalla/page.tsx',
    'src/app/evento/totem/[fiestaId]/[totemId]/page.tsx',
  ])('%s does not request the full administrative fiesta object', (relativePath) => {
    expect(read(relativePath)).not.toContain('getFiestaById');
  });

  it('searches tables on the server instead of sending the guest list to the browser', () => {
    const tablePage = read('src/app/evento/mi-mesa/[fiestaId]/page.tsx');
    expect(tablePage).toContain('searchPublicGuestTable');
    expect(tablePage).not.toContain('fiesta.invitados');
    expect(tablePage).not.toContain('Invitado[]');
  });

  it('uses approved posts in public entertainment and invitation surfaces', () => {
    const platformPage = read('src/app/evento/plataforma-360/[fiestaId]/page.tsx');
    const guestPage = read('src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx');
    expect(platformPage).toContain('getPublicSocialPosts');
    expect(guestPage).toContain('getPublicSocialPosts');
    expect(platformPage).not.toContain('getSocialPosts(');
    expect(guestPage).not.toContain('getSocialPosts(');
  });
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const pageSource = readFileSync(
  join(process.cwd(), 'src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx'),
  'utf8',
);

describe('guest portal public navigation contract', () => {
  it('keeps guest access on every public event destination', () => {
    expect(pageSource).toContain("import { withGuestAccess } from '@/lib/guest-portal/public-event-navigation'");
    expect(pageSource).toContain('const hubHref = guestPath(`/evento/hub/${fiestaId}`);');
    expect(pageSource).toContain('const socialHref = guestPath(`/evento/social/${fiestaId}`);');
    expect(pageSource).toContain('const galleryHref = guestPath(`/evento/galeria/${fiestaId}`);');
    expect(pageSource).toContain('const songsHref = guestPath(`/evento/social/${fiestaId}?section=songs`);');
    expect(pageSource).toContain('const barHref = guestPath(`/evento/barra/${fiestaId}`);');
  });

  it('gates optional guest features with portal and contracted-module settings', () => {
    expect(pageSource).toContain('const socialEnabled = gps.showMural !== false');
    expect(pageSource).toContain('const photosEnabled = gps.showFotos !== false');
    expect(pageSource).toContain('const musicEnabled = gps.showMusica !== false');
    expect(pageSource).toContain('const barEnabled = modules?.barraTecnologica === true;');
  });
});

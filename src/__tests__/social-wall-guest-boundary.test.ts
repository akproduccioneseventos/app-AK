import fs from 'node:fs';
import path from 'node:path';

describe('social wall guest and admin boundary', () => {
  const guestPage = fs.readFileSync(
    path.join(process.cwd(), 'src/app/evento/social/[fiestaId]/page.tsx'),
    'utf8'
  );
  const adminPage = fs.readFileSync(
    path.join(process.cwd(), 'src/app/(app)/fiestas/nueva/muro-social/page.tsx'),
    'utf8'
  );
  const publicTotemPage = fs.readFileSync(
    path.join(process.cwd(), 'src/app/evento/totem/[fiestaId]/[totemId]/page.tsx'),
    'utf8'
  );

  it('never promotes the public guest route from an authenticated app session', () => {
    expect(guestPage).not.toContain('getSocialAdminAccess');
    expect(guestPage).toContain('getPublicSocialPosts');
    expect(guestPage).toContain('getPublicSocialEvent');
    expect(guestPage).toContain('getPublicDedications');
    expect(guestPage).not.toContain('deleteSocialPost');
    expect(guestPage).not.toContain('clearGallery');
    expect(guestPage).not.toContain('moderateSocialPost');
    expect(guestPage).not.toContain('saveSocialGallerySettings');
    expect(guestPage).not.toContain("getFiestaById(params.fiestaId)");
    expect(guestPage).not.toContain("urlParams.get('bypass')");
  });

  it('keeps guest tools in explicit, familiar sections', () => {
    expect(guestPage).toContain("type SocialSection = 'feed' | 'songs' | 'dedications' | 'chat' | 'poll' | 'game'");
    expect(guestPage).toContain("label: 'Canciones'");
    expect(guestPage).toContain("label: 'Mensajes'");
    expect(guestPage).toContain("label: 'Chat'");
  });

  it('keeps public totems on approved public event data', () => {
    expect(publicTotemPage).toContain('getPublicSocialEvent');
    expect(publicTotemPage).toContain('getPublicSocialPosts');
    expect(publicTotemPage).not.toContain('getFiestaById');
    expect(publicTotemPage).not.toContain('getSocialPosts(');
  });

  it('keeps the dense administrator controls collapsed by default', () => {
    expect(adminPage).toContain('useState(false)');
    expect(adminPage).toContain('{showAdvancedPanel && (');
    expect(adminPage).toContain('Configuración avanzada');
  });
});

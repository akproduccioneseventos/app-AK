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

  it('never promotes the public guest route from an authenticated app session', () => {
    expect(guestPage).not.toContain('getSocialAdminAccess');
    expect(guestPage).toContain('const isAdminView = false');
    expect(guestPage).toContain('getPublicSocialPosts');
    expect(guestPage).toContain('getPublicSocialEvent');
    expect(guestPage).toContain('getPublicDedications');
    expect(guestPage).not.toContain("getFiestaById(params.fiestaId)");
    expect(guestPage).not.toContain("urlParams.get('bypass')");
  });

  it('opens the guest action menu before any individual module', () => {
    expect(guestPage).toContain(
      "useState<'photos' | 'song' | 'dedication' | 'chat' | 'poll' | 'game' | null>(null)"
    );
  });

  it('keeps the dense administrator controls collapsed by default', () => {
    expect(adminPage).toContain('useState(false)');
    expect(adminPage).toContain('{showAdvancedPanel && (');
    expect(adminPage).toContain('Configuración avanzada');
  });
});

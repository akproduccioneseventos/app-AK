import fs from 'node:fs';
import path from 'node:path';
import { getUruguayParts } from '@/lib/utils';

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('cross-audit regressions for the client and guest social wall', () => {
  it('uses the signed portal session and raw event data for client moderation', () => {
    const source = read('src/app/actions/social-gallery.ts');

    expect(source).toContain('await verifyPortalSession(fiestaId)');
    expect(source).toContain('await getFiestaByIdRaw(fiestaId)');
    expect(source.match(/getClientSocialFiesta\(fiestaId, accessKey\)/g)).toHaveLength(3);
  });

  it('authorizes social writes and honors the event interaction switches', () => {
    const source = read('src/app/actions/social-gallery.ts');

    expect(source).toContain('resolveSocialInteractionContext(currentPost.fiestaId');
    expect(source).toContain('socialGallerySettings?.allowLikes === false');
    expect(source).toContain('socialGallerySettings?.allowComments === false');
    expect(source).toContain('socialGallerySettings?.chatEnabled === false');
    expect(source).toContain('identity: context.access.rateIdentity');
  });

  it('forwards both personal guest access and signed station access from the social UI', () => {
    const source = read('src/app/evento/social/[fiestaId]/page.tsx');

    expect(source).toContain("searchParams.get('guestId')");
    expect(source).toContain("searchParams.get('estacion')");
    expect(source).toContain("formData.append('accessToken', stationAccessToken)");
    expect(source).toContain('addCommentToPost(postId, text, authorName || \'Invitado\', interactionCredentials)');
  });

  it('fails browser routes on any HTTP error and creates the fixture on the Uruguay date', () => {
    const screenAudit = read('tests/e2e/noche-de-fiesta.spec.ts');
    const fixture = read('tests/e2e/helpers/fiesta-de-prueba.ts');

    expect(screenAudit).toContain('respuesta.status() >= 400');
    expect(screenAudit).not.toContain('respuesta.status() >= 500');
    expect(fixture).toContain('getUruguayParts()');
    expect(fixture).not.toContain("new Date().toISOString().split('T')[0]");

    const local = getUruguayParts(new Date('2026-08-02T00:30:00.000Z'));
    expect(local).toMatchObject({ year: 2026, month: 8, day: 1, hour: 21, minute: 30 });
  });
  it('limits internal moderation to NOCHE access for the target event', () => {
    const source = read('src/app/actions/social-gallery.ts');
    const barSource = read('src/app/actions/fiesta/barra-tecnologica.actions.ts');

    expect(source).toContain('await requireEventPermission(fiestaId, PERMISOS.NOCHE)');
    expect(source).toContain('getSocialPostModerationContext(postId)');
    expect(source).toContain('const canModerate = await canModerateSocialEvent(fiestaId)');
    expect(barSource).toContain('createSocialMediaPostFromUrlForStation');
    expect(barSource).toContain("createEntertainmentAccessToken(fiestaId, 'totems', 'guest')");
    expect(barSource).not.toContain('createSocialMediaPostFromUrl({');
  });

});

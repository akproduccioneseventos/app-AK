import fs from 'node:fs';
import path from 'node:path';

describe('client portal authentication boundary', () => {
  const portalPage = fs.readFileSync(
    path.join(process.cwd(), 'src/app/portal-cliente/[id]/page.tsx'),
    'utf8',
  );
  const portalActions = fs.readFileSync(
    path.join(process.cwd(), 'src/app/actions/fiesta/portal.actions.ts'),
    'utf8',
  );
  const socialControlPage = fs.readFileSync(
    path.join(process.cwd(), 'src/app/portal-cliente/[id]/muro-social/page.tsx'),
    'utf8',
  );

  it('validates the password on the server before loading event data', () => {
    expect(portalPage).toContain('initializePortalSession(fiestaId, password)');
    expect(portalPage).toContain('getFiestaForPortalSession(fiestaId)');
    expect(portalPage).not.toContain('password === fiesta?.clientPortalSettings?.accessKey');
    expect(portalPage).not.toContain('getFiestaById(fiestaId)');
  });

  it('limits client writes to portal-session actions', () => {
    expect(portalPage).toContain('updateClientGuestTable');
    expect(portalPage).toContain('updateClientPackingList');
    expect(portalPage).not.toContain('updateInvitado(fiestaId');
    expect(portalPage).not.toContain('updateClienteDebeLlevar(fiestaId');
    expect(portalActions).toContain('if (!(await verifyPortalSession(fiestaId)))');
  });

  it('loads social controls through the client access key instead of an admin reader', () => {
    expect(socialControlPage).toContain('getFiestaByAccessKey(key)');
    expect(socialControlPage).not.toContain('getFiestaById(fiestaId)');
  });
});

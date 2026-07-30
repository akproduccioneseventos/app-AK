import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('provider portal workflow', () => {
  it('keeps provider access management connected to the selected event', () => {
    const adminPage = read('src/app/(app)/fiestas/nueva/proveedores-portal/page.tsx');

    expect(adminPage).toContain('getProveedoresPortal(fiestaId)');
    expect(adminPage).toContain('createProveedorAcceso({');
    expect(adminPage).toContain('/proveedor/acceso/');
    expect(adminPage).toContain('if (!result.success || !result.data)');
  });

  it('authorizes the public page by provider token without loading private event data', () => {
    const providerPage = read('src/app/proveedor/acceso/[token]/page.tsx');

    expect(providerPage).toContain('getProveedorByToken(token)');
    expect(providerPage).toContain('updateProveedorEstado(token');
    expect(providerPage).toContain('toggleTareaProveedor(token');
    expect(providerPage).not.toContain('getFiestaById');
    expect(providerPage).not.toContain('getFiesta');
  });

  it('keeps administrative creation behind the app session and public writes behind the token', () => {
    const actions = read('src/app/actions/provider-portal.ts');

    expect(actions).toMatch(/getProveedoresPortal[\s\S]*requireAppSession/);
    expect(actions).toMatch(/createProveedorAcceso[\s\S]*requireAppSession/);
    expect(actions).toMatch(/updateProveedorEstado[\s\S]*getProveedorByToken\(token\)/);
    expect(actions).toMatch(/toggleTareaProveedor[\s\S]*getProveedorByToken\(token\)/);
  });
});

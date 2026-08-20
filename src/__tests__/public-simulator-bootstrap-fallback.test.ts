import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import fallbackMenus from '@/data/menus-catering.json';
import fallbackServices from '@/data/servicios-empresa.json';

describe('public simulator bootstrap fallback', () => {
  it('ships a usable service and catering catalog with the application', () => {
    expect(fallbackServices.filter((service) => service.tipoItem === 'Servicio').length).toBeGreaterThan(0);
    expect(fallbackMenus.length).toBeGreaterThan(0);
    expect(fallbackMenus.some((menu) => Array.isArray(menu.items) && menu.items.length > 0)).toBe(true);
  });

  it('does not make optional remote settings a single point of failure', () => {
    const source = readFileSync(
      join(process.cwd(), 'src', 'app', 'actions', 'public-simulator-bootstrap.ts'),
      'utf8',
    );

    expect(source).toContain('withBootstrapFallback(getServiciosEmpresaPublicos(), FALLBACK_SERVICES)');
    expect(source).toContain('withBootstrapFallback(getMenusPublicos(), FALLBACK_MENUS)');
    expect(source).toContain('withBootstrapFallback(getSocialConnectionsPublicas(), [])');
    expect(source).toContain('...defaultClubUruguayConfig');
    expect(source).toContain('timeoutMs = 4_500');
  });
});

import fs from 'fs';
import path from 'path';
import { PORTAL_EXTRA_DEFINITIONS } from '@/app/portal/page';

const RAIZ = process.cwd();

describe('El portal ofrece las estaciones de entretenimiento (Orden 181)', () => {
  it('PORTAL_EXTRA_DEFINITIONS incluye Tótem Touch IA, Vogue y Espejo Mágico', () => {
    const ids = PORTAL_EXTRA_DEFINITIONS.map((d) => d.id);
    expect(ids).toContain('totem_touch_ia');
    expect(ids).toContain('vogue_boomerang');
    expect(ids).toContain('espejo_magico');

    const totem = PORTAL_EXTRA_DEFINITIONS.find((d) => d.id === 'totem_touch_ia');
    expect(totem?.titulo).toBe('Tótem Touch IA');
    expect(totem?.aliases).toContain('totem touch');

    const vogue = PORTAL_EXTRA_DEFINITIONS.find((d) => d.id === 'vogue_boomerang');
    expect(vogue?.titulo).toContain('Cabina Vogue');
    expect(vogue?.aliases).toContain('vogue');

    const espejo = PORTAL_EXTRA_DEFINITIONS.find((d) => d.id === 'espejo_magico');
    expect(espejo?.titulo).toBe('Espejo mágico');
    expect(espejo?.aliases).toContain('espejo');
  });

  it('el portal busca los precios dinámicamente desde el catálogo y arma el mensaje de consulta', () => {
    const portalFile = path.join(RAIZ, 'src/app/portal/page.tsx');
    const contenido = fs.readFileSync(portalFile, 'utf8');

    expect(contenido).toContain('getPublicServicePriceLabel');
    expect(contenido).toContain('Mejoras y Extras para tu Fiesta');
    expect(contenido).toContain('buildAkWhatsAppUrl');
  });
});

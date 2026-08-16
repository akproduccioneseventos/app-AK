import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import { PAGINAS_PARA_GOOGLE, SITE_URL } from '@/lib/seo/paginas-publicas';

/**
 * Dos riesgos opuestos, los dos caros:
 *
 * - Que vuelva a quedar todo cerrado y las páginas de venta no aparezcan en
 *   Google, como estuvo hasta el 12 de agosto de 2026.
 * - Que se abra de más y Google indexe el portal de un cliente o la invitación de
 *   una fiesta, con la lista de invitados adentro.
 */

const PROHIBIDAS = [
  '/portal',
  '/portal-cliente',
  '/invitacion',
  '/feedback',
  '/acceso-personal',
  '/video-vida',
  '/post-fiesta',
  '/login',
  '/signup',
  '/contabilidad',
  '/fiestas',
  '/empresa',
  '/settings',
  '/control-tower',
  '/prospectos',
  '/marketing',
  '/compras',
  '/analytics',
  '/secretaria-ak',
  '/presentacion',
  '/presentacion-led',
  '/api',
];

describe('qué puede mostrar Google', () => {
  const regla = robots().rules;
  const primeraRegla = Array.isArray(regla) ? regla[0] : regla;
  const permitidas = ([] as string[]).concat(primeraRegla.allow ?? []);

  it('deja entrar a las páginas de venta', () => {
    expect(permitidas).toContain('/');
    expect(permitidas).toContain('/bodas');
    expect(permitidas).toContain('/quinceaneras');
    expect(permitidas).toContain('/cumpleanos');
    expect(permitidas).toContain('/simulador-de-presupuesto');
  });

  it('deja todo lo demás cerrado por defecto', () => {
    expect(primeraRegla.disallow).toBe('/');
  });

  it('no abre ninguna pantalla interna ni con datos de un cliente', () => {
    for (const prohibida of PROHIBIDAS) {
      const abierta = permitidas.some(
        (permitida) => permitida === prohibida || permitida.startsWith(`${prohibida}/`),
      );
      expect(`${prohibida} abierta a Google: ${abierta}`).toBe(`${prohibida} abierta a Google: false`);
    }
  });

  it('le dice a Google dónde está el listado de páginas', () => {
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });

  it('el listado ofrece exactamente las páginas permitidas, ni una más', () => {
    const enElListado = sitemap().map((entrada) => new URL(entrada.url).pathname);
    const esperadas = PAGINAS_PARA_GOOGLE.map((ruta) => new URL(ruta, SITE_URL).pathname);

    expect(enElListado.sort()).toEqual(esperadas.sort());
  });

  it('todas las direcciones del listado son del sitio de la empresa', () => {
    for (const entrada of sitemap()) {
      expect(entrada.url.startsWith(SITE_URL)).toBe(true);
    }
  });
});

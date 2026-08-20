import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import { PAGINAS_PARA_GOOGLE, SITE_URL } from '@/lib/seo/paginas-publicas';

// El listado ahora pregunta por las notas guardadas. En la prueba se responde con
// una lista fija: lo que se controla aca es que no se cuele nada que no sea
// publico, no de donde salen las notas.
jest.mock('@/app/actions/blog', () => ({
  getBlogPosts: jest.fn().mockResolvedValue([
    { slug: 'como-calcular-bebida-evento-salto' },
    { slug: 'checklist-12-meses-boda-uruguay' },
  ]),
}));

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

  // El listado dejo de ser una lista fija: ahora suma las notas del blog que
  // escribe la inteligencia artificial, que se guardan en la base y no en el
  // codigo. Sin eso, Google no se enteraba nunca de una nota nueva. Lo que sigue
  // valiendo es que no aparezca nada que no sea publico.
  it('el listado ofrece todas las páginas permitidas, y sólo páginas públicas', async () => {
    const enElListado = (await sitemap()).map((entrada) => new URL(entrada.url).pathname);
    const esperadas = PAGINAS_PARA_GOOGLE.map((ruta) => new URL(ruta, SITE_URL).pathname);

    for (const esperada of esperadas) {
      expect(enElListado).toContain(esperada);
    }

    const deMas = enElListado.filter((ruta) => !esperadas.includes(ruta));
    for (const ruta of deMas) {
      expect(ruta.startsWith('/public/blog/')).toBe(true);
    }
  });

  it('todas las direcciones del listado son del sitio de la empresa', async () => {
    for (const entrada of await sitemap()) {
      expect(entrada.url.startsWith(SITE_URL)).toBe(true);
    }
  });
});

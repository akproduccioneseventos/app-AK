import type { MetadataRoute } from 'next';
import { ARCHIVOS_QUE_GOOGLE_LEE, PAGINAS_PARA_GOOGLE, SITE_URL } from '@/lib/seo/paginas-publicas';

/**
 * Lo que Google tiene permitido mirar.
 *
 * Antes acá había un archivo suelto que decía "no indexes nada", de cuando la
 * aplicación era sólo interna. Con eso puesto, ninguna de las páginas de venta
 * podía aparecer en una búsqueda, por más bien escritas que estuvieran.
 *
 * Ahora sigue cerrado por defecto y se abre página por página, para que el portal
 * del cliente, las invitaciones con la lista de invitados y las pantallas del
 * equipo queden afuera. La lista está en `@/lib/seo/paginas-publicas`.
 */
export default function robots(): MetadataRoute.Robots {
  // El blog entero, no nota por nota: las que escribe la inteligencia
  // artificial se guardan en la base y no están en la lista fija, así que
  // sin esto quedaban prohibidas justo las nuevas.
  const allowPublicas = [
    ...PAGINAS_PARA_GOOGLE.map((ruta) => (ruta === '/fiestas' ? '/fiestas$' : ruta)),
    ...ARCHIVOS_QUE_GOOGLE_LEE,
    '/blog/',
  ];

  return {
    rules: [
      ...['Googlebot', 'Bingbot', 'OAI-SearchBot', 'PerplexityBot', 'ClaudeBot'].map((userAgent) => ({
        userAgent,
        allow: allowPublicas,
        disallow: '/',
      })),
      {
        userAgent: '*',
        allow: allowPublicas,
        disallow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

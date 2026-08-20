import type { MetadataRoute } from 'next';
import { PAGINAS_PARA_GOOGLE, SITE_URL } from '@/lib/seo/paginas-publicas';

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
  return {
    rules: [
      {
        userAgent: '*',
        // El blog entero, no nota por nota: las que escribe la inteligencia
        // artificial se guardan en la base y no estan en la lista fija, asi que
        // sin esto quedaban prohibidas justo las nuevas.
        allow: [...PAGINAS_PARA_GOOGLE, '/public/blog/'],
        disallow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

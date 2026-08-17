import type { MetadataRoute } from 'next';
import { PAGINAS_PARA_GOOGLE, SITE_URL } from '@/lib/seo/paginas-publicas';

/**
 * Reglas de rastreo e indexación para Google y buscadores.
 * Permite la indexación completa de todas las páginas de venta y catálogo,
 * mientras protege las rutas internas, paneles administrativos y portales privados de clientes.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [...PAGINAS_PARA_GOOGLE],
        disallow: [
          '/admin/',
          '/api/',
          '/portal/',
          '/portal-cliente/',
          '/portal-invitado/',
          '/evento/',
          '/presupuestos/',
          '/compras/',
          '/login/',
          '/acceso-personal/',
          '/secretaria-ak/',
          '/control-tower/',
          '/recursos-multi-evento/',
          '/recepcion/',
          '/galeria-led/',
          '/post-fiesta/',
          '/video-vida/',
          '/signup/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

import type { MetadataRoute } from 'next';
import {
  PAGINAS_PARA_GOOGLE,
  SITE_URL,
  prioridadDePagina,
} from '@/lib/seo/paginas-publicas';

/**
 * El listado de páginas que se le entrega a Google.
 *
 * Antes no existía: aunque Google hubiera tenido permiso, tenía que encontrar las
 * páginas de casualidad. Sale de la misma lista que los permisos, así que nunca
 * puede ofrecer una página que está prohibida ni olvidarse de una permitida.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const hoy = new Date();

  return PAGINAS_PARA_GOOGLE.map((ruta) => ({
    url: new URL(ruta, SITE_URL).toString(),
    lastModified: hoy,
    changeFrequency: 'weekly' as const,
    priority: prioridadDePagina(ruta),
  }));
}

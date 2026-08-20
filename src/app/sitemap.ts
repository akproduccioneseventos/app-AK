import type { MetadataRoute } from 'next';
import {
  PAGINAS_PARA_GOOGLE,
  SITE_URL,
  prioridadDePagina,
} from '@/lib/seo/paginas-publicas';
import { getBlogPosts } from '@/app/actions/blog';

/**
 * El listado de páginas que se le entrega a Google.
 *
 * Antes no existía: aunque Google hubiera tenido permiso, tenía que encontrar las
 * páginas de casualidad. Sale de la misma lista que los permisos, así que nunca
 * puede ofrecer una página que está prohibida ni olvidarse de una permitida.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const hoy = new Date();

  // Las notas que escribe la inteligencia artificial se guardan en la base, no en
  // el codigo: si el mapa saliera solo de la lista fija, Google no se enteraria
  // nunca de ninguna nota nueva. Se juntan las dos fuentes, sin repetir.
  const notasDeLaBase = await getBlogPosts().catch(() => []);
  const rutasDeNotas = notasDeLaBase.map((nota) => `/public/blog/${nota.slug}`);
  const rutas = Array.from(new Set<string>([...PAGINAS_PARA_GOOGLE, ...rutasDeNotas]));

  return rutas.map((ruta) => ({
    url: new URL(ruta, SITE_URL).toString(),
    lastModified: hoy,
    changeFrequency: 'weekly' as const,
    priority: prioridadDePagina(ruta),
  }));
}

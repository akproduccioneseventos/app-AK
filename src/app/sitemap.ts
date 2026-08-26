import type { MetadataRoute } from 'next';
import {
  PAGINAS_PARA_GOOGLE,
  SITE_URL,
  prioridadDePagina,
} from '@/lib/seo/paginas-publicas';
import { getBlogPosts } from '@/app/actions/blog';
import { blogPosts as staticBlogPosts } from '@/data/blog-posts';

/**
 * El listado de páginas que se le entrega a Google con fechas reales y estables.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const FECHA_SITIO_ESTABLE = new Date('2026-08-26T00:00:00.000Z');

  // Mapa de fechas reales para notas del blog
  const fechasBlog = new Map<string, Date>();
  for (const post of staticBlogPosts) {
    if (post.slug && post.publishedAt) {
      fechasBlog.set(post.slug, new Date(post.publishedAt));
    }
  }

  const notasDeLaBase = await getBlogPosts().catch(() => []);
  for (const nota of notasDeLaBase) {
    if (nota.slug && (nota.publishedAt || (nota as any).createdAt)) {
      fechasBlog.set(nota.slug, new Date(nota.publishedAt || (nota as any).createdAt));
    }
  }

  const rutasDeNotas = notasDeLaBase.map((nota) => `/public/blog/${nota.slug}`);
  const rutas = Array.from(new Set<string>([...PAGINAS_PARA_GOOGLE, ...rutasDeNotas]));

  return rutas.map((ruta) => {
    let lastModified = FECHA_SITIO_ESTABLE;
    if (ruta.startsWith('/public/blog/')) {
      const slug = ruta.replace('/public/blog/', '');
      const fechaNota = fechasBlog.get(slug);
      if (fechaNota) lastModified = fechaNota;
    }

    return {
      url: new URL(ruta, SITE_URL).toString(),
      lastModified,
      changeFrequency: (ruta === '/' ? 'daily' : ruta.startsWith('/public/blog') ? 'monthly' : 'weekly') as 'daily' | 'weekly' | 'monthly',
      priority: prioridadDePagina(ruta),
    };
  });
}

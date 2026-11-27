import type { MetadataRoute } from 'next';
import {
  PAGINAS_PARA_GOOGLE,
  SITE_URL,
  prioridadDePagina,
} from '@/lib/seo/paginas-publicas';
import { getBlogPosts } from '@/app/actions/blog';
import { blogPosts as staticBlogPosts } from '@/data/blog-posts';
import { hoyEnUruguay } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function esNotaPublicableEnSitemap(
  nota: { status?: string; publishedAt?: string },
  hoy: string,
): boolean {
  const estado = String(nota.status || 'published').trim().toLowerCase();
  if (estado === 'draft' || estado === 'borrador' || estado === 'archived' || estado === 'archivado') {
    return false;
  }
  const fecha = String(nota.publishedAt || '').slice(0, 10);
  if (estado === 'scheduled' && (!fecha || fecha > hoy)) {
    return false;
  }
  return !fecha || fecha <= hoy;
}

/**
 * El listado de páginas que se le entrega a Google con fechas reales y estables.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const FECHA_SITIO_ESTABLE = new Date('2026-08-26T00:00:00.000Z');
  const hoy = hoyEnUruguay();

  // Mapa de fechas reales para notas del blog
  const fechasBlog = new Map<string, Date>();
  for (const post of staticBlogPosts) {
    if (post.slug && post.publishedAt && esNotaPublicableEnSitemap(post, hoy)) {
      fechasBlog.set(post.slug, new Date(post.publishedAt));
    }
  }

  const notasDeLaBase = await getBlogPosts().catch(() => []);
  const slugsNoPublicables = new Set<string>();
  const notasPublicadas = [];
  for (const nota of notasDeLaBase) {
    if (!nota?.slug) continue;
    if (!esNotaPublicableEnSitemap(nota, hoy)) {
      slugsNoPublicables.add(nota.slug);
      continue;
    }
    notasPublicadas.push(nota);
    if (nota.publishedAt || (nota as any).createdAt) {
      fechasBlog.set(nota.slug, new Date(nota.publishedAt || (nota as any).createdAt));
    }
  }

  const paginasBase = PAGINAS_PARA_GOOGLE.filter((ruta) => {
    if (!ruta.startsWith('/public/blog/')) return true;
    const slug = ruta.replace('/public/blog/', '');
    return !slugsNoPublicables.has(slug);
  });
  const rutasDeNotas = notasPublicadas.map((nota) => `/public/blog/${nota.slug}`);
  const rutas = Array.from(new Set<string>([...paginasBase, ...rutasDeNotas]));

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

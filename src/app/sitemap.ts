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
    const fechaRaw = (post as any).updatedAt || post.publishedAt || (post as any).createdAt;
    if (post.slug && fechaRaw && esNotaPublicableEnSitemap(post, hoy)) {
      const fecha = new Date(fechaRaw);
      if (!Number.isNaN(fecha.getTime())) {
        fechasBlog.set(post.slug, fecha);
      }
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
    const fechaRaw = (nota as any).updatedAt || nota.publishedAt || (nota as any).createdAt;
    if (fechaRaw) {
      const fecha = new Date(fechaRaw);
      if (!Number.isNaN(fecha.getTime())) {
        fechasBlog.set(nota.slug, fecha);
      }
    }
  }

  const paginasBase = PAGINAS_PARA_GOOGLE.filter((ruta) => {
    if (!ruta.startsWith('/blog/')) return true;
    const slug = ruta.replace('/blog/', '');
    return !slugsNoPublicables.has(slug);
  });
  const rutasDeNotas = notasPublicadas.map((nota) => `/blog/${nota.slug}`);
  const rutas = Array.from(new Set<string>([...paginasBase, ...rutasDeNotas]));

  let fechaMasRecienteBlog: Date | null = null;
  for (const ruta of rutas) {
    if (!ruta.startsWith('/blog/')) continue;
    const slug = ruta.replace('/blog/', '');
    const fechaNota = fechasBlog.get(slug);
    if (fechaNota && (!fechaMasRecienteBlog || fechaNota.getTime() > fechaMasRecienteBlog.getTime())) {
      fechaMasRecienteBlog = fechaNota;
    }
  }

  return rutas.map((ruta) => {
    let lastModified = FECHA_SITIO_ESTABLE;
    if (ruta === '/blog' && fechaMasRecienteBlog) {
      lastModified = fechaMasRecienteBlog;
    } else if (ruta.startsWith('/blog/')) {
      const slug = ruta.replace('/blog/', '');
      const fechaNota = fechasBlog.get(slug);
      if (fechaNota) lastModified = fechaNota;
    }

    return {
      url: new URL(ruta, SITE_URL).toString(),
      lastModified,
      changeFrequency: (ruta === '/' ? 'daily' : ruta.startsWith('/blog') ? 'monthly' : 'weekly') as 'daily' | 'weekly' | 'monthly',
      priority: prioridadDePagina(ruta),
    };
  });
}

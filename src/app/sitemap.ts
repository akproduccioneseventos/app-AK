import type { MetadataRoute } from 'next';
import {
  PAGINAS_PARA_GOOGLE,
  SITE_URL,
  prioridadDePagina,
} from '@/lib/seo/paginas-publicas';

/**
 * The sitemap and robots metadata share the same explicit public-page allowlist.
 * Private portals and internal tools stay excluded by default.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return PAGINAS_PARA_GOOGLE.map((route) => ({
    url: new URL(route, SITE_URL).toString(),
    changeFrequency: 'weekly' as const,
    priority: prioridadDePagina(route),
  }));
}

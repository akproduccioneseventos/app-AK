import type { MetadataRoute } from 'next';
import { getBlogPosts } from '@/app/actions/blog';
import {
  PAGINAS_PARA_GOOGLE,
  SITE_URL,
  prioridadDePagina,
} from '@/lib/seo/paginas-publicas';

function validDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let dynamicBlogPosts: Array<{ slug: string; publishedAt?: string }> = [];
  try {
    const posts = await getBlogPosts();
    if (Array.isArray(posts)) {
      dynamicBlogPosts = posts;
    }
  } catch {
    dynamicBlogPosts = [];
  }

  const staticRoutes: MetadataRoute.Sitemap = PAGINAS_PARA_GOOGLE.map((route) => ({
    url: new URL(route, SITE_URL).toString(),
    changeFrequency: 'weekly' as const,
    priority: prioridadDePagina(route),
  }));

  const uniquePosts = new Map(
    dynamicBlogPosts
      .filter((post) => typeof post.slug === 'string' && post.slug.trim().length > 0)
      .map((post) => [post.slug.trim(), post]),
  );
  const blogRoutes: MetadataRoute.Sitemap = Array.from(uniquePosts.values()).map((post) => {
    const lastModified = validDate(post.publishedAt);
    return {
      url: new URL(`/public/blog/${encodeURIComponent(post.slug.trim())}`, SITE_URL).toString(),
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: 'monthly',
      priority: 0.7,
    };
  });

  return [...staticRoutes, ...blogRoutes];
}

import type { MetadataRoute } from 'next';
import { getBlogPosts } from '@/data/blog-posts';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://akproducciones.uy';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let dynamicBlogPosts: Array<{ slug: string; updatedAt?: string; createdAt?: string }> = [];
  try {
    const posts = await getBlogPosts();
    if (Array.isArray(posts)) {
      dynamicBlogPosts = posts;
    }
  } catch {
    dynamicBlogPosts = [];
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/simulador-de-presupuesto`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/simulador`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/public/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  const blogRoutes: MetadataRoute.Sitemap = dynamicBlogPosts.map((post) => ({
    url: `${BASE_URL}/public/blog/${post.slug}`,
    lastModified: post.updatedAt || post.createdAt ? new Date(post.updatedAt || post.createdAt || '') : new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...blogRoutes];
}

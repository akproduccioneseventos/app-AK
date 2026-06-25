'use server';

import { readData, writeData } from '@/lib/data-service';
import type { BlogPost } from '@/types/blog';

const BLOG_FILE = 'blog-posts.json';

export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    return await readData<BlogPost[]>(BLOG_FILE, []);
  } catch (error) {
    console.error('[blog-actions] Error reading blog posts:', error);
    return [];
  }
}

export async function saveBlogPost(
  post: BlogPost
): Promise<{ success: boolean; error?: string }> {
  try {
    const posts = await getBlogPosts();
    const idx = posts.findIndex(p => p.slug === post.slug);

    if (idx >= 0) {
      posts[idx] = {
        ...post,
        publishedAt: post.publishedAt || new Date().toISOString().split('T')[0]
      };
    } else {
      posts.unshift({
        ...post,
        publishedAt: post.publishedAt || new Date().toISOString().split('T')[0]
      });
    }

    await writeData(BLOG_FILE, posts);
    return { success: true };
  } catch (error: any) {
    console.error('[blog-actions] Error saving blog post:', error);
    return { success: false, error: error.message || 'Error al guardar el artículo.' };
  }
}

export async function deleteBlogPost(
  slug: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const posts = await getBlogPosts();
    const filtered = posts.filter(p => p.slug !== slug);
    await writeData(BLOG_FILE, filtered);
    return { success: true };
  } catch (error: any) {
    console.error('[blog-actions] Error deleting blog post:', error);
    return { success: false, error: error.message || 'Error al eliminar el artículo.' };
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getBlogPosts();
  return posts.find(p => p.slug === slug) || null;
}

export async function getRelatedPosts(post: BlogPost): Promise<BlogPost[]> {
  const posts = await getBlogPosts();
  const related = (post.relatedSlugs || [])
    .map(slug => posts.find(p => p.slug === slug))
    .filter((item): item is BlogPost => Boolean(item));

  if (related.length > 0) return related;
  return posts.filter(item => item.slug !== post.slug && item.category === post.category).slice(0, 2);
}

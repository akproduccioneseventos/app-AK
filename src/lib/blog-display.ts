import type { BlogPost, BlogPostCta } from '@/types/blog';
import { getPostImage } from '@/data/blog-posts';

const DEFAULT_CTA: BlogPostCta = {
  label: 'Simular mi presupuesto',
  href: '/simulador-de-presupuesto',
  message: 'Armá una primera propuesta y después la revisamos juntos.',
};

function isSafeCtaHref(href: string | undefined): href is string {
  if (!href) return false;
  return href.startsWith('/') || href.startsWith('https://wa.me/');
}

export function getBlogPostImage(post: Pick<BlogPost, 'slug' | 'title' | 'category' | 'image'>): string {
  const configured = post.image?.url?.trim();
  return configured || getPostImage(post.slug, post.title, post.category);
}

export function getBlogPostImageAlt(post: Pick<BlogPost, 'title' | 'image'>): string {
  return post.image?.alt?.trim() || post.title;
}

export function getBlogCategoryLabel(category: BlogPost['category']): string {
  if (category === 'Organizacion') return 'Organización';
  if (category === 'XV anos') return 'XV años';
  if (category === 'Checklists') return 'Listas prácticas';
  return category;
}

export function getBlogPostCta(post: Pick<BlogPost, 'cta'>): BlogPostCta {
  if (post.cta?.label?.trim() && isSafeCtaHref(post.cta.href)) {
    return {
      label: post.cta.label.trim(),
      href: post.cta.href,
      message: post.cta.message?.trim(),
    };
  }
  return DEFAULT_CTA;
}

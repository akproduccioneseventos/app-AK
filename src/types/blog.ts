export type BlogCategory = 'Organizacion' | 'Presupuesto' | 'Catering' | 'XV anos' | 'Bodas' | 'Checklists';

export interface BlogPostImage {
  url: string;
  alt?: string;
  source?: 'gemini' | 'catalog' | 'manual';
}

export interface BlogPostCta {
  label: string;
  href: string;
  message?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  readTime: string;
  publishedAt: string;
  accent: string;
  icon: string; // stored as string name of Lucide icon
  takeaway: string;
  sections: Array<{
    heading: string;
    body: string[];
  }>;
  checklist?: string[];
  relatedSlugs?: string[];
  /** Optional so articles saved before the visual blog upgrade remain valid. */
  image?: BlogPostImage;
  /** Optional commercial next step for the individual article. */
  cta?: BlogPostCta;
  /** Stable seed used to avoid generating the same topic again. */
  topicKey?: string;
}

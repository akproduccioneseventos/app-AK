export type BlogCategory = 'Organizacion' | 'Presupuesto' | 'Catering' | 'XV anos' | 'Bodas' | 'Checklists';

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
}

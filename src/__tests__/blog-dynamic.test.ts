import { getBlogPosts, saveBlogPost, deleteBlogPost, getBlogPostBySlug, getRelatedPosts } from '@/app/actions/blog';
import { readData, writeData } from '@/lib/data-service';
import type { BlogPost } from '@/types/blog';

// Mock data-service to isolate tests from actual filesystem
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn(),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue(undefined),
}));

describe('Blog Dinámico - Acciones de Servidor', () => {
  const mockPosts: BlogPost[] = [
    {
      slug: 'test-slug-1',
      title: 'Título de Test 1',
      excerpt: 'Resumen 1',
      category: 'Organizacion',
      readTime: '5 min',
      publishedAt: '2026-06-01',
      accent: 'from-purple-700 to-slate-950',
      icon: 'CalendarCheck',
      takeaway: 'Idea 1',
      sections: [{ heading: 'Heading 1', body: ['Body 1'] }],
      checklist: ['Item 1'],
      relatedSlugs: ['test-slug-2']
    },
    {
      slug: 'test-slug-2',
      title: 'Título de Test 2',
      excerpt: 'Resumen 2',
      category: 'Organizacion',
      readTime: '4 min',
      publishedAt: '2026-06-02',
      accent: 'from-blue-700 to-slate-950',
      icon: 'BookOpen',
      takeaway: 'Idea 2',
      sections: [{ heading: 'Heading 2', body: ['Body 2'] }],
      checklist: ['Item 2'],
      relatedSlugs: []
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getBlogPosts recupera la lista del data-service', async () => {
    (readData as jest.Mock).mockResolvedValue(mockPosts);

    const result = await getBlogPosts();
    expect(readData).toHaveBeenCalledWith('blog-posts.json', []);
    expect(result).toHaveLength(2);
    expect(result[0].slug).toBe('test-slug-1');
  });

  it('saveBlogPost agrega un nuevo post al principio si no existe', async () => {
    (readData as jest.Mock).mockResolvedValue([...mockPosts]);

    const newPost: BlogPost = {
      slug: 'new-slug',
      title: 'Nuevo Título',
      excerpt: 'Nuevo Resumen',
      category: 'Bodas',
      readTime: '6 min',
      publishedAt: '2026-06-03',
      accent: 'from-pink-700 to-slate-950',
      icon: 'Heart',
      takeaway: 'Nueva Idea',
      sections: [{ heading: 'Nuevo Heading', body: ['Nuevo Body'] }]
    };

    const res = await saveBlogPost(newPost);
    expect(res.success).toBe(true);
    expect(writeData).toHaveBeenCalledWith('blog-posts.json', expect.any(Array));

    // Verificamos que el primer elemento de la lista que se guarda es el nuevo post
    const savedList = (writeData as jest.Mock).mock.calls[0][1];
    expect(savedList).toHaveLength(3);
    expect(savedList[0].slug).toBe('new-slug');
  });

  it('saveBlogPost edita el post si ya existe por slug', async () => {
    (readData as jest.Mock).mockResolvedValue([...mockPosts]);

    const updatedPost: BlogPost = {
      ...mockPosts[0],
      title: 'Título Editado'
    };

    const res = await saveBlogPost(updatedPost);
    expect(res.success).toBe(true);

    const savedList = (writeData as jest.Mock).mock.calls[0][1];
    expect(savedList).toHaveLength(2);
    expect(savedList[0].title).toBe('Título Editado');
  });

  it('deleteBlogPost remueve el post por slug', async () => {
    (readData as jest.Mock).mockResolvedValue([...mockPosts]);

    const res = await deleteBlogPost('test-slug-1');
    expect(res.success).toBe(true);

    const savedList = (writeData as jest.Mock).mock.calls[0][1];
    expect(savedList).toHaveLength(1);
    expect(savedList[0].slug).toBe('test-slug-2');
  });

  it('getBlogPostBySlug recupera el post correspondiente', async () => {
    (readData as jest.Mock).mockResolvedValue(mockPosts);

    const post = await getBlogPostBySlug('test-slug-2');
    expect(post).not.toBeNull();
    expect(post?.title).toBe('Título de Test 2');

    const nonExistent = await getBlogPostBySlug('non-existent');
    expect(nonExistent).toBeNull();
  });

  it('getRelatedPosts recupera artículos relacionados por relatedSlugs o misma categoría', async () => {
    (readData as jest.Mock).mockResolvedValue(mockPosts);

    // Caso 1: Tiene relatedSlugs que existen
    const related = await getRelatedPosts(mockPosts[0]);
    expect(related).toHaveLength(1);
    expect(related[0].slug).toBe('test-slug-2');

    // Caso 2: No tiene relatedSlugs, busca de la misma categoría
    const related2 = await getRelatedPosts(mockPosts[1]);
    expect(related2).toHaveLength(1);
    expect(related2[0].slug).toBe('test-slug-1'); // misma categoria (Organizacion)
  });
});

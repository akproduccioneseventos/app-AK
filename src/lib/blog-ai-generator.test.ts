jest.mock('server-only', () => ({}));

jest.mock('@/ai/genkit', () => ({
  ai: { generate: jest.fn() },
  generateWithGeminiFallback: jest.fn(),
  geminiProModel: 'googleai/test-model',
}));
jest.mock('@/lib/data-service', () => ({ readData: jest.fn(), writeData: jest.fn() }));
jest.mock('@/lib/ai/gemini-image', () => ({ generateGeminiImage: jest.fn() }));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn() }));
jest.mock('@/data/blog-posts', () => ({ getPostImage: jest.fn(() => '/media/catalogo-servicios/blog_salon.png') }));

import { generateWithGeminiFallback } from '@/ai/genkit';
import { readData, writeData } from '@/lib/data-service';
import { generateGeminiImage } from '@/lib/ai/gemini-image';
import { uploadToStorage } from '@/lib/firebase/storage';
import { generateBlogPostAndSocialDraft } from './blog-ai-generator';

describe('blog-ai-generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (readData as jest.Mock).mockResolvedValue([]);
    (generateWithGeminiFallback as jest.Mock).mockResolvedValue({
      output: {
        slug: 'guia-de-catering-en-salto',
        title: 'Guia de catering en Salto',
        excerpt: 'Como elegir un menu para disfrutar con tranquilidad.',
        category: 'Catering',
        readTime: '4 min',
        accent: 'from-red-700 to-slate-950',
        icon: 'Utensils',
        takeaway: 'Un menu claro evita sorpresas en el evento.',
        ctaLabel: 'Simular mi catering',
        ctaMessage: 'Arma una propuesta inicial con AK Producciones.',
        sections: [{ heading: 'Menu', body: ['Elegir con tiempo simplifica todo.'] }],
        checklist: ['Confirmar invitados'],
        imagePrompt: 'Mesa de catering elegante lista para una fiesta',
        imageAlt: 'Mesa de catering preparada para un evento',
      },
    });
    (generateGeminiImage as jest.Mock).mockResolvedValue('image-base64');
    (uploadToStorage as jest.Mock).mockResolvedValue('https://storage.googleapis.com/ak/blog-cover.png');
  });

  it('persists an image, a safe CTA and a topic key with the generated article', async () => {
    await generateBlogPostAndSocialDraft();

    const blogWrite = (writeData as jest.Mock).mock.calls.find(([file]) => file === 'blog-posts.json');
    expect(blogWrite).toBeDefined();
    const post = blogWrite[1][0];
    // Las fotos de las notas ya no se inventan: se elige una foto real del
    // catalogo de trabajos. Muestra algo que se puede contratar, le sirve mas a
    // Google que una imagen dibujada, y era la parte cara de cada nota.
    expect(post.image).toEqual({
      url: '/media/catalogo-servicios/catering-mesa-ak-01.jpeg',
      alt: 'Mesa servida por el catering de AK Producciones en una fiesta en Salto',
      source: 'catalog',
    });
    expect(post.cta).toEqual({
      label: 'Simular mi catering',
      href: '/simulador-de-presupuesto',
      message: 'Arma una propuesta inicial con AK Producciones.',
    });
    expect(post.topicKey).toBeTruthy();
    // Ya no se genera ni se sube ninguna imagen: la foto sale del catalogo.
    expect(generateGeminiImage).not.toHaveBeenCalled();
    expect(uploadToStorage).not.toHaveBeenCalled();
  });
});

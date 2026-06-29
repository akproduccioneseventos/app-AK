import 'server-only';

import { z } from 'zod';
import { ai, geminiProModel } from '@/ai/genkit';
import { readData, writeData } from '@/lib/data-service';
import type { BlogPost } from '@/types/blog';
import type { SocialPost } from '@/types/social-media';

const BLOG_FILE = 'blog-posts.json';

const blogPostSchema = z.object({
  slug: z.string().describe('URL friendly slug, e.g. como-organizar-boda-sin-estres'),
  title: z.string().describe('Attractive title for the post'),
  excerpt: z.string().describe('Short 1-2 sentence introduction'),
  category: z.enum(['Organizacion', 'Presupuesto', 'Catering', 'XV anos', 'Bodas', 'Checklists']),
  readTime: z.string().describe('Reading time estimate, e.g. 5 min'),
  accent: z.string().describe('Tailwind gradient classes, e.g. from-purple-700 to-slate-950'),
  icon: z.string().describe('Name of a Lucide icon, e.g. CalendarCheck, Heart, Utensils, ClipboardCheck'),
  takeaway: z.string().describe('Main takeaway or conclusion of the post'),
  sections: z.array(
    z.object({
      heading: z.string().describe('Section subtitle'),
      body: z.array(z.string()).describe('List of paragraphs for this section'),
    })
  ).describe('3 main sections of content'),
  checklist: z.array(z.string()).describe('List of 4-5 practical checklist items'),
  queryImage: z.string().describe('A single simple keyword in English to search for a photo'),
});

const FALLBACK_IMAGES: Record<string, string[]> = {
  Organizacion: [
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200',
    'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=1200',
  ],
  Presupuesto: [
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1200',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200',
  ],
  Catering: [
    'https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=1200',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1200',
  ],
  'XV anos': [
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200',
    'https://images.unsplash.com/photo-1549417229-aa67d3263c09?q=80&w=1200',
  ],
  Bodas: [
    'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200',
    'https://images.unsplash.com/photo-1519225495810-7517cbd14bc4?q=80&w=1200',
  ],
  Checklists: [
    'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=1200',
    'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=1200',
  ],
};

const TOPIC_SEEDS = [
  'tendencias en barras de tragos y cocteleria para eventos nocturnos en Salto',
  'como calcular el presupuesto de catering para una fiesta de 15 anos sin sorpresas',
  'el rol de la iluminacion robotizada y pantallas LED en la atmosfera de un casamiento',
  'ideas originales de animacion y cabinas de fotos para divertir a los invitados',
  'checklist de las 10 cosas clave para coordinar la semana previa a la fiesta',
  'menu formal versus islas de finger food: ventajas del catering moderno',
  'consejos de seguridad, potencia electrica y acustica al elegir tu salon en Uruguay',
  'como armar la distribucion de mesas para que todos los invitados se sientan comodos',
  'ideas creativas de cotillon tecnologico e iluminacion fluorescente para Neon Party',
  'como planificar las tandas de baile y momentos emotivos para mantener la energia alta',
];

async function saveGeneratedBlogPost(post: BlogPost) {
  const posts = await readData<BlogPost[]>(BLOG_FILE, []);
  const idx = posts.findIndex((item) => item.slug === post.slug);
  if (idx >= 0) posts[idx] = post;
  else posts.unshift(post);
  await writeData(BLOG_FILE, posts);
}

export async function generateBlogPostAndSocialDraft() {
  const date = new Date();
  const daySeed = date.getDate() + date.getMonth() * 31 + (date.getFullYear() % 100) * 365;
  const topicIndex = daySeed % TOPIC_SEEDS.length;
  const selectedTopic = TOPIC_SEEDS[topicIndex];

  const prompt = `Genera un articulo de blog educativo y muy util para clientes de eventos sobre: "${selectedTopic}".
El articulo debe ayudar al cliente a tomar decisiones inteligentes y evitar errores costosos en su fiesta en Uruguay, especialmente en Salto.
Redactalo en espanol rioplatense, cercano y natural, usando palabras como "tenes", "salon", "quinceanera", "bodas" y "barra".
Inclui palabras clave de busqueda SEO para posicionamiento en Salto, Uruguay.
Al final, inclui una llamada clara a usar el Simulador de Presupuestos de AK Producciones para disenar su fiesta gratis.
Es obligatorio que el resultado respete el esquema JSON especificado.`;

  const result = await ai.generate({
    model: geminiProModel,
    prompt,
    output: {
      schema: blogPostSchema,
    },
  });

  const generated = result.output;
  if (!generated) {
    throw new Error('La generacion de IA no devolvio contenido estructurado.');
  }

  let imageUrl = '';
  const query = generated.queryImage || 'event';
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

  if (unsplashKey) {
    try {
      const unsplashRes = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${unsplashKey}&per_page=1&orientation=landscape`,
        { next: { revalidate: 0 } }
      );
      if (unsplashRes.ok) {
        const searchData = await unsplashRes.json();
        if (searchData.results?.length > 0) {
          imageUrl = searchData.results[0].urls.regular;
        }
      }
    } catch (error) {
      console.error('[blog-ai-generator] Unsplash fetch failed:', error);
    }
  }

  if (!imageUrl) {
    const categoryList = FALLBACK_IMAGES[generated.category] || FALLBACK_IMAGES.Organizacion;
    const randomIndex = Math.floor(Math.random() * categoryList.length);
    imageUrl = categoryList[randomIndex];
  }

  const post: BlogPost = {
    slug: generated.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    title: generated.title,
    excerpt: generated.excerpt,
    category: generated.category,
    readTime: generated.readTime,
    publishedAt: new Date().toISOString().split('T')[0],
    accent: generated.accent,
    icon: generated.icon,
    takeaway: generated.takeaway,
    sections: generated.sections,
    checklist: generated.checklist,
    relatedSlugs: [],
  };

  await saveGeneratedBlogPost(post);

  const socialText = [
    'Nuevo articulo en nuestro blog:',
    `"${post.title}"`,
    '',
    `Consejo clave: ${post.takeaway}`,
    '',
    `Lee los consejos completos y usa el simulador de presupuestos en https://akproducciones.com/public/blog/${post.slug}`,
    '',
    '#akproducciones #eventos #salto #uruguay #catering #bodas',
  ].join('\n');

  const newSocialPost: SocialPost = {
    id: `post_cron_${Date.now()}`,
    platform: 'Instagram',
    isGeneralCampaign: true,
    publishDate: new Date().toISOString(),
    text: socialText,
    link: `https://akproducciones.com/public/blog/${post.slug}`,
    mediaUrl: imageUrl,
    mediaType: 'image',
    status: 'Programado',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const socialPosts = await readData<SocialPost[]>('social-posts.json', []);
  socialPosts.unshift(newSocialPost);
  await writeData('social-posts.json', socialPosts);

  return {
    blogPost: {
      slug: post.slug,
      title: post.title,
      category: post.category,
    },
    socialPost: {
      id: newSocialPost.id,
      platform: newSocialPost.platform,
    },
  };
}

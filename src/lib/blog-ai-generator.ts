import 'server-only';

import { z } from 'zod';
import { generateWithGeminiFallback, geminiProModel } from '@/ai/genkit';
import { readData, writeData } from '@/lib/data-service';
import { uploadToStorage } from '@/lib/firebase/storage';
import { generateGeminiImage } from '@/lib/ai/gemini-image';
import { getPostImage } from '@/data/blog-posts';
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
  ctaLabel: z.string().describe('Short action label that invites the reader to calculate their event budget with AK'),
  ctaMessage: z.string().describe('Short commercial message that naturally connects the article with AK Producciones'),
  sections: z.array(
    z.object({
      heading: z.string().describe('Section subtitle'),
      body: z.array(z.string()).describe('List of paragraphs for this section'),
    })
  ).describe('3 main sections of content'),
  checklist: z.array(z.string()).describe('List of 4-5 practical checklist items'),
  imagePrompt: z.string().describe('Spanish prompt for a photorealistic, horizontal editorial cover image without text or logos'),
  imageAlt: z.string().describe('Short accessible description in Spanish of the cover image'),
});

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

function normalizeTopic(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function topicIsRepresented(topic: string, post: BlogPost) {
  const topicKey = normalizeTopic(topic);
  if (post.topicKey === topicKey) return true;

  const topicTerms = topicKey.split('-').filter((term) => term.length >= 6);
  const postText = normalizeTopic(`${post.title} ${post.excerpt}`);
  return topicTerms.filter((term) => postText.includes(term)).length >= 2;
}

function selectUnusedTopic(posts: BlogPost[], daySeed: number) {
  for (let offset = 0; offset < TOPIC_SEEDS.length; offset += 1) {
    const topic = TOPIC_SEEDS[(daySeed + offset) % TOPIC_SEEDS.length];
    if (!posts.some((post) => topicIsRepresented(topic, post))) return topic;
  }
  return TOPIC_SEEDS[daySeed % TOPIC_SEEDS.length];
}

function safeSlug(value: string) {
  return normalizeTopic(value).slice(0, 90) || `consejos-ak-${Date.now()}`;
}

async function createBlogImage(options: {
  slug: string;
  title: string;
  category: BlogPost['category'];
  prompt: string;
  alt: string;
}): Promise<NonNullable<BlogPost['image']>> {
  try {
    const base64 = await generateGeminiImage({
      prompt: `${options.prompt}. Fotografia editorial realista para AK Producciones, Salto Uruguay. Formato horizontal 16:9. Sin letras, sin marcas, sin collage.`,
      aspectRatio: '16:9',
      imageSize: '1K',
    });

    if (base64) {
      const imageUrl = await uploadToStorage(
        Buffer.from(base64, 'base64'),
        `public/blog/${options.slug}-${Date.now()}.png`,
        'image/png',
        true,
      );
      return { url: imageUrl, alt: options.alt, source: 'gemini' };
    }
  } catch (error) {
    console.warn('[blog-ai-generator] Gemini image unavailable; using catalog fallback.', error);
  }

  return {
    url: getPostImage(options.slug, options.title, options.category),
    alt: options.alt || options.title,
    source: 'catalog',
  };
}

async function saveGeneratedBlogPost(post: BlogPost, existingPosts?: BlogPost[]) {
  const posts = existingPosts ?? await readData<BlogPost[]>(BLOG_FILE, []);
  const idx = posts.findIndex((item) => item.slug === post.slug);
  if (idx >= 0) posts[idx] = post;
  else posts.unshift(post);
  await writeData(BLOG_FILE, posts);
}

export async function generateBlogPostAndSocialDraft() {
  const existingPosts = [...await readData<BlogPost[]>(BLOG_FILE, [])];
  const date = new Date();
  const daySeed = date.getDate() + date.getMonth() * 31 + (date.getFullYear() % 100) * 365;
  const selectedTopic = selectUnusedTopic(existingPosts, daySeed);
  const selectedTopicKey = normalizeTopic(selectedTopic);

  const prompt = `Genera un articulo de blog educativo y muy util para clientes de eventos sobre: "${selectedTopic}".
El articulo debe ayudar al cliente a tomar decisiones inteligentes y evitar errores costosos en su fiesta en Uruguay, especialmente en Salto.
Redactalo en espanol rioplatense, cercano y natural, usando palabras como "tenes", "salon", "quinceanera", "bodas" y "barra".
Inclui palabras clave de busqueda SEO para posicionamiento en Salto, Uruguay.
Al final, inclui una llamada clara a usar el Simulador de Presupuestos de AK Producciones para disenar su fiesta gratis.
No repitas temas ni enfoques de articulos ya publicados. La portada debe ilustrar el tema, sin texto sobre la imagen.
Es obligatorio que el resultado respete el esquema JSON especificado.`;

  const result = await generateWithGeminiFallback({
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

  const slug = safeSlug(generated.slug || generated.title);
  const image = await createBlogImage({
    slug,
    title: generated.title,
    category: generated.category,
    prompt: generated.imagePrompt,
    alt: generated.imageAlt,
  });

  const post: BlogPost = {
    slug,
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
    image,
    cta: {
      label: generated.ctaLabel.trim().slice(0, 80) || 'Simular mi presupuesto',
      href: '/simulador-de-presupuesto',
      message: generated.ctaMessage.trim().slice(0, 240),
    },
    topicKey: selectedTopicKey,
  };

  await saveGeneratedBlogPost(post, existingPosts);

  const socialText = [
    'Nuevo articulo en nuestro blog:',
    `"${post.title}"`,
    '',
    `Consejo clave: ${post.takeaway}`,
    '',
    `Lee los consejos completos y usa el simulador de presupuestos en https://akproducciones.uy/public/blog/${post.slug}`,
    '',
    '#akproducciones #eventos #salto #uruguay #catering #bodas',
  ].join('\n');

  const newSocialPost: SocialPost = {
    id: `post_cron_${Date.now()}`,
    platform: 'Instagram',
    isGeneralCampaign: true,
    publishDate: new Date().toISOString(),
    text: socialText,
    link: `https://akproducciones.uy/public/blog/${post.slug}`,
    mediaUrl: image.url,
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

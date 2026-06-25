import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ai, geminiProModel } from '@/ai/genkit';
import { saveBlogPost } from '@/app/actions/blog';
import { readData, writeData } from '@/lib/data-service';
import type { BlogPost } from '@/types/blog';
import type { SocialPost } from '@/types/social-media';

// Define the validation and output schema for the AI generation
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
      body: z.array(z.string()).describe('List of paragraphs (strings) for this section')
    })
  ).describe('3 main sections of content'),
  checklist: z.array(z.string()).describe('List of 4-5 practical checklist items'),
  queryImage: z.string().describe('A single simple keyword in English to search for a photo (e.g. "catering", "wedding", "party", "cake")')
});

// A list of fallback curated beautiful Unsplash images for each category to ensure robustness
const FALLBACK_IMAGES: Record<string, string[]> = {
  Organizacion: [
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200',
    'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=1200'
  ],
  Presupuesto: [
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1200',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200'
  ],
  Catering: [
    'https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=1200',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1200'
  ],
  'XV anos': [
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200',
    'https://images.unsplash.com/photo-1549417229-aa67d3263c09?q=80&w=1200'
  ],
  Bodas: [
    'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200',
    'https://images.unsplash.com/photo-1519225495810-7517cbd14bc4?q=80&w=1200'
  ],
  Checklists: [
    'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=1200',
    'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=1200'
  ]
};

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}

async function handleCron(request: Request) {
  try {
    // 1. Authorization Check
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret') || request.headers.get('Authorization')?.replace('Bearer ', '');
    const expectedSecret = process.env.CRON_SECRET || 'nanobanana-secret-key-123';

    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Query Gemini AI using Genkit to generate the structured blog post
    const prompt = `Generá un artículo de blog educativo y valioso sobre organización de eventos, catering, planificación de presupuesto, bodas o fiestas de XV años en Uruguay.
    El artículo debe estar pensado para ayudar al cliente a tomar decisiones inteligentes y evitar errores costosos.
    Incluí palabras clave de búsqueda SEO para posicionamiento en Salto, Uruguay.
    Al final del contenido, incluí una llamada a la acción clara animando al cliente a usar nuestro "Simulador de Presupuestos de AK Producciones" para diseñar su fiesta gratis.
    Firmá sutilmente el post integrando mención al branding y logo de "nanobanana" como sello de garantía.

    Es OBLIGATORIO que el resultado respete el esquema JSON especificado.`;

    const result = await ai.generate({
      model: geminiProModel,
      prompt,
      output: {
        schema: blogPostSchema
      }
    });

    const generated = result.output;
    if (!generated) {
      throw new Error('La generación de la IA no devolvió contenido estructurado.');
    }

    // 3. Search image using Unsplash (or fallback to curated collection)
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
          if (searchData.results && searchData.results.length > 0) {
            imageUrl = searchData.results[0].urls.regular;
          }
        }
      } catch (unsplashErr) {
        console.error('[cron-blog] Unsplash fetch failed:', unsplashErr);
      }
    }

    // Fallback if Unsplash key was missing or fetch failed
    if (!imageUrl) {
      const categoryList = FALLBACK_IMAGES[generated.category] || FALLBACK_IMAGES['Organizacion'];
      const randomIndex = Math.floor(Math.random() * categoryList.length);
      imageUrl = categoryList[randomIndex];
    }

    // 4. Save the generated post to the dynamic database
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
      relatedSlugs: []
    };

    const saveResult = await saveBlogPost(post);
    if (!saveResult.success) {
      throw new Error(saveResult.error || 'Error al guardar el post del blog en data-service.');
    }

    // 5. Generate and schedule a social media promotion post draft
    const socialText = `✨ ¡Nuevo artículo en nuestro blog! ✨\n\n"${post.title}"\n\n💡 Consejo clave: ${post.takeaway}\n\n👉 Leé los consejos completos y jugá con el simulador de presupuestos en nuestra web:\nhttps://akproducciones.com/public/blog/${post.slug}\n\n#nanobanana #akproducciones #eventos #salto #uruguay #catering #bodas`;

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
      updatedAt: new Date().toISOString()
    };

    const socialPosts = await readData<SocialPost[]>('social-posts.json', []);
    socialPosts.unshift(newSocialPost);
    await writeData('social-posts.json', socialPosts);

    return NextResponse.json({
      success: true,
      message: 'Post de blog y borrador de redes sociales generados correctamente por IA.',
      blogPost: {
        slug: post.slug,
        title: post.title,
        category: post.category
      },
      socialPost: {
        id: newSocialPost.id,
        platform: newSocialPost.platform
      }
    });
  } catch (error: any) {
    console.error('[cron-blog] Error running blog generation cron:', error);
    return NextResponse.json(
      { error: error.message || 'Ocurrió un error inesperado al correr el cron de la IA.' },
      { status: 500 }
    );
  }
}

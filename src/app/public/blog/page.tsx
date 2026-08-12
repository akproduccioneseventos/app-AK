import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, MessageSquare, Sparkles } from 'lucide-react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public-footer';
import { getBlogPosts } from '@/app/actions/blog';
import { BlogInteractiveList } from '@/components/public/BlogInteractiveList';
import { blogPosts as defaultBlogPosts } from '@/data/blog-posts';
import { getBlogIcon } from '@/lib/blog-icons';
import { getBlogCategoryLabel, getBlogPostImage, getBlogPostImageAlt } from '@/lib/blog-display';
import { LocalBusinessJsonLd } from '@/components/seo/LocalBusinessJsonLd';

export const metadata: Metadata = {
  title: 'Consejos para organizar eventos | Blog AK Producciones',
  description: 'Guías prácticas para organizar fiestas, XV años, bodas, comida y presupuestos en Salto, Uruguay.',
};

import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

const WHATSAPP_NUMBER = AK_WHATSAPP_NUMBER;
const WHATSAPP_MESSAGE = 'Hola AK Producciones, leí el blog y quiero asesoramiento para organizar mi evento.';

export default async function BlogPage() {
  const postsFromDb = await getBlogPosts().catch(() => []);
  const posts = postsFromDb.length > 0 ? postsFromDb : defaultBlogPosts;
  const featured = posts[0];
  const FeaturedIcon = getBlogIcon(featured.icon);

  return (
    <div className="min-h-screen bg-white font-body text-slate-900">
      <LocalBusinessJsonLd url="https://akproducciones.uy/blog" />
      <PublicNavbar whatsappNumber={WHATSAPP_NUMBER} whatsappMessage={WHATSAPP_MESSAGE} />

      <main>
        <section className="border-b border-slate-200 bg-slate-950 py-14 text-white lg:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-[1.05fr_0.95fr] md:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-100">
                <BookOpen className="h-4 w-4" />
                Blog AK Producciones
              </div>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
                  Consejos claros para decidir mejor tu evento.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                  Guías para elegir salón, menú, presupuesto, tiempos y servicios antes de contratar.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/simulador-de-presupuesto" className="inline-flex items-center justify-center gap-2 rounded-md bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg transition-colors hover:bg-red-600">
                  Simular presupuesto
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-md border border-white/25 px-5 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-white/10">
                  <MessageSquare className="h-4 w-4" />
                  Pedir asesoramiento
                </a>
              </div>
            </div>

            <Link href={`/public/blog/${featured.slug}`} className="group block overflow-hidden rounded-lg border border-white/15 bg-white text-slate-950 shadow-2xl transition hover:-translate-y-1">
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                <Image
                  src={getBlogPostImage(featured)}
                  alt={getBlogPostImageAlt(featured)}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
              <div className="space-y-4 p-6">
                <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-red-700">
                  <FeaturedIcon className="h-3.5 w-3.5" />
                  Artículo destacado
                </p>
                <h2 className="text-2xl font-black leading-tight transition-colors group-hover:text-red-700">{featured.title}</h2>
                <p className="line-clamp-3 text-sm font-medium leading-7 text-slate-600">{featured.excerpt}</p>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-black uppercase tracking-wider text-slate-500">
                  <span>{getBlogCategoryLabel(featured.category)}</span>
                  <span>{featured.readTime}</span>
                </div>
              </div>
            </Link>
          </div>
        </section>

        <section className="bg-white px-4 py-14">
          <div className="mx-auto max-w-6xl space-y-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-red-700">Guías prácticas</p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">Contenido para decidir mejor</h2>
              </div>
              <p className="max-w-xl text-sm font-medium leading-7 text-slate-600">
                Cada artículo responde dudas frecuentes y ayuda a tomar decisiones inteligentes antes de tu evento.
              </p>
            </div>
            <BlogInteractiveList posts={posts} />
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50 px-4 py-12">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-red-700 text-white shadow-md">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">¿Tenés una duda puntual sobre tu evento?</h2>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-7 text-slate-600">
                  Contanos fecha, cantidad de invitados y prioridades. Te orientamos antes de que gastes de más.
                </p>
              </div>
            </div>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-[#25D366] px-5 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg transition hover:bg-[#1eb356]">
              <MessageSquare className="h-4 w-4" />
              Consultar por WhatsApp
            </a>
          </div>
        </section>
      </main>

      <PublicFooter variant="light" />
    </div>
  );
}

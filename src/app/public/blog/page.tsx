import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, MessageSquare, Sparkles } from 'lucide-react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public-footer';
import { CompanyLogo } from '@/components/company-logo';
import * as Lucide from 'lucide-react';
import { getBlogPosts } from '@/app/actions/blog';
import { BlogInteractiveList } from '@/components/public/BlogInteractiveList';
import { blogPosts as defaultBlogPosts, getPostImage } from '@/data/blog-posts';

export const metadata: Metadata = {
  title: 'Consejos para organizar eventos | Blog AK Producciones',
  description:
    'Guías prácticas para organizar fiestas, XV años, bodas, comida y presupuestos sin estrés en Salto, Uruguay.',
};

const WHATSAPP_NUMBER = '59898355530';
const WHATSAPP_MESSAGE = 'Hola AK Producciones, lei el blog y quiero asesoramiento para organizar mi evento.';

function getIconComponent(name: any) {
  if (typeof name !== 'string') return name || Lucide.BookOpen;
  const IconComp = (Lucide as any)[name];
  return IconComp || Lucide.BookOpen;
}

export default async function BlogPage() {
  const postsFromDb = await getBlogPosts();
  const posts = (postsFromDb && postsFromDb.length > 0) ? postsFromDb : defaultBlogPosts;

  const featured = posts[0];
  const latest = posts.slice(1);
  const FeaturedIcon = getIconComponent(featured.icon);

  return (
    <div className="min-h-screen bg-white font-body text-slate-900">
      <PublicNavbar whatsappNumber={WHATSAPP_NUMBER} whatsappMessage={WHATSAPP_MESSAGE} />

      <main>
        <section className="border-b border-slate-200 bg-zinc-950 text-white relative overflow-hidden py-14 lg:py-20">
          <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(2,6,23,0.8)_0%,rgba(9,9,11,0.7)_52%,rgba(24,24,27,0.50)_100%)]" />
          <div className="relative z-10 mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-[1.05fr_0.95fr] md:items-center">

            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-200">
                <BookOpen className="h-4 w-4" />
                Blog AK Producciones
              </div>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
                  Consejos reales para organizar una fiesta sin perder el control.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-355 sm:text-lg">
                  Contenido de valor para elegir salón, menú, presupuesto, tiempos y servicios con información clara antes de contratar.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/simulador-de-presupuesto"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg hover:bg-indigo-500 transition-colors"
                >
                  Simular presupuesto
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-white/10"
                >
                  <MessageSquare className="h-4 w-4" />
                  Pedir asesoramiento
                </a>
              </div>
            </div>

            <Link
              href={`/public/blog/${featured.slug}`}
              className="group block overflow-hidden rounded-[2rem] border border-white/10 bg-white text-slate-950 shadow-2xl transition hover:-translate-y-1 hover:shadow-indigo-950/20"
            >
              <div className="relative h-48 bg-slate-950 p-6 text-white flex flex-col justify-between overflow-hidden">
                <Image
                  src={getPostImage(featured.slug, featured.title, featured.category)}
                  alt={featured.title}
                  fill
                  className="object-cover opacity-60 transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />
                <div className="relative z-10 flex items-start justify-between">
                  <FeaturedIcon className="h-10 w-10 text-indigo-400" />
                  <CompanyLogo size="sm" className="rounded-full bg-white/95 p-1" />
                </div>
              </div>
              <div className="space-y-4 p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600">
                  Artículo destacado
                </p>
                <h2 className="text-2xl font-black leading-tight group-hover:text-indigo-600 transition-colors">
                  {featured.title}
                </h2>
                <p className="text-sm leading-7 text-slate-600 font-medium line-clamp-3">{featured.excerpt}</p>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-black uppercase tracking-wider text-slate-500">
                  <span>{featured.category}</span>
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
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-indigo-600">Guías prácticas</p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">Contenido para decidir mejor</h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-500 font-medium">
                Cada artículo está pensado para responder dudas frecuentes y ayudarte a tomar decisiones inteligentes antes de tu evento.
              </p>
            </div>

            <BlogInteractiveList posts={posts} />
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50 px-4 py-12">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">¿Tenés una duda puntual sobre tu evento?</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500 font-medium">
                  Leemos tu caso, cantidad de invitados, fecha tentativa y prioridades. Te orientamos antes de que gastes de más.
                </p>
              </div>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg transition hover:bg-[#1eb356]"
            >
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

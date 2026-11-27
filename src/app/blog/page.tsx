import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, Calculator, Clock, MessageSquare, Sparkles } from 'lucide-react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public-footer';
import { getBlogPosts } from '@/app/actions/blog';
import { BlogInteractiveList } from '@/components/public/BlogInteractiveList';
import { UltimasNotasExternas } from '@/components/public/UltimasNotasExternas';
import { SuscripcionBlogForm } from '@/components/public/SuscripcionBlogForm';
import { blogPosts as defaultBlogPosts } from '@/data/blog-posts';
import { getBlogIcon } from '@/lib/blog-icons';
import { getBlogCategoryLabel, getBlogPostImage, getBlogPostImageAlt } from '@/lib/blog-display';
import { getUltimasNotasExternas } from '@/lib/blog/ultimas-notas';
import { LocalBusinessJsonLd } from '@/components/seo/LocalBusinessJsonLd';
import { BotonComoFunciona } from '@/components/tutorial/BotonComoFunciona';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';
import { notasDelBlogParaMostrar } from '@/lib/blog/notas-para-mostrar';
import { hoyEnUruguay } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL('https://akproducciones.uy'),
  title: 'Consejos para organizar fiestas',
  description: 'Guías prácticas para organizar fiestas de 15, bodas, comida gourmet, discoteca y presupuestos en Salto, Uruguay.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'Consejos para organizar fiestas en Salto | Blog AK Producciones Eventos',
    description: 'Guías prácticas para organizar fiestas de 15, bodas, comida gourmet, discoteca y presupuestos en Salto, Uruguay.',
    url: 'https://akproducciones.uy/blog',
    siteName: 'AK Producciones Eventos',
    locale: 'es_UY',
    type: 'website',
    images: [
      {
        url: '/media/catalogo-servicios/salon-discoteca-ak-01.jpeg',
        width: 1200,
        height: 630,
        alt: 'Blog de AK Producciones',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Consejos para organizar fiestas en Salto | Blog AK Producciones Eventos',
    description: 'Guías prácticas para organizar fiestas en Salto, Uruguay.',
    images: ['/media/catalogo-servicios/salon-discoteca-ak-01.jpeg'],
  },
};

const WHATSAPP_NUMBER = AK_WHATSAPP_NUMBER;
const WHATSAPP_MESSAGE = 'Hola AK Producciones, leí el blog y quiero asesoramiento para organizar mi evento.';

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: Promise<{ baja?: string }>;
}) {
  const [postsFromDb, notasExternas, params] = await Promise.all([
    getBlogPosts().catch(() => []),
    getUltimasNotasExternas(3).catch(() => []),
    searchParams ? searchParams.catch(() => ({} as { baja?: string })) : Promise.resolve({} as { baja?: string }),
  ]);
  const estadoBaja = params?.baja;
  const posts = notasDelBlogParaMostrar(postsFromDb, defaultBlogPosts, hoyEnUruguay());
  const featured = posts[0];
  const FeaturedIcon = getBlogIcon(featured.icon);

  return (
    <div className="min-h-screen overflow-x-clip bg-white font-body text-slate-900">
      <LocalBusinessJsonLd url="https://akproducciones.uy/blog" />
      <PublicNavbar whatsappNumber={WHATSAPP_NUMBER} whatsappMessage={WHATSAPP_MESSAGE} />

      <main>
        {estadoBaja === 'ok' && (
          <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-900">
            Te dimos de baja correctamente. No vas a recibir más mails del blog de AK Producciones.
          </div>
        )}
        {estadoBaja === 'error' && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-900">
            No pudimos procesar la baja porque el enlace ya fue usado o no es válido.
          </div>
        )}
        <section className="border-b border-slate-200 bg-slate-950 py-14 text-white lg:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-[1.05fr_0.95fr] md:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-slate-100">
                <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Revista y Guías · AK Producciones
              </div>
              <div className="space-y-4">
                <h1 className="max-w-3xl font-headline text-4xl font-black leading-tight sm:text-5xl">
                  Consejos claros para decidir mejor tu fiesta.
                </h1>
                <div>
                  <BotonComoFunciona clave="blog-consejos" variant="dark" />
                </div>
                <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                  Guías prácticas sobre salón, comida, discoteca, tiempos y servicio integral para planificar tu fiesta completa con tranquilidad en Salto.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/simulador-de-presupuesto"
                  className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg transition-colors hover:bg-red-600"
                >
                  <span className="truncate">Simular presupuesto</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Link>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-white/10"
                >
                  <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">Pedir asesoramiento</span>
                </a>
              </div>
            </div>

            <Link
              href={`/blog/${featured.slug}`}
              className="group block overflow-hidden rounded-2xl border border-white/15 bg-white text-slate-950 shadow-2xl transition duration-300 hover:-translate-y-1"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                <Image
                  src={getBlogPostImage(featured)}
                  alt={getBlogPostImageAlt(featured)}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
                <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
                  <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-red-700 shadow-sm">
                    <FeaturedIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">Artículo destacado</span>
                  </span>
                  {featured.tipoNota === 'tendencia' && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-900 shadow-sm">
                      Tendencias
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-4 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-500">
                  <span className="uppercase tracking-wider text-red-700">{getBlogCategoryLabel(featured.category)}</span>
                  <span className="inline-flex shrink-0 items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                    {featured.readTime}
                  </span>
                </div>
                <h2 className="text-2xl font-black leading-tight transition-colors group-hover:text-red-700">{featured.title}</h2>
                <p className="line-clamp-3 text-sm font-medium leading-7 text-slate-600">{featured.excerpt}</p>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-black uppercase tracking-wider text-red-700">
                  <span>Leer guía destacada</span>
                  <ArrowRight className="h-4 w-4 shrink-0 transition duration-300 group-hover:translate-x-1" aria-hidden="true" />
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
                <h2 className="mt-2 font-headline text-3xl font-black text-slate-950">Contenido para decidir mejor</h2>
              </div>
              <p className="max-w-xl text-sm font-medium leading-7 text-slate-600">
                Cada artículo responde dudas reales y te ayuda a organizar salón, comida, discoteca y tiempos todo en un solo lugar.
              </p>
            </div>
            <BlogInteractiveList posts={posts} />
          </div>
        </section>

        <section className="bg-slate-50 px-4 py-10">
          <div className="mx-auto flex max-w-5xl flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700 ring-1 ring-red-100">
                <Calculator className="h-6 w-6 shrink-0" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-red-700">Paso siguiente sugerido</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">¿Querés llevar estas ideas a números reales?</h2>
                <p className="mt-1.5 max-w-2xl text-sm font-medium leading-6 text-slate-600">
                  Elegí invitados, comida, discoteca y servicios en pesos uruguayos para tener una referencia clara de tu fiesta completa.
                </p>
              </div>
            </div>
            <Link
              href="/simulador-de-presupuesto"
              className="inline-flex min-w-0 shrink-0 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-red-800"
            >
              <span className="truncate">Simular mi presupuesto sin compromiso</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <UltimasNotasExternas notas={notasExternas} />

        <section className="bg-white px-4 py-12">
          <div className="mx-auto max-w-3xl">
            <SuscripcionBlogForm />
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50 px-4 py-12">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-700 text-white shadow-md">
                <Sparkles className="h-6 w-6 shrink-0" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">¿Tenés una duda puntual sobre tu evento?</h2>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-7 text-slate-600">
                  Contanos fecha, cantidad de invitados y prioridades. Te orientamos antes de que gastes de más.
                </p>
              </div>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-0 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg transition hover:bg-[#1eb356]"
            >
              <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">Consultar por WhatsApp</span>
            </a>
          </div>
        </section>
      </main>

      <PublicFooter variant="light" />
    </div>
  );
}

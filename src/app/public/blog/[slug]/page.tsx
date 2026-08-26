import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, MessageSquare, Timer } from 'lucide-react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public-footer';
import { CompanyLogo } from '@/components/company-logo';
import { getBlogPosts, getBlogPostBySlug, getRelatedPosts } from '@/app/actions/blog';
import { BlogFaq } from '@/components/public/BlogFaq';
import { blogPosts as defaultBlogPosts } from '@/data/blog-posts';
import { getBlogIcon } from '@/lib/blog-icons';
import { getBlogCategoryLabel, getBlogPostCta, getBlogPostImage, getBlogPostImageAlt } from '@/lib/blog-display';

interface Props {
  params: Promise<{ slug: string }>;
}

import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

const WHATSAPP_NUMBER = AK_WHATSAPP_NUMBER;

export async function generateStaticParams() {
  const postsFromDb = await getBlogPosts();
  const posts = (postsFromDb && postsFromDb.length > 0) ? postsFromDb : defaultBlogPosts;
  return posts.map((post) => ({ slug: post.slug }));
}

import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let post = await getBlogPostBySlug(slug);
  if (!post) {
    post = defaultBlogPosts.find((p) => p.slug === slug) || null;
  }
  if (!post) return { title: 'Blog AK Producciones Eventos' };

  const image = getBlogPostImage(post);
  const url = `https://akproducciones.uy/public/blog/${slug}`;

  return {
    metadataBase: new URL('https://akproducciones.uy'),
    title: `${post.title} | Blog AK Producciones Eventos`,
    description: post.excerpt,
    alternates: {
      canonical: `/public/blog/${slug}`,
    },
    openGraph: {
      title: `${post.title} | Blog AK Producciones Eventos`,
      description: post.excerpt,
      url,
      siteName: 'AK Producciones Eventos',
      locale: 'es_UY',
      type: 'article',
      publishedTime: post.publishedAt,
      images: [{ url: image, width: 1200, height: 630, alt: getBlogPostImageAlt(post) }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title} | Blog AK Producciones Eventos`,
      description: post.excerpt,
      images: [image],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  let post = await getBlogPostBySlug(slug);
  if (!post) {
    post = defaultBlogPosts.find(p => p.slug === slug) || null;
  }

  if (!post) notFound();

  const Icon = getBlogIcon(post.icon);
  
  // Get related posts
  let relatedFromDb = await getRelatedPosts(post);
  if (!relatedFromDb || relatedFromDb.length === 0) {
    // Local fallback for related posts
    relatedFromDb = defaultBlogPosts
      .filter((item) => item.slug !== post!.slug && item.category === post!.category)
      .slice(0, 2);
  }

  const whatsappMessage = `Hola AK Producciones, lei el articulo "${post.title}" y quiero asesoramiento para mi evento.`;
  const articleCta = getBlogPostCta(post);

  return (
    <div className="min-h-screen bg-white font-body text-slate-900">
      <ArticleJsonLd
        url={`https://akproducciones.uy/public/blog/${post.slug}`}
        title={post.title}
        description={post.excerpt}
        image={getBlogPostImage(post)}
        datePublished={post.publishedAt || '2026-08-20T00:00:00.000Z'}
      />
      <PublicNavbar whatsappNumber={WHATSAPP_NUMBER} whatsappMessage={whatsappMessage} />

      <main>
        <section className="relative overflow-hidden bg-zinc-950 text-white py-12 lg:py-16 border-b border-white/5">
          {/* Real image background with custom overlay */}
          <Image
            src={getBlogPostImage(post)}
            alt={getBlogPostImageAlt(post)}
            fill
            className="object-cover opacity-30"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900/85 to-zinc-950/45" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] opacity-35" />
          
          <div className="relative z-10 mx-auto max-w-4xl px-4">
            <div className="flex items-center justify-between mb-8">
              <Link
                href="/public/blog"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-wider text-white/95 transition hover:bg-white/15"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al blog
              </Link>
              
              <div className="flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                AK Staff
              </div>
            </div>
 
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em]">
                  {getBlogCategoryLabel(post.category)}
                  <span className="h-1 w-1 rounded-full bg-white/50" />
                  <Timer className="h-3.5 w-3.5" />
                  {post.readTime}
                </div>
                <h1 className="text-4xl font-black leading-tight sm:text-5xl">{post.title}</h1>
                <p className="text-lg leading-8 text-white/85">{post.excerpt}</p>
              </div>
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-red-300 shadow-xl backdrop-blur-sm">
                <Icon className="h-10 w-10" />
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white px-4 py-10">
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_280px]">
            <article className="space-y-10">
              <div className="rounded-lg border border-red-100 bg-red-50/50 p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-red-700">Idea principal</p>
                <p className="mt-3 text-xl font-black leading-8 text-slate-950">{post.takeaway}</p>
              </div>

              {post.sections?.map((section) => (
                <section key={section.heading} className="space-y-4">
                  <h2 className="text-2xl font-black text-slate-950">{section.heading}</h2>
                  <div className="space-y-4">
                    {section.body?.map((paragraph) => (
                      <p key={paragraph} className="text-base leading-8 text-slate-700 font-medium">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}

              {post.checklist && post.checklist.length > 0 && (
                <section className="rounded-lg border border-slate-200 bg-slate-50 p-6">
                  <h2 className="text-2xl font-black text-slate-950">Checklist práctico</h2>
                  <ul className="mt-5 space-y-3">
                    {post.checklist.map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-7 text-slate-700 font-medium">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </article>

            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <CompanyLogo size="md" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">AK Eventos</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-950">¿Lo vemos juntos?</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600 font-medium">
                    Mandanos tu fecha tentativa, invitados y tipo de evento. Te ayudamos a ordenar opciones al instante.
                  </p>
                </div>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:bg-[#1eb356]"
                >
                  <MessageSquare className="h-4 w-4" />
                  Chatear por WhatsApp
                </a>
              </div>
 
              <Link
                href={articleCta.href}
                className="group block overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-700">Herramienta interactiva</span>
                    <span className="rounded bg-red-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-red-800">Gratis</span>
                  </div>
                  <h2 className="text-xl font-black leading-tight text-slate-950 transition-colors duration-200 group-hover:text-red-700">
                    Probá el simulador de presupuestos
                  </h2>
                  <p className="text-xs leading-5 text-slate-600 font-medium">
                    Calculá una base exacta jugando con los servicios y la comida, y ajustala después profesionalmente con nosotros.
                  </p>
                  <div className="flex items-center gap-1.5 pt-2 text-xs font-black uppercase tracking-wider text-red-700">
                    Comenzar simulación
                    <ArrowRight className="h-3.5 w-3.5 transition duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>

              {/* FAQs Accordion */}
              <BlogFaq />
            </aside>
          </div>
        </section>

        {relatedFromDb.length > 0 && (
          <section className="bg-slate-50 px-4 py-12">
            <div className="mx-auto max-w-5xl space-y-6">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-red-700">Seguir leyendo</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">Consejos relacionados</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {relatedFromDb.map((item) => {
                  const RelatedIcon = getBlogIcon(item.icon);
                  return (
                    <Link
                      key={item.slug}
                      href={`/public/blog/${item.slug}`}
                      className="group flex w-full min-w-0 gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-red-200 hover:shadow-lg"
                    >
                      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-950 text-white">
                        <Image
                          src={getBlogPostImage(item)}
                          alt={getBlogPostImageAlt(item)}
                          fill
                          className="object-cover opacity-50"
                          sizes="56px"
                        />
                        <div className="relative z-10 text-white">
                          <RelatedIcon className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{getBlogCategoryLabel(item.category)}</p>
                        <h3 className="mt-1 truncate font-black leading-snug text-slate-950 group-hover:text-red-700" title={item.title}>{item.title}</h3>
                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-red-700">
                          Leer
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      <PublicFooter variant="light" />
    </div>
  );
}

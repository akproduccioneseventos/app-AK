import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public-footer';
import { CompanyLogo } from '@/components/company-logo';
import * as Lucide from 'lucide-react';
import { getBlogPosts, getBlogPostBySlug, getRelatedPosts } from '@/app/actions/blog';
import { BlogFaq } from '@/components/public/BlogFaq';

interface Props {
  params: Promise<{ slug: string }>;
}

const WHATSAPP_NUMBER = '59898355530';

function getIconComponent(name: string) {
  const IconComp = (Lucide as any)[name];
  return IconComp || Lucide.BookOpen;
}

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: 'Blog AK Producciones' };

  return {
    title: `${post.title} | Blog AK Producciones`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) notFound();

  const Icon = getIconComponent(post.icon);
  const related = await getRelatedPosts(post);
  const whatsappMessage = `Hola AK Producciones, lei el articulo "${post.title}" y quiero asesoramiento para mi evento.`;

  return (
    <div className="min-h-screen bg-white font-body text-slate-900">
      <PublicNavbar whatsappNumber={WHATSAPP_NUMBER} whatsappMessage={whatsappMessage} />

      <main>
        <section className={`relative overflow-hidden bg-gradient-to-br ${post.accent} text-white`}>
          {/* Overlay de cuadrícula estética y brillo */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] opacity-50" />
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          
          <div className="relative z-10 mx-auto max-w-4xl px-4 py-12 lg:py-16">
            <div className="flex items-center justify-between mb-8">
              <Link
                href="/public/blog"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-wider text-white/90 transition hover:bg-white/15"
              >
                <Lucide.ArrowLeft className="h-4 w-4" />
                Volver al blog
              </Link>
              
              {/* Sello de nanobanana AI en cabecera */}
              <div className="flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                nanobanana AI
              </div>
            </div>
 
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em]">
                  {post.category}
                  <span className="h-1 w-1 rounded-full bg-white/50" />
                  <Lucide.Timer className="h-3.5 w-3.5" />
                  {post.readTime}
                </div>
                <h1 className="text-4xl font-black leading-tight sm:text-5xl">{post.title}</h1>
                <p className="text-lg leading-8 text-white/85">{post.excerpt}</p>
              </div>
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[2rem] border border-white/20 bg-white/15 backdrop-blur-sm shadow-xl">
                <Icon className="h-12 w-12" />
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white px-4 py-10">
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_280px]">
            <article className="space-y-10">
              <div className="rounded-3xl border border-purple-100 bg-purple-50 p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-purple-700">Idea principal</p>
                <p className="mt-3 text-xl font-black leading-8 text-slate-950">{post.takeaway}</p>
              </div>

              {post.sections.map((section) => (
                <section key={section.heading} className="space-y-4">
                  <h2 className="text-2xl font-black text-slate-950">{section.heading}</h2>
                  <div className="space-y-4">
                    {section.body.map((paragraph) => (
                      <p key={paragraph} className="text-base leading-8 text-slate-700">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}

              {post.checklist && (
                <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <h2 className="text-2xl font-black text-slate-950">Checklist practico</h2>
                  <ul className="mt-5 space-y-3">
                    {post.checklist.map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-7 text-slate-700">
                        <Lucide.CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </article>

            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <CompanyLogo size="md" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">AK Eventos</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-950">¿Lo vemos juntos?</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Mandanos tu fecha tentativa, invitados y tipo de evento. Te ayudamos a ordenar opciones al instante.
                  </p>
                </div>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:bg-[#1eb356] hover:-translate-y-0.5 duration-200"
                >
                  <Lucide.MessageSquare className="h-4 w-4" />
                  Chatear por WhatsApp
                </a>
              </div>
 
              <Link
                href="/simulador-de-presupuesto"
                className="group relative block overflow-hidden rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50 p-6 transition-all duration-300 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-900/5 hover:-translate-y-1"
              >
                {/* Cuadrícula de fondo sutil */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(147,51,234,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(147,51,234,0.02)_1px,transparent_1px)] bg-[size:15px_15px] opacity-70" />
                
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-700">Herramienta interactiva</span>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-purple-200/50 text-purple-800 px-2 py-0.5 rounded">Gratis</span>
                  </div>
                  <h2 className="text-xl font-black leading-tight text-slate-950 group-hover:text-purple-700 transition-colors duration-200">
                    Probá el simulador de presupuestos
                  </h2>
                  <p className="text-xs leading-5 text-slate-600">
                    Calculá una base exacta jugando con los servicios y la comida, y ajustala después profesionalmente con nosotros.
                  </p>
                  <div className="pt-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-purple-700">
                    Comenzar simulación
                    <Lucide.ArrowRight className="h-3.5 w-3.5 transition duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>

              {/* Acordeón de FAQs Cliente */}
              <BlogFaq />
            </aside>
          </div>
        </section>

        {related.length > 0 && (
          <section className="bg-slate-50 px-4 py-12">
            <div className="mx-auto max-w-5xl space-y-6">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-purple-700">Seguir leyendo</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">Consejos relacionados</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {related.map((item) => {
                  const RelatedIcon = getIconComponent(item.icon);
                  return (
                    <Link
                      key={item.slug}
                      href={`/public/blog/${item.slug}`}
                      className="group flex gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-purple-200 hover:shadow-lg"
                    >
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-white`}>
                        <RelatedIcon className="h-7 w-7" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{item.category}</p>
                        <h3 className="mt-1 font-black leading-snug text-slate-950 group-hover:text-purple-700">{item.title}</h3>
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-purple-700">
                          Leer
                          <Lucide.ArrowRight className="h-3.5 w-3.5" />
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

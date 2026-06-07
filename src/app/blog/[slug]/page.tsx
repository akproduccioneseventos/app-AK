'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckSquare,
  Sparkles,
  BookOpen,
  ChevronRight,
  BookHeart,
} from 'lucide-react';
import { blogPosts, type BlogPost } from '@/data/blog-posts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// Simulated Facebook imported post storage (fallback if slug matches import slug)
const MOCK_IMPORTED_POST: BlogPost = {
  slug: 'evento-exitoso-salto-uruguay',
  title: 'Claves de un evento exitoso en Salto, Uruguay',
  excerpt: 'Sincronizado e inspirado de tu última publicación de Facebook. Optimizamos el contenido para SEO local.',
  category: 'Organizacion',
  readTime: '3 min',
  publishedAt: new Date().toISOString().split('T')[0],
  accent: 'from-blue-600 to-indigo-950',
  icon: Sparkles,
  takeaway: 'La organización local y los detalles del catering son indispensables en el litoral.',
  sections: [
    {
      heading: 'La diferencia está en la planificación coordinada',
      body: [
        'En AK Producciones nos encargamos de que cada detalle de decoración y pista de baile esté 100% sincronizado.',
        'No te preocupes por coordinar 10 proveedores por separado. Nosotros te entregamos la fiesta lista para disfrutar.',
      ],
    },
  ],
  checklist: [
    'Verificar salón disponible en Salto.',
    'Coordinar catering integral con anticipación.',
    'Revisar los requerimientos de la pantalla LED.',
  ],
};

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const post = useMemo(() => {
    if (slug === MOCK_IMPORTED_POST.slug) return MOCK_IMPORTED_POST;
    return blogPosts.find((p) => p.slug === slug) ?? null;
  }, [slug]);

  const relatedPosts = useMemo(() => {
    if (!post) return [];
    const related = (post.relatedSlugs ?? [])
      .map((s) => blogPosts.find((p) => p.slug === s))
      .filter((p): p is BlogPost => p !== undefined);
    return related.slice(0, 2);
  }, [post]);

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <BookOpen className="h-16 w-16 text-indigo-400 animate-pulse mb-4" />
        <h1 className="text-2xl font-black">Artículo no encontrado</h1>
        <p className="text-white/60 text-sm mt-1">El post de blog solicitado no existe.</p>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"><Link href="/blog" className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Blog
          </Link></Button>
      </div>
    );
  }

  const PostIcon = post.icon || BookOpen;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white font-sans pb-24">
      {/* Decorative Blur Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 h-[400px] w-[400px] rounded-full bg-indigo-600/5 blur-[120px]" />
        <div className="absolute bottom-20 right-10 h-[400px] w-[400px] rounded-full bg-emerald-600/5 blur-[120px]" />
      </div>

      {/* Header Bar */}
      <header className="relative border-b border-white/10 backdrop-blur-md bg-slate-950/40 z-20">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="text-white/70 hover:text-white font-bold gap-1"><Link href="/blog">
              <ArrowLeft className="h-4 w-4" />
              Volver al Blog
            </Link></Button>
          <span className="text-xs font-black text-white/40 tracking-wider">AK PRODUCCIONES BLOG</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-4xl mx-auto px-4 pt-16 z-10 space-y-12">
        {/* Post Title Area */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Badge className="border border-white/20 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-emerald-300">
              {post.category}
            </Badge>
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <Clock className="h-3.5 w-3.5" />
              <span>{post.readTime} de lectura</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <Calendar className="h-3.5 w-3.5" />
              <span>{post.publishedAt}</span>
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            {post.title}
          </h1>

          <p className="text-lg text-white/70 font-semibold leading-relaxed border-l-2 border-indigo-500 pl-4 py-1">
            {post.excerpt}
          </p>
        </div>

        {/* Takeaway / Key Highlight Box */}
        {post.takeaway && (
          <div className="rounded-3xl p-6 bg-gradient-to-br from-indigo-500/20 to-indigo-600/5 border border-indigo-500/20 relative overflow-hidden flex gap-4 items-start">
            <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-500/10 rounded-bl-3xl flex items-center justify-center">
              <PostIcon className="h-6 w-6 text-indigo-300" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-wider text-indigo-400">Punto Clave</p>
              <p className="text-sm font-bold text-white/90 leading-relaxed max-w-2xl">{post.takeaway}</p>
            </div>
          </div>
        )}

        {/* Post Body Sections */}
        <article className="space-y-8 leading-relaxed text-white/80">
          {post.sections.map((section, idx) => (
            <div key={idx} className="space-y-4">
              <h2 className="text-xl md:text-2xl font-black text-white">{section.heading}</h2>
              {section.body.map((para, pIdx) => (
                <p key={pIdx} className="text-base leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          ))}
        </article>

        {/* Checklist Section if it exists */}
        {post.checklist && post.checklist.length > 0 && (
          <Card className="border border-white/10 bg-slate-900/40 backdrop-blur-xl rounded-3xl overflow-hidden shadow-xl">
            <CardContent className="p-6 md:p-8 space-y-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-emerald-400" />
                Plan de acción sugerido
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {post.checklist.map((item, cIdx) => (
                  <li
                    key={cIdx}
                    className="flex gap-2.5 items-start p-3 bg-white/5 rounded-xl border border-white/5 text-sm text-white/80"
                  >
                    <span className="shrink-0 h-5 w-5 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] text-emerald-400 font-bold">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* CTA section */}
        <div className="text-center p-8 rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 space-y-4">
          <h4 className="text-xl font-black">¿Querés que organicemos tu evento?</h4>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Ponete en contacto con el equipo de AK Producciones y simulemos tu presupuesto en vivo de manera instantánea.
          </p>
          <div className="flex justify-center gap-3">
            <Button asChild className="bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl px-6 h-11"><Link href="/simulador-de-presupuesto">
                Simular mi Fiesta
              </Link></Button>
            <a
              href={`https://wa.me/59898355530?text=${encodeURIComponent(
                `Hola AK Producciones, leí su artículo "${post.title}" y me interesa cotizar.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                className="border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl px-6 h-11"
              >
                Hablar por WhatsApp
              </Button>
            </a>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="border-t border-white/10 pt-12 space-y-6">
            <h3 className="text-xl font-black flex items-center gap-2">
              <BookHeart className="h-5 w-5 text-indigo-400" />
              Artículos sugeridos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedPosts.map((rPost) => (
                <Link key={rPost.slug} href={`/blog/${rPost.slug}`} className="block group">
                  <div className="h-full border border-white/5 hover:border-indigo-500/30 bg-white/5 p-5 rounded-2xl transition-all duration-300">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                      {rPost.category}
                    </span>
                    <h4 className="font-black text-white group-hover:text-indigo-300 transition-colors mt-1 line-clamp-2 leading-tight">
                      {rPost.title}
                    </h4>
                    <p className="text-xs text-white/50 mt-2 line-clamp-2 leading-relaxed">
                      {rPost.excerpt}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-indigo-400 font-bold mt-4 group-hover:text-indigo-300 group-hover:translate-x-1 transition-all">
                      Leer artículo <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

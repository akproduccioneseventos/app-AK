'use client';

import Link from 'next/link';
import Image from 'next/image';
import * as Lucide from 'lucide-react';
import type { BlogPost } from '@/types/blog';
import { getPostImage } from '@/data/blog-posts';

interface Props {
  posts: BlogPost[];
}

function getIconComponent(name: any) {
  if (typeof name !== 'string') return name || Lucide.BookOpen;
  const IconComp = (Lucide as any)[name];
  return IconComp || Lucide.BookOpen;
}

export function BlogInteractiveList({ posts }: Props) {
  return (
    <div className="space-y-10">
      {/* Grid Animada de Artículos */}
      {posts.length === 0 ? (
        <div className="flex min-h-[250px] flex-col items-center justify-center space-y-4 rounded-3xl border border-dashed border-slate-200 p-8">
          <Lucide.Inbox className="h-10 w-10 text-slate-300 animate-pulse" />
          <p className="text-slate-500 font-bold text-sm text-center">No encontramos artículos por el momento.</p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 transition-all duration-500">
          {posts.map((post) => {
            const Icon = getIconComponent(post.icon);
            return (
              <Link
                key={post.slug}
                href={`/public/blog/${post.slug}`}
                className="group flex min-h-[420px] flex-col justify-between rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-2xl hover:border-purple-100 hover:shadow-indigo-500/5 transition-all duration-300 overflow-hidden"
              >
                {/* Portada con Imagen Real */}
                <div className="relative h-48 w-full bg-slate-950 overflow-hidden text-white flex flex-col justify-between p-5">
                  <Image
                    src={getPostImage(post.slug)}
                    alt={post.title}
                    fill
                    className="object-cover opacity-60 transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 30vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Badge de Autorización */}
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    AK Staff
                  </div>

                  <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 border border-white/10 text-white backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="relative z-10 flex items-center justify-between mt-auto">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-md">{post.category}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/90">{post.readTime}</span>
                  </div>
                </div>

                {/* Contenido */}
                <div className="flex-1 p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-xl font-black leading-tight text-slate-950 group-hover:text-indigo-600 transition-colors duration-300">
                      {post.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-500 font-medium line-clamp-3">{post.excerpt}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                    <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-600 group-hover:text-slate-950 transition-colors">
                      Leer Guía
                      <Lucide.ArrowRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1.5" />
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">{post.publishedAt}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

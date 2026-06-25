'use client';

import { useState } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import type { BlogPost, BlogCategory } from '@/types/blog';

interface Props {
  posts: BlogPost[];
}

const CATEGORIES: { label: string; value: BlogCategory | 'Todos' }[] = [
  { label: 'Todos', value: 'Todos' },
  { label: 'Organización', value: 'Organizacion' },
  { label: 'Presupuestos', value: 'Presupuesto' },
  { label: 'Catering', value: 'Catering' },
  { label: 'Checklists', value: 'Checklists' },
  { label: 'Bodas', value: 'Bodas' },
  { label: 'XV Años', value: 'XV anos' }
];

function getIconComponent(name: string) {
  const IconComp = (Lucide as any)[name];
  return IconComp || Lucide.BookOpen;
}

export function BlogInteractiveList({ posts }: Props) {
  const [activeCategory, setActiveCategory] = useState<BlogCategory | 'Todos'>('Todos');

  const filteredPosts = activeCategory === 'Todos'
    ? posts
    : posts.filter(post => post.category === activeCategory);

  return (
    <div className="space-y-10">
      {/* Selector de Categorías (Tabs Premium) */}
      <div className="flex flex-wrap gap-2 justify-start border-b border-slate-100 pb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              activeCategory === cat.value
                ? 'bg-purple-700 text-white shadow-md shadow-purple-200 scale-105'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid Animada de Artículos */}
      {filteredPosts.length === 0 ? (
        <div className="flex min-h-[250px] flex-col items-center justify-center space-y-4 rounded-3xl border border-dashed border-slate-200 p-8">
          <Lucide.Inbox className="h-10 w-10 text-slate-300 animate-pulse" />
          <p className="text-slate-500 font-bold text-sm text-center">No encontramos artículos en esta categoría por el momento.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 transition-all duration-500">
          {filteredPosts.map((post) => {
            const Icon = getIconComponent(post.icon);
            return (
              <Link
                key={post.slug}
                href={`/public/blog/${post.slug}`}
                className="group flex min-h-[380px] flex-col justify-between rounded-[2rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-purple-200 hover:shadow-2xl hover:shadow-purple-900/5 overflow-hidden"
              >
                {/* Portada Estilizada con el Badge de nanobanana AI */}
                <div className={`relative h-44 w-full bg-gradient-to-br ${post.accent} p-5 text-white flex flex-col justify-between overflow-hidden`}>
                  {/* Overlay de diseño de cuadrícula */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] opacity-40" />
                  
                  {/* Badge nanobanana AI en la esquina superior derecha */}
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-white/95 group-hover:bg-white/20 transition-all duration-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                    nanobanana AI
                  </div>

                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 border border-white/10 text-white backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-7 w-7" />
                  </div>
                  
                  <div className="relative z-10 flex items-center justify-between mt-auto">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-black/25 backdrop-blur-sm px-2.5 py-1 rounded-md">{post.category}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/80">{post.readTime}</span>
                  </div>
                </div>

                {/* Contenido */}
                <div className="flex-1 p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-xl font-black leading-tight text-slate-950 group-hover:text-purple-700 transition-colors duration-300">
                      {post.title}
                    </h3>
                    <p className="text-sm leading-7 text-slate-600 line-clamp-3">{post.excerpt}</p>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                    <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-700">
                      Leer consejo
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

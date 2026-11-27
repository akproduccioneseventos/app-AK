'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock, Inbox } from 'lucide-react';
import type { BlogPost } from '@/types/blog';
import { getBlogIcon } from '@/lib/blog-icons';
import { getBlogCategoryLabel, getBlogPostImage, getBlogPostImageAlt } from '@/lib/blog-display';

interface Props {
  posts: BlogPost[];
}

export function BlogInteractiveList({ posts }: Props) {
  if (posts.length === 0) {
    return (
      <div className="flex min-h-[250px] flex-col items-center justify-center space-y-4 rounded-2xl border border-dashed border-slate-200 p-8">
        <Inbox className="h-10 w-10 shrink-0 text-slate-300" aria-hidden="true" />
        <p className="text-center text-sm font-bold text-slate-500">No encontramos artículos por el momento.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-7 transition-all duration-500 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => {
        const Icon = getBlogIcon(post.icon);
        return (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex min-h-[430px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
              <Image
                src={getBlogPostImage(post)}
                alt={getBlogPostImageAlt(post)}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
              <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
                <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-red-700 shadow-sm">
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{getBlogCategoryLabel(post.category)}</span>
                </span>
                {post.tipoNota === 'tendencia' && (
                  <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-900 shadow-sm">
                    Tendencias
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between space-y-4 p-5 sm:p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-[11px] font-bold text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                    <span>{post.readTime}</span>
                  </span>
                  <time dateTime={post.publishedAt} className="shrink-0 text-slate-400">
                    {post.publishedAt}
                  </time>
                </div>
                <h3 className="text-xl font-black leading-snug text-slate-950 transition-colors duration-300 group-hover:text-red-700">
                  {post.title}
                </h3>
                <p className="line-clamp-3 text-sm font-medium leading-relaxed text-slate-600">{post.excerpt}</p>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-red-700 transition-colors group-hover:text-slate-950">
                  Leer guía completa
                  <ArrowRight className="h-4 w-4 shrink-0 transition duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

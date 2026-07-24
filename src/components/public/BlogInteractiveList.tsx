'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Inbox } from 'lucide-react';
import type { BlogPost } from '@/types/blog';
import { getBlogIcon } from '@/lib/blog-icons';
import { getBlogCategoryLabel, getBlogPostImage, getBlogPostImageAlt } from '@/lib/blog-display';

interface Props {
  posts: BlogPost[];
}

export function BlogInteractiveList({ posts }: Props) {
  if (posts.length === 0) {
    return (
      <div className="flex min-h-[250px] flex-col items-center justify-center space-y-4 rounded-lg border border-dashed border-slate-200 p-8">
        <Inbox className="h-10 w-10 text-slate-300" />
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
            href={`/public/blog/${post.slug}`}
            className="group flex min-h-[430px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
              <Image
                src={getBlogPostImage(post)}
                alt={getBlogPostImageAlt(post)}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 100vw, 30vw"
              />
            </div>

            <div className="flex flex-1 flex-col justify-between space-y-4 p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                  <span className="inline-flex items-center gap-2 text-red-700">
                    <Icon className="h-3.5 w-3.5" />
                    {getBlogCategoryLabel(post.category)}
                  </span>
                  <span>{post.readTime}</span>
                </div>
                <h3 className="text-xl font-black leading-tight text-slate-950 transition-colors duration-300 group-hover:text-red-700">
                  {post.title}
                </h3>
                <p className="line-clamp-3 text-sm font-medium leading-relaxed text-slate-600">{post.excerpt}</p>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-red-700 transition-colors group-hover:text-slate-950">
                  Leer artículo
                  <ArrowRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1.5" />
                </span>
                <span className="text-[10px] font-bold text-slate-400">{post.publishedAt}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { blogPosts } from "@/data/blog-posts";
import { getBlogIcon } from "@/lib/blog-icons";
import { getBlogCategoryLabel, getBlogPostImage, getBlogPostImageAlt } from "@/lib/blog-display";
import type { BlogPost } from "@/types/blog";

interface BlogSectionProps {
  posts?: BlogPost[];
}

export function BlogSection({ posts }: BlogSectionProps) {
  const postsToShow = (posts?.length ? posts : blogPosts).slice(0, 3);
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <section id="blog" className="overflow-hidden border-y border-slate-200 bg-white py-24 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-md border border-red-100 bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-red-700">
              <BookOpen className="h-3.5 w-3.5" />
              Consejos AK
            </span>
            <h2 className="font-headline text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
              Contenido para planificar tu evento sin estrés
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Guías simples sobre presupuesto, comida, XV años, bodas y listas de organización.
            </p>
          </div>
          <Link
            href="/public/blog"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-6 py-3.5 text-xs font-black uppercase tracking-widest text-slate-950 transition-all hover:scale-[1.02] hover:border-slate-400 hover:bg-slate-50 active:scale-95"
          >
            Ver todos los artículos
            <ArrowRight className="h-4 w-4 text-red-700" />
          </Link>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-8 md:grid-cols-3"
        >
          {postsToShow.map((post) => {
            const Icon = getBlogIcon(post.icon);
            return (
              <motion.div key={post.slug} variants={cardVariants} className="h-full">
                <Link
                  href={`/public/blog/${post.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    <Image
                      src={getBlogPostImage(post)}
                      alt={getBlogPostImageAlt(post)}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between space-y-6 p-7">
                    <div>
                      <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-700">
                        <Icon className="h-3.5 w-3.5" />
                        {getBlogCategoryLabel(post.category)} - {post.readTime}
                      </span>
                      <h3 className="mt-3 text-xl font-black leading-tight text-slate-950 transition-colors duration-200 group-hover:text-red-700">
                        {post.title}
                      </h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{post.excerpt}</p>
                    </div>
                    <div className="mt-8 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs font-black uppercase tracking-wider text-red-700 transition-colors group-hover:text-slate-950">
                      <span>Leer artículo</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

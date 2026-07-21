"use client";

import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { blogPosts } from "@/data/blog-posts";
import { getBlogIcon } from "@/lib/blog-icons";

export function BlogSection() {
  const postsToShow = blogPosts.slice(0, 3);
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <section
      id="blog"
      className="overflow-hidden border-y border-white/5 bg-zinc-950 py-24 text-white"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-black uppercase tracking-widest text-red-400">
              <BookOpen className="h-3.5 w-3.5" />
              Consejos AK
            </span>
            <h2 className="font-headline text-4xl font-black leading-tight text-white sm:text-5xl">
              Contenido para planificar tu evento sin estrés
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-zinc-400">
              Leé guías simples redactadas por nuestros coordinadores sobre
              presupuesto, comida, XV años, bodas y checklists de organización.
            </p>
          </div>
          <Link
            href="/public/blog"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:scale-[1.02] hover:border-white/20 hover:bg-white/10 active:scale-95"
          >
            Ver todos los artículos
            <ArrowRight className="h-4 w-4 text-red-400" />
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
              <motion.div
                key={post.slug}
                variants={cardVariants}
                className="h-full"
              >
                <Link
                  href={`/public/blog/${post.slug}`}
                  className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8 shadow-xl transition-all duration-300 hover:bg-white/[0.04] hover:shadow-2xl"
                >
                  <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="space-y-6">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${post.accent} text-white shadow-lg`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                        {post.category} • {post.readTime}
                      </span>
                      <h3 className="mt-3 text-xl font-black leading-tight text-white transition-colors duration-200 group-hover:text-red-400">
                        {post.title}
                      </h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-400">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>
                  <div className="mt-8 flex items-center gap-2 border-t border-white/5 pt-4 text-xs font-black uppercase tracking-wider text-red-400 transition-colors group-hover:text-white">
                    <span>Leer artículo</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
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

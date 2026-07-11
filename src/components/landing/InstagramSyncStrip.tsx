'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Camera, Instagram, PlayCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InstagramSyncItem {
  id: string;
  type: 'photo' | 'video';
  imageUrl: string;
  title: string;
  category?: string;
  href?: string;
}

interface InstagramSyncStripProps {
  handle: string;
  profileUrl: string;
  items: InstagramSyncItem[];
}

function canUseNextImage(url: string) {
  return url.startsWith('/') || url.startsWith('https://images.unsplash.com/');
}

export function InstagramSyncStrip({ handle, profileUrl, items }: InstagramSyncStripProps) {
  const reduceMotion = useReducedMotion();
  const visibleItems = items.slice(0, 8);

  return (
    <section id="instagram" className="relative overflow-hidden border-y border-white/10 bg-zinc-950 py-20 text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <motion.span
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              className="mb-4 inline-flex items-center gap-2 rounded-xl border border-pink-300/20 bg-pink-500/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-pink-200"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Instagram conectado
            </motion.span>
            <motion.h2
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="font-headline text-4xl font-black leading-tight sm:text-6xl"
            >
              La web muestra material listo para redes
            </motion.h2>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-zinc-400 sm:text-base">
              La galería pública toma fotos y videos aprobados de la app y los vincula con el perfil conectado para mantener prueba social fresca sin duplicar cargas.
            </p>
          </div>

          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-black uppercase tracking-wider text-white transition-all hover:-translate-y-0.5 hover:border-pink-300/40 hover:bg-white/10"
          >
            <Instagram className="h-5 w-5 text-pink-300" />
            {handle}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          whileInView={reduceMotion ? undefined : { opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {visibleItems.map((item, index) => {
            const card = (
              <motion.article
                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.25), ease: 'easeOut' }}
                whileHover={reduceMotion ? undefined : { y: -6 }}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/25"
              >
                {canUseNextImage(item.imageUrl) ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/45 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur">
                  {item.type === 'video' ? <PlayCircle className="h-3.5 w-3.5 text-pink-200" /> : <Camera className="h-3.5 w-3.5 text-pink-200" />}
                  {item.type === 'video' ? 'Reel' : 'Foto'}
                </div>
                <div className="absolute bottom-0 left-0 right-0 space-y-2 p-4">
                  <p className="line-clamp-2 text-sm font-black leading-tight text-white">{item.title}</p>
                  {item.category && <p className="text-[10px] font-black uppercase tracking-widest text-pink-200">{item.category}</p>}
                </div>
              </motion.article>
            );

            return item.href ? (
              <a key={item.id} href={item.href} target="_blank" rel="noopener noreferrer" className={cn('block focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded-2xl')}>
                {card}
              </a>
            ) : (
              <div key={item.id}>{card}</div>
            );
          })}
        </motion.div>

        <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300 sm:flex-row sm:items-center sm:justify-between">
          <span>Al actualizar la galería o la conexión social, esta sección acompaña el cambio automáticamente.</span>
          <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-black uppercase tracking-wider text-pink-200 hover:text-pink-100">
            Ver más en Instagram
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

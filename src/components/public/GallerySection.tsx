'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { SUAVE, contenedorCascada, itemCascada } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { AK_SOCIAL_LINKS } from '@/lib/public-contact';
import type { GalleryImage } from '@/types/public-landing';

interface GallerySectionProps {
  images: GalleryImage[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export function GallerySection({
  images,
  title = 'Galería de eventos',
  subtitle = 'Momentos reales de nuestros clientes más felices.',
  className,
}: GallerySectionProps) {
  if (!images.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, ease: SUAVE }}
      className={cn('py-20 px-4 bg-slate-50', className)}
    >
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-black uppercase tracking-[0.3em] text-purple-500 mb-3">
            Galería
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">{title}</h2>
          <p className="mt-3 text-slate-500 max-w-xl mx-auto">{subtitle}</p>
        </div>

        {/* Masonry-like grid */}
        <motion.div
          variants={contenedorCascada}
          initial="oculto"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 auto-rows-[200px]"
        >
          {images.map((img) => (
            <motion.div
              variants={itemCascada}
              key={img.id}
              tabIndex={0}
              role="img"
              aria-label={img.alt}
              className={cn(
                'relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100',
                'group cursor-pointer shadow-sm hover:shadow-lg transition-shadow duration-300',
                'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/50',
                img.size === 'wide' && 'col-span-2'
              )}
            >
              {/* Placeholder gradient when no real image is available */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-200/60 to-pink-200/60" />

              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw"
                unoptimized
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />

              {/* Caption on hover */}
              <div
                className={cn(
                  'absolute inset-0 flex items-end p-3',
                  'bg-gradient-to-t from-black/50 to-transparent',
                  'opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                )}
              >
                <span className="text-white text-xs font-bold drop-shadow">{img.alt}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <p className="text-center mt-8 text-sm text-slate-400">
          📸 Seguinos en{' '}
          <a
            href={AK_SOCIAL_LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-500 font-bold hover:underline"
          >
            @akproduccionesfiestasyeventos
          </a>{' '}
          para ver más.
        </p>
      </div>
    </motion.section>
  );
}

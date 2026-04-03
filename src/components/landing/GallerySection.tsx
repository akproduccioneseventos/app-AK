'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GalleryImage {
  src: string;
  alt: string;
  hint: string;
  category?: string;
}

const DEFAULT_GALLERY: GalleryImage[] = [
  {
    src: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80&auto=format&fit=crop',
    alt: 'Decoración de boda',
    hint: 'wedding decoration flowers',
    category: 'Bodas',
  },
  {
    src: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80&auto=format&fit=crop',
    alt: 'Mesa de bodas iluminada',
    hint: 'wedding reception table',
    category: 'Bodas',
  },
  {
    src: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80&auto=format&fit=crop',
    alt: 'Fiesta de XV años',
    hint: 'quinceañera celebration',
    category: 'XV Años',
  },
  {
    src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80&auto=format&fit=crop',
    alt: 'Salón decorado con luces',
    hint: 'event hall lights decoration',
    category: 'Eventos',
  },
  {
    src: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80&auto=format&fit=crop',
    alt: 'Torta de celebración',
    hint: 'celebration cake',
    category: 'XV Años',
  },
  {
    src: 'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?w=800&q=80&auto=format&fit=crop',
    alt: 'Fiesta colorida',
    hint: 'colorful party',
    category: 'Eventos',
  },
  {
    src: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80&auto=format&fit=crop',
    alt: 'Boda romántica',
    hint: 'romantic wedding ceremony',
    category: 'Bodas',
  },
  {
    src: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800&q=80&auto=format&fit=crop',
    alt: 'Pareja bailando',
    hint: 'couple dancing event',
    category: 'Bodas',
  },
  {
    src: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80&auto=format&fit=crop',
    alt: 'Pista de baile con luces',
    hint: 'dance floor colorful lights',
    category: 'Eventos',
  },
];

const ALL_CATEGORIES = ['Todos', 'Bodas', 'XV Años', 'Eventos'];

interface GallerySectionProps {
  images?: GalleryImage[];
}

export function GallerySection({ images = DEFAULT_GALLERY }: GallerySectionProps) {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered = activeCategory === 'Todos' ? images : images.filter((img) => img.category === activeCategory);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () => setLightboxIndex((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length));
  const nextImage = () => setLightboxIndex((i) => (i === null ? null : (i + 1) % filtered.length));

  return (
    <section id="galeria" className="py-24 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-pink-400 mb-4">Nuestro trabajo</p>
          <h2 className="font-headline text-5xl sm:text-6xl font-black text-white leading-tight mb-6">Galería</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Cada foto cuenta una historia. Descubrí la magia que creamos en cada evento.
          </p>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-black uppercase tracking-wider transition-all duration-200',
                activeCategory === cat
                  ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {filtered.map((image, index) => (
            <button
              key={image.src}
              onClick={() => openLightbox(index)}
              className="relative aspect-square rounded-2xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 33vw"
                data-ai-hint={image.hint}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div
            className="relative max-w-4xl max-h-[85vh] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={filtered[lightboxIndex].src}
              alt={filtered[lightboxIndex].alt}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-bold">
            {lightboxIndex + 1} / {filtered.length}
          </div>
        </div>
      )}
    </section>
  );
}

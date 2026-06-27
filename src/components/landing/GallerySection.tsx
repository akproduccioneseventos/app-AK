'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Camera, X, ZoomIn, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { GaleriaFoto } from '@/types/galeria';

function isNextJsOptimizableUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return (
      hostname === 'images.unsplash.com' ||
      hostname === 'img.youtube.com' ||
      hostname === 'placehold.co' ||
      hostname === 'picsum.photos' ||
      hostname === 'i.imgur.com'
    );
  } catch {
    return false;
  }
}

export interface GalleryImage {
  id?: string;
  src: string;
  alt: string;
  hint: string;
  category?: string;
  titulo?: string;
  descripcion?: string;
  destacada?: boolean;
}

interface LandingGalleryItem {
  id: string;
  src: string;
  alt: string;
  hint: string;
  titulo?: string;
  descripcion?: string;
  destacada?: boolean;
  servicio: string;
}

const CATEGORY_FILTERS = [
  'Todos',
  'Salón',
  'Decoración',
  'Gastronomía',
  'Discoteca & Luces',
  'Fotografía',
];

function getGrupoCategoria(servicio: string): string {
  const lower = servicio.toLowerCase();
  if (lower.includes('salon') || lower.includes('salón') || lower.includes('club')) {
    return 'Salón';
  }
  if (lower.includes('decor') || lower.includes('ambient') || lower.includes('candy') || lower.includes('mesa principal') || lower.includes('glitter')) {
    return 'Decoración';
  }
  if (lower.includes('comida') || lower.includes('catering') || lower.includes('menu') || lower.includes('menú') || lower.includes('gastro') || lower.includes('trago') || lower.includes('bebida') || lower.includes('bar')) {
    return 'Gastronomía';
  }
  if (lower.includes('disco') || lower.includes('luz') || lower.includes('luces') || lower.includes('pantalla') || lower.includes('led') || lower.includes('dj') || lower.includes('sonido') || lower.includes('pista')) {
    return 'Discoteca & Luces';
  }
  if (lower.includes('foto') || lower.includes('video') || lower.includes('exteriores') || lower.includes('film') || lower.includes('bogue') || lower.includes('espejo') || lower.includes('cabina') || lower.includes('plataforma') || lower.includes('touchpix')) {
    return 'Fotografía';
  }
  return 'General';
}

interface GallerySectionProps {
  images?: GalleryImage[];
  galeriaFotos?: GaleriaFoto[];
}

export function GallerySection({ images, galeriaFotos }: GallerySectionProps) {
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [showAll, setShowAll] = useState<boolean>(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const allImages = useMemo<LandingGalleryItem[]>(() => {
    const source = (galeriaFotos?.length ?? 0) > 0
      ? galeriaFotos!.map((foto) => ({
          id: foto.id,
          src: foto.url,
          alt: foto.titulo ?? foto.categoria ?? 'Imagen de galería',
          hint: foto.categoria ?? 'event gallery',
          titulo: foto.titulo,
          descripcion: foto.descripcion,
          destacada: foto.destacada,
          servicio: getGrupoCategoria(foto.categoria || foto.servicio || 'General'),
        }))
      : (images ?? []).map((image, index) => ({
          id: image.id ?? `img-${index}`,
          src: image.src,
          alt: image.alt,
          hint: image.hint,
          titulo: image.titulo,
          descripcion: image.descripcion,
          destacada: image.destacada,
          servicio: getGrupoCategoria(image.category || 'General'),
        }));

    // Evitar duplicados basados en el URL de la imagen
    const seenUrls = new Set<string>();
    const uniqueSource = source.filter((item) => {
      if (seenUrls.has(item.src)) return false;
      seenUrls.add(item.src);
      return true;
    });

    return uniqueSource.sort((a, b) => (b.destacada ? 1 : 0) - (a.destacada ? 1 : 0));
  }, [galeriaFotos, images]);

  const filtered = useMemo(() => {
    if (activeCategory === 'Todos') return allImages;
    return allImages.filter((img) => img.servicio === activeCategory);
  }, [allImages, activeCategory]);

  // Limitar a las primeras 8 fotos destacadas si no se expandió
  const displayedImages = useMemo(() => {
    if (showAll) return filtered;
    return filtered.slice(0, 8);
  }, [filtered, showAll]);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () => setLightboxIndex((i) => (i === null ? null : (i - 1 + displayedImages.length) % displayedImages.length));
  const nextImage = () => setLightboxIndex((i) => (i === null ? null : (i + 1) % displayedImages.length));

  const handleShareWhatsApp = (image: LandingGalleryItem) => {
    const text = encodeURIComponent(`¡Mirá esta foto de ${image.servicio} de AK Producciones! ${image.src}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.96, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  };

  return (
    <section id="galeria" data-testid="gallery-section" className="py-24 bg-zinc-950 text-white border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-indigo-400 mb-4">
            <Camera className="w-3.5 h-3.5" />
            Nuestros Trabajos
          </span>
          <h2 className="font-headline text-5xl sm:text-6xl font-black text-white leading-tight mb-4">
            Galería de Fotos
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
            Una selección de momentos reales, montajes de gala, ambientaciones y tecnología en las fiestas que producimos.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-10 p-1.5 rounded-2xl bg-white/[0.02] border border-white/5 max-w-2xl mx-auto">
          {CATEGORY_FILTERS.map((category) => (
            <button
              key={category}
              onClick={() => {
                setActiveCategory(category);
                setShowAll(false);
              }}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200',
                activeCategory === category
                  ? 'bg-white text-zinc-950 shadow-md'
                  : 'bg-transparent text-zinc-400 hover:bg-white/5 hover:text-white'
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Snap Grid: aspect-square responsivo sin recortes extraños */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {displayedImages.map((image, index) => (
            <motion.button
              key={image.id}
              variants={cardVariants}
              onClick={() => openLightbox(index)}
              className="relative rounded-3xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-zinc-900 border border-white/5 aspect-square text-left shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-103"
                sizes="(max-width: 768px) 50vw, 25vw"
                unoptimized={!isNextJsOptimizableUrl(image.src)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent" />

              {image.destacada && (
                <div className="absolute top-4 left-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[9px] font-black px-3 py-1 rounded-xl shadow-md uppercase tracking-wider">
                  ★ Destacada
                </div>
              )}
              <div className="absolute top-4 right-4 bg-zinc-950/80 border border-white/10 text-white text-[9px] font-black px-3 py-1 rounded-xl shadow-md uppercase tracking-wider">
                {image.servicio}
              </div>

              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-sm font-black text-white leading-tight line-clamp-2">
                  {image.titulo || image.alt || 'Fiesta AK'}
                </p>
                {image.descripcion && (
                  <p className="text-[10px] text-zinc-400 mt-1 line-clamp-1">{image.descripcion}</p>
                )}
              </div>

              <div className="absolute inset-0 bg-zinc-950/0 group-hover:bg-zinc-950/30 transition-colors duration-300 flex items-center justify-center">
                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 drop-shadow-lg scale-90 group-hover:scale-100" />
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Empty State */}
        {displayedImages.length === 0 && (
          <div className="text-center py-16 text-zinc-400 bg-white/[0.01] border border-white/5 rounded-3xl max-w-xl mx-auto">
            <Camera className="w-10 h-10 mx-auto mb-3 opacity-55 text-indigo-400" />
            No hay fotos cargadas bajo esta categoría todavía.
          </div>
        )}

        {/* Botón de Expansión ("Ver Galería Completa") */}
        {filtered.length > 8 && (
          <div className="mt-12 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 px-8 py-4 text-xs font-black uppercase tracking-widest text-white transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              {showAll ? 'Ver menos fotos' : 'Ver Galería Completa'}
              <ChevronRight className={cn("w-4 h-4 transition-transform", showAll ? "rotate-90" : "")} />
            </button>
          </div>
        )}
      </div>

      {/* LIGHTBOX FOR EVENT IMAGES */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="absolute top-4 right-4 w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            aria-label="Cerrar galería"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div
            className="relative max-w-5xl max-h-[82vh] w-full h-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex-1 rounded-2xl overflow-hidden bg-zinc-950 border border-white/10">
              <Image
                src={displayedImages[lightboxIndex].src}
                alt={displayedImages[lightboxIndex].alt}
                fill
                className="object-contain"
                sizes="100vw"
                priority
                unoptimized={!isNextJsOptimizableUrl(displayedImages[lightboxIndex].src)}
              />
            </div>
            {(displayedImages[lightboxIndex].titulo || displayedImages[lightboxIndex].servicio || displayedImages[lightboxIndex].descripcion) && (
              <div className="bg-zinc-950/90 border border-white/10 text-white p-4 rounded-2xl mt-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  {displayedImages[lightboxIndex].titulo && (
                    <p className="font-black text-base truncate">{displayedImages[lightboxIndex].titulo}</p>
                  )}
                  {displayedImages[lightboxIndex].servicio && (
                    <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mt-1">{displayedImages[lightboxIndex].servicio}</p>
                  )}
                  {displayedImages[lightboxIndex].descripcion && (
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{displayedImages[lightboxIndex].descripcion}</p>
                  )}
                </div>
                <button
                  onClick={() => handleShareWhatsApp(displayedImages[lightboxIndex])}
                  className="w-11 h-11 rounded-xl bg-green-500/20 hover:bg-green-500/30 flex items-center justify-center text-green-300 shrink-0 transition-colors"
                  title="Compartir por WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            aria-label="Foto siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-bold">
            {lightboxIndex + 1} / {displayedImages.length}
          </div>
        </div>
      )}
    </section>
  );
}

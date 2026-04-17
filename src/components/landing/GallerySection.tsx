'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Camera, X, ZoomIn, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
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
  tipoFiesta?: string;
}

interface FiestaFilterOption {
  value: string;
  label: string;
  aliases: string[];
}

const FIESTA_FILTERS = [
  { value: 'Todos', label: 'Todos', aliases: ['Todos'] },
  { value: '15 Años', label: 'XV Años', aliases: ['15 Años', 'XV Años'] },
  { value: 'Bodas', label: 'Bodas', aliases: ['Bodas'] },
  { value: 'Cumpleaños', label: 'Cumpleaños', aliases: ['Cumpleaños'] },
  { value: 'Empresariales', label: 'Empresariales', aliases: ['Empresariales', 'Eventos Corporativos'] },
  { value: 'Infantiles', label: 'Infantiles', aliases: ['Infantiles'] },
] as FiestaFilterOption[];

function normalizeTipoFiesta(tipoFiesta?: string): string | undefined {
  if (!tipoFiesta) return undefined;
  const found = FIESTA_FILTERS.find((item) => item.aliases.includes(tipoFiesta));
  return found?.value ?? tipoFiesta;
}

function galeriaFotoToGalleryItem(foto: GaleriaFoto): LandingGalleryItem {
  return {
    id: foto.id,
    src: foto.url,
    alt: foto.titulo ?? foto.categoria ?? 'Imagen de galería',
    hint: foto.categoria ?? 'event gallery',
    titulo: foto.titulo,
    descripcion: foto.descripcion,
    destacada: foto.destacada,
    servicio: foto.categoria || foto.servicio || 'General',
    tipoFiesta: normalizeTipoFiesta(foto.tipoFiesta),
  };
}

function galleryImageToLandingItem(image: GalleryImage, index: number): LandingGalleryItem {
  return {
    id: image.id ?? `img-${index}`,
    src: image.src,
    alt: image.alt,
    hint: image.hint,
    titulo: image.titulo,
    descripcion: image.descripcion,
    destacada: image.destacada,
    servicio: image.category || 'General',
  };
}

interface GallerySectionProps {
  images?: GalleryImage[];
  galeriaFotos?: GaleriaFoto[];
}

export function GallerySection({ images, galeriaFotos }: GallerySectionProps) {
  const allImages = useMemo<LandingGalleryItem[]>(() => {
    const source = (galeriaFotos?.length ?? 0) > 0
      ? galeriaFotos!.map(galeriaFotoToGalleryItem)
      : (images ?? []).map(galleryImageToLandingItem);
    return source.sort((a, b) => (b.destacada ? 1 : 0) - (a.destacada ? 1 : 0));
  }, [galeriaFotos, images]);

  const [activeFiesta, setActiveFiesta] = useState<string>('Todos');
  const [activeServicio, setActiveServicio] = useState<string>('Todos');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredByFiesta = useMemo(() => {
    if (activeFiesta === 'Todos') return allImages;
    return allImages.filter((img) => img.tipoFiesta === activeFiesta);
  }, [allImages, activeFiesta]);

  const servicios = useMemo(() => {
    const unique = Array.from(new Set(filteredByFiesta.map((img) => img.servicio).filter(Boolean)));
    return ['Todos', ...unique];
  }, [filteredByFiesta]);

  const filtered = useMemo(() => {
    if (activeServicio === 'Todos') return filteredByFiesta;
    return filteredByFiesta.filter((img) => img.servicio === activeServicio);
  }, [filteredByFiesta, activeServicio]);

  if (allImages.length === 0) {
    return null;
  }

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () => setLightboxIndex((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length));
  const nextImage = () => setLightboxIndex((i) => (i === null ? null : (i + 1) % filtered.length));

  const handleShareWhatsApp = (image: LandingGalleryItem) => {
    const text = encodeURIComponent(`¡Mirá esta foto de ${image.servicio} de AK Producciones! ${image.src}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <section id="galeria" data-testid="gallery-section" className="py-24 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-pink-400 mb-4">Nuestro trabajo</p>
          <h2 className="font-headline text-5xl sm:text-6xl font-black text-white leading-tight mb-6">Galería</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Cada foto cuenta una historia. Descubrí la magia que creamos en cada evento.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {FIESTA_FILTERS.map((fiesta) => (
            <button
              key={fiesta.value}
              onClick={() => {
                setActiveFiesta(fiesta.value);
                setActiveServicio('Todos');
              }}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-black uppercase tracking-wider transition-all duration-200',
                activeFiesta === fiesta.value
                  ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              )}
            >
              {fiesta.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {servicios.map((servicio) => (
            <button
              key={servicio}
              onClick={() => setActiveServicio(servicio)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200',
                activeServicio === servicio
                  ? 'bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              )}
            >
              {servicio}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {filtered.map((image, index) => (
            <button
              key={image.id}
              onClick={() => openLightbox(index)}
              className={cn(
                'relative rounded-2xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary',
                image.destacada ? 'aspect-[4/3] md:col-span-1' : 'aspect-square'
              )}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 33vw"
                data-ai-hint={image.hint}
                unoptimized={!isNextJsOptimizableUrl(image.src)}
              />
              {image.destacada && (
                <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-0.5 rounded-full">
                  ⭐ Destacada
                </div>
              )}
              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                {image.servicio}
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Camera className="w-10 h-10 mx-auto mb-3 opacity-50" />
            No hay fotos en este filtro todavía.
          </div>
        )}
      </div>

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
            className="relative max-w-4xl max-h-[80vh] w-full h-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex-1">
              <Image
                src={filtered[lightboxIndex].src}
                alt={filtered[lightboxIndex].alt}
                fill
                className="object-contain"
                sizes="100vw"
                priority
                unoptimized={!isNextJsOptimizableUrl(filtered[lightboxIndex].src)}
              />
            </div>
            {(filtered[lightboxIndex].titulo || filtered[lightboxIndex].servicio || filtered[lightboxIndex].descripcion) && (
              <div className="bg-black/70 text-white p-3 rounded-b-xl mt-1 flex items-center justify-between gap-2">
                <div>
                  {filtered[lightboxIndex].titulo && (
                    <p className="font-bold text-sm">{filtered[lightboxIndex].titulo}</p>
                  )}
                  {filtered[lightboxIndex].servicio && (
                    <p className="text-xs text-white/60">{filtered[lightboxIndex].servicio}</p>
                  )}
                  {filtered[lightboxIndex].descripcion && (
                    <p className="text-xs text-white/70 mt-0.5">{filtered[lightboxIndex].descripcion}</p>
                  )}
                </div>
                <button
                  onClick={() => handleShareWhatsApp(filtered[lightboxIndex])}
                  className="w-9 h-9 rounded-full bg-green-500/20 hover:bg-green-500/40 flex items-center justify-center text-green-400 shrink-0 transition-colors"
                  title="Compartir por WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-bold">
            {lightboxIndex + 1} / {filtered.length}
          </div>
        </div>
      )}
    </section>
  );
}

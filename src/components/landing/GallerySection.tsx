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
    return (
      <section id="galeria" data-testid="gallery-section" className="py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-[0.4em] text-red-300 mb-4">Nuestro trabajo</p>
            <h2 className="font-headline text-5xl sm:text-6xl font-black text-white leading-tight mb-6">Galería AK</h2>
            <p className="text-zinc-300 text-lg max-w-xl mx-auto">
              Fotos reales, momentos reales y una muestra clara de cómo puede verse tu evento.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/8 py-16 px-6 text-center shadow-2xl">
            <Camera className="w-12 h-12 text-red-200 mx-auto mb-4" />
            <p className="text-zinc-200 font-semibold">Próximamente agregaremos fotos de nuestros eventos.</p>
          </div>
        </div>
      </section>
    );
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
    <section id="galeria" data-testid="gallery-section" className="py-24 bg-zinc-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-12 items-end mb-12">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-red-300 mb-4">Nuestro trabajo</p>
            <h2 className="font-headline text-5xl sm:text-6xl font-black text-white leading-tight mb-5">Galería AK</h2>
            <p className="text-zinc-300 text-lg max-w-xl leading-relaxed">
              La galería tiene que vender sola: fotos grandes, filtros simples y detalles claros para que el futuro cliente imagine su fiesta.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/8 p-4 sm:p-5 shadow-2xl">
            <div className="flex flex-wrap gap-2">
              {FIESTA_FILTERS.map((fiesta) => (
                <button
                  key={fiesta.value}
                  onClick={() => {
                    setActiveFiesta(fiesta.value);
                    setActiveServicio('Todos');
                  }}
                  className={cn(
                    'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200',
                    activeFiesta === fiesta.value
                      ? 'bg-red-600 text-white shadow-lg shadow-red-950/30'
                      : 'bg-white/10 text-zinc-200 hover:bg-white/18'
                  )}
                >
                  {fiesta.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {servicios.map((servicio) => (
            <button
              key={servicio}
              onClick={() => setActiveServicio(servicio)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border',
                activeServicio === servicio
                  ? 'bg-white text-red-700 border-white shadow-lg'
                  : 'bg-transparent text-zinc-300 border-white/15 hover:bg-white/10 hover:text-white'
              )}
            >
              {servicio}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[11rem] sm:auto-rows-[13rem] md:auto-rows-[15rem] gap-3 md:gap-4">
          {filtered.map((image, index) => {
            const featured = image.destacada || index === 0;
            return (
              <button
                key={image.id}
                onClick={() => openLightbox(index)}
                className={cn(
                  'relative rounded-2xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-red-400 bg-zinc-900 border border-white/10 text-left shadow-2xl',
                  featured ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'
                )}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  data-ai-hint={image.hint}
                  unoptimized={!isNextJsOptimizableUrl(image.src)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/16 to-transparent" />
                {image.destacada && (
                  <div className="absolute top-3 left-3 bg-white text-red-700 text-[10px] font-black px-3 py-1 rounded-lg shadow-lg">
                    Destacada
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-lg shadow-lg max-w-[70%] truncate">
                  {image.servicio}
                </div>
                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                  <p className="text-sm sm:text-base font-black text-white leading-tight line-clamp-2">
                    {image.titulo || image.alt || 'Evento AK'}
                  </p>
                  {image.descripcion && (
                    <p className="hidden sm:block text-xs text-white/72 mt-1 line-clamp-2">{image.descripcion}</p>
                  )}
                </div>
                <div className="absolute inset-0 bg-red-950/0 group-hover:bg-red-950/22 transition-colors duration-300 flex items-center justify-center">
                  <ZoomIn className="w-9 h-9 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
                </div>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-zinc-400">
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
              <div className="bg-zinc-950/92 border border-white/10 text-white p-4 rounded-2xl mt-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  {filtered[lightboxIndex].titulo && (
                    <p className="font-black text-base truncate">{filtered[lightboxIndex].titulo}</p>
                  )}
                  {filtered[lightboxIndex].servicio && (
                    <p className="text-xs text-red-200 font-bold uppercase tracking-widest mt-1">{filtered[lightboxIndex].servicio}</p>
                  )}
                  {filtered[lightboxIndex].descripcion && (
                    <p className="text-xs text-white/70 mt-1 line-clamp-2">{filtered[lightboxIndex].descripcion}</p>
                  )}
                </div>
                <button
                  onClick={() => handleShareWhatsApp(filtered[lightboxIndex])}
                  className="w-11 h-11 rounded-xl bg-green-500/20 hover:bg-green-500/35 flex items-center justify-center text-green-300 shrink-0 transition-colors"
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
            {lightboxIndex + 1} / {filtered.length}
          </div>
        </div>
      )}
    </section>
  );
}

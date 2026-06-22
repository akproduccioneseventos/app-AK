'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Camera, X, ZoomIn, ChevronLeft, ChevronRight, Share2, Instagram, Star, MessageCircle, Heart } from 'lucide-react';
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

const MOCK_INSTAGRAM_POSTS = [
  {
    id: 'ig-1',
    src: '/media/catalogo-servicios/xv-pista-iluminada-01.jpeg',
    likes: 342,
    caption: '¡Increíble noche de XV Años en Salto! Pista de luces LED activa y diversión asegurada al 100% 💫🎉 #xv #fiestas #akproducciones',
    comments: 18,
    date: 'Hace 2 días'
  },
  {
    id: 'ig-2',
    src: '/media/catalogo-servicios/barra-tragos-ak-01.jpeg',
    likes: 219,
    caption: 'Nuestra barra premium lista para recibir a los invitados. Tragos de autor, jugos naturales y barra libre toda la noche 🍹✨ #barra #catering #bebidas',
    comments: 9,
    date: 'Hace 5 días'
  },
  {
    id: 'ig-3',
    src: '/media/catalogo-servicios/candy-bar-completo-ak-02.jpeg',
    likes: 185,
    caption: 'Los detalles hacen la diferencia. Candy bar personalizado para la boda de Sofía & Juan 💍🍬 #candybar #decoracion #bodas',
    comments: 12,
    date: 'Hace 1 semana'
  },
  {
    id: 'ig-4',
    src: '/media/catalogo-servicios/photobooth-vogue-01.jpeg',
    likes: 412,
    caption: '¡Diversión en el Muro Social! Capturamos sonrisas en tiempo real con nuestra fotocabina interactiva 📸🥳 #fotocabina #invitados #diversion',
    comments: 24,
    date: 'Hace 2 semanas'
  }
];

const MOCK_GOOGLE_REVIEWS = [
  {
    id: 'g-1',
    author: 'Claudia Flores',
    avatar: 'CF',
    rating: 5,
    date: 'Hace 1 mes',
    text: 'Excelente servicio. El catering de primera y abundante. Lo mejor es que devolvieron todo lo que sobró, tal cual lo prometido. Muy serios y organizados.',
    src: '/media/catalogo-servicios/catering-mesa-ak-01.jpeg'
  },
  {
    id: 'g-2',
    author: 'Martín Rodríguez',
    avatar: 'MR',
    rating: 5,
    date: 'Hace 2 meses',
    text: 'Contratamos el servicio completo para el cumple de 15 de mi hija. La discoteca y la iluminación LED espectaculares, los invitados no pararon de bailar.',
    src: '/media/catalogo-servicios/salon-discoteca-ak-01.jpeg'
  },
  {
    id: 'g-3',
    author: 'Verónica Silva',
    avatar: 'VS',
    rating: 5,
    date: 'Hace 3 meses',
    text: 'La decoración del salón en el Club Uruguay quedó soñada. Cuidaron cada detalle y nos dieron un portal digital súper útil para las confirmaciones por QR.',
    src: '/media/catalogo-servicios/boda-decoracion-dorada-01.jpeg'
  }
];

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
  const [galleryMode, setGalleryMode] = useState<'events' | 'instagram' | 'google'>('events');

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

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () => setLightboxIndex((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length));
  const nextImage = () => setLightboxIndex((i) => (i === null ? null : (i + 1) % filtered.length));

  const handleShareWhatsApp = (image: LandingGalleryItem) => {
    const text = encodeURIComponent(`¡Mirá esta foto de ${image.servicio} de AK Producciones! ${image.src}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  return (
    <section id="galeria" data-testid="gallery-section" className="py-24 bg-zinc-950 overflow-hidden text-white border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-8">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-indigo-400 mb-4">
              <Camera className="w-3.5 h-3.5" />
              Nuestros Trabajos
            </span>
            <h2 className="font-headline text-4xl sm:text-5xl font-black text-white leading-tight">
              Galería de Eventos Realizados
            </h2>
            <p className="text-zinc-400 text-lg mt-4 max-w-xl leading-relaxed">
              Fotos reales de nuestras fiestas. Explora nuestro catálogo directo, nuestras publicaciones en redes sociales o nuestras fotos subidas a Google.
            </p>
          </div>

          {/* MAIN MODE SELECTOR */}
          <div className="flex p-1 rounded-2xl bg-white/5 border border-white/10 self-start lg:self-end">
            <button
              onClick={() => setGalleryMode('events')}
              className={cn(
                'px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
                galleryMode === 'events' ? 'bg-white text-zinc-950 shadow-lg' : 'text-zinc-400 hover:text-white'
              )}
            >
              🎉 Galería
            </button>
            <button
              onClick={() => setGalleryMode('instagram')}
              className={cn(
                'px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2',
                galleryMode === 'instagram' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
              )}
            >
              <Instagram className="w-3.5 h-3.5" /> Instagram
            </button>
            <button
              onClick={() => setGalleryMode('google')}
              className={cn(
                'px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2',
                galleryMode === 'google' ? 'bg-amber-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
              )}
            >
              <Star className="w-3.5 h-3.5 text-amber-300" /> Google
            </button>
          </div>
        </div>

        {/* ── RENDERING EVENTS MODE ──────────────────────── */}
        {galleryMode === 'events' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Event Category Filters */}
            <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-white/[0.02] border border-white/5">
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
                      ? 'bg-white text-zinc-950 shadow-md'
                      : 'bg-transparent text-zinc-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  {fiesta.label}
                </button>
              ))}
            </div>

            {/* Service Filters */}
            <div className="flex flex-wrap gap-2">
              {servicios.map((servicio) => (
                <button
                  key={servicio}
                  onClick={() => setActiveServicio(servicio)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border',
                    activeServicio === servicio
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                      : 'bg-transparent text-zinc-400 border-white/10 hover:bg-white/5 hover:text-white'
                  )}
                >
                  {servicio}
                </button>
              ))}
            </div>

            {/* Staggered Grid */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 auto-rows-[11rem] sm:auto-rows-[13rem] md:auto-rows-[15rem] gap-4"
            >
              {filtered.map((image, index) => {
                const featured = image.destacada || index === 0;
                return (
                  <motion.button
                    key={image.id}
                    variants={cardVariants}
                    onClick={() => openLightbox(index)}
                    className={cn(
                      'relative rounded-3xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-zinc-900 border border-white/5 text-left shadow-lg hover:shadow-2xl transition-all duration-300',
                      featured ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'
                    )}
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
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
                      <p className="text-sm sm:text-base font-black text-white leading-tight line-clamp-2">
                        {image.titulo || image.alt || 'Evento AK'}
                      </p>
                      {image.descripcion && (
                        <p className="hidden sm:block text-xs text-zinc-400 mt-1 line-clamp-2">{image.descripcion}</p>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-zinc-950/0 group-hover:bg-zinc-950/30 transition-colors duration-300 flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 drop-shadow-lg scale-90 group-hover:scale-100" />
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>

            {filtered.length === 0 && (
              <div className="text-center py-16 text-zinc-400 bg-white/[0.01] border border-white/5 rounded-3xl">
                <Camera className="w-10 h-10 mx-auto mb-3 opacity-50 text-indigo-400" />
                No hay fotos cargadas bajo estos filtros todavía.
              </div>
            )}
          </motion.div>
        )}

        {/* ── RENDERING INSTAGRAM MODE ───────────────────── */}
        {galleryMode === 'instagram' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {MOCK_INSTAGRAM_POSTS.map((post) => (
              <div key={post.id} className="rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] overflow-hidden flex flex-col group transition-all duration-300 shadow-xl">
                {/* IG Post Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 p-[1.5px]">
                      <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-[9px] font-black">
                        AK
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-black">akproducciones</p>
                      <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Salto, Uruguay</p>
                    </div>
                  </div>
                  <Instagram className="w-4 h-4 text-pink-500" />
                </div>

                {/* Media Container */}
                <div className="relative aspect-square overflow-hidden bg-zinc-900 border-y border-white/5">
                  <Image
                    src={post.src}
                    alt={post.caption}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-103"
                  />
                  {/* Overlay Interaction Count on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-1.5 font-black text-sm">
                      <Heart className="w-5 h-5 fill-white text-white" />
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-black text-sm">
                      <MessageCircle className="w-5 h-5 fill-white text-white" />
                      <span>{post.comments}</span>
                    </div>
                  </div>
                </div>

                {/* Post Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <p className="text-xs font-medium leading-relaxed line-clamp-3 text-zinc-300">
                      <span className="font-black text-white mr-1.5">akproducciones</span>
                      {post.caption}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    <span>{post.date}</span>
                    <a
                      href="https://www.instagram.com/akproduccionesfiestasyeventos/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-400 hover:text-white transition-colors"
                    >
                      Ver en Instagram
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── RENDERING GOOGLE MODE ──────────────────────── */}
        {galleryMode === 'google' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid gap-6 md:grid-cols-3"
          >
            {MOCK_GOOGLE_REVIEWS.map((review) => (
              <div key={review.id} className="rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-6 flex flex-col justify-between transition-all duration-300 shadow-xl relative overflow-hidden group">
                <div className="space-y-5">
                  {/* Google Reviewer Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-sm">
                        {review.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-black">{review.author}</p>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[10px] text-zinc-500 font-semibold">{review.date}</p>
                          <span className="text-[10px] text-zinc-600">•</span>
                          <p className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">Local Guide</p>
                        </div>
                      </div>
                    </div>
                    {/* Google Star Rating */}
                    <div className="flex items-center gap-0.5">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  {/* Review Text */}
                  <p className="text-sm leading-relaxed text-zinc-300 font-medium">
                    "{review.text}"
                  </p>

                  {/* Attachement Image of the work */}
                  <div className="relative h-44 rounded-2xl overflow-hidden border border-white/5 bg-zinc-900">
                    <Image
                      src={review.src}
                      alt="Foto de la reseña en Google"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-103"
                    />
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  <span>Reseña de Google Maps</span>
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:text-white transition-colors"
                  >
                    Ver reseña
                  </a>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* LIGHTBOX FOR EVENT IMAGES */}
      {lightboxIndex !== null && galleryMode === 'events' && (
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
              <div className="bg-zinc-950/90 border border-white/10 text-white p-4 rounded-2xl mt-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  {filtered[lightboxIndex].titulo && (
                    <p className="font-black text-base truncate">{filtered[lightboxIndex].titulo}</p>
                  )}
                  {filtered[lightboxIndex].servicio && (
                    <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mt-1">{filtered[lightboxIndex].servicio}</p>
                  )}
                  {filtered[lightboxIndex].descripcion && (
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{filtered[lightboxIndex].descripcion}</p>
                  )}
                </div>
                <button
                  onClick={() => handleShareWhatsApp(filtered[lightboxIndex])}
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
            {lightboxIndex + 1} / {filtered.length}
          </div>
        </div>
      )}
    </section>
  );
}

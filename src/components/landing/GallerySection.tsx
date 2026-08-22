"use client";

import { useEffect, useMemo, useState } from "react";
import Image, { type ImageLoaderProps } from "next/image";
import {
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Share2,
  X,
  ZoomIn,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { canUseNextImage } from "@/lib/next-image-url";
import type { GaleriaFoto } from "@/types/galeria";
import {
  classifyGalleryCategories,
  galleryIdentityKeys,
} from "./gallery-media-utils";

export { classifyGalleryCategories } from "./gallery-media-utils";

const passthroughImageLoader = ({ src }: ImageLoaderProps) => src;

function GalleryMedia({
  src,
  alt,
  className,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  className: string;
  sizes: string;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-neutral-300" aria-hidden="true" />
      )}
      {canUseNextImage(src) ? (
        <Image
          src={src}
          alt={alt}
          fill
          className={cn(className, "transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}
          sizes={sizes}
          priority={priority}
          onLoad={() => setLoaded(true)}
        />
      ) : (
        <Image
          loader={passthroughImageLoader}
          unoptimized
          src={src}
          alt={alt}
          fill
          className={cn(className, "transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}
          sizes={sizes}
          priority={priority}
          onLoad={() => setLoaded(true)}
        />
      )}
    </>
  );
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
  source?: GaleriaFoto["source"];
  sourceId?: string;
  sourceUrl?: string;
}

export interface LandingGalleryItem {
  id: string;
  src: string;
  alt: string;
  hint: string;
  titulo?: string;
  descripcion?: string;
  destacada?: boolean;
  source?: GaleriaFoto["source"];
  sourceId?: string;
  sourceUrl?: string;
  categorias: string[];
  subCategoria?: string;
}

const CATEGORY_FILTERS = [
  "Todos",
  "Eventos",
  "Discoteca",
  "Catering",
  "Decoración",
  "Barra de Tragos",
  "Fotocabina",
  "Repostería",
  "Fotografía",
  "Salón",
];

function getSubCategoriaFotografia(
  titulo: string,
  descripcion: string,
  categoriaOriginal: string,
): string {
  const text = `${titulo} ${descripcion} ${categoriaOriginal}`.toLowerCase();
  if (text.includes("pintada") || text.includes("bogue")) return "Pintada";
  if (text.includes("civil")) return "Civil";
  if (/(exteriores|campo|jardin|jardín|exterior)/.test(text)) return "Exteriores";
  if (/(iglesia|templo|ceremonia)/.test(text)) return "Iglesia";
  return "Fiestas";
}

function toLandingGalleryItem(
  item: GalleryImage | GaleriaFoto,
  index: number,
): LandingGalleryItem {
  const isGaleriaFoto = "url" in item;
  const src = isGaleriaFoto ? item.url : item.src;
  const titulo = item.titulo;
  const descripcion = item.descripcion;
  const categoriaOriginal = isGaleriaFoto
    ? item.categoria || item.servicio || ""
    : item.category || "";
  const categorias = classifyGalleryCategories(titulo || "", descripcion || "", categoriaOriginal);

  return {
    id: isGaleriaFoto ? item.id : item.id || `img-${index}`,
    src,
    alt: isGaleriaFoto
      ? item.titulo || item.categoria || "Foto de un evento de AK Producciones"
      : item.alt,
    hint: isGaleriaFoto ? item.categoria : item.hint,
    titulo,
    descripcion,
    destacada: item.destacada,
    source: item.source,
    sourceId: item.sourceId,
    sourceUrl: item.sourceUrl,
    categorias,
    subCategoria: categorias.includes("Fotografía")
      ? getSubCategoriaFotografia(titulo || "", descripcion || "", categoriaOriginal)
      : undefined,
  };
}

export function dedupeGalleryImages(items: LandingGalleryItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const identities = galleryIdentityKeys(item);
    if (identities.size === 0 || [...identities].some((identity) => seen.has(identity))) return false;
    identities.forEach((identity) => seen.add(identity));
    return true;
  });
}

interface GallerySectionProps {
  images?: GalleryImage[];
  galeriaFotos?: GaleriaFoto[];
}

const INITIAL_BATCH = 12;
const BATCH_STEP = 12;

export function GallerySection({ images, galeriaFotos }: GallerySectionProps) {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [activeSubCategory, setActiveSubCategory] = useState("Todas");
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const allImages = useMemo(() => {
    const source = [
      ...(images ?? []).map((image, index) => toLandingGalleryItem(image, index)),
      ...(galeriaFotos ?? []).map((foto, index) => toLandingGalleryItem(foto, index)),
    ];

    return dedupeGalleryImages(source).sort(
      (a, b) => Number(Boolean(b.destacada)) - Number(Boolean(a.destacada)),
    );
  }, [galeriaFotos, images]);

  const filtered = useMemo(() => {
    let list = allImages;
    if (activeCategory !== "Todos") {
      list = list.filter((image) => image.categorias.includes(activeCategory));
    }
    if (activeCategory === "Fotografía" && activeSubCategory !== "Todas") {
      list = list.filter((image) => image.subCategoria === activeSubCategory);
    }
    return list;
  }, [activeCategory, activeSubCategory, allImages]);

  const displayedImages = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    setVisibleCount(INITIAL_BATCH);
    setLightboxIndex(null);
  }, [activeCategory, activeSubCategory]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxIndex(null);
      if (event.key === "ArrowLeft") {
        setLightboxIndex((index) => (index === null ? null : (index - 1 + displayedImages.length) % displayedImages.length));
      }
      if (event.key === "ArrowRight") {
        setLightboxIndex((index) => (index === null ? null : (index + 1) % displayedImages.length));
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [displayedImages.length, lightboxIndex]);

  const handleShareWhatsApp = (image: LandingGalleryItem) => {
    const category = image.categorias[0] || "evento";
    const text = encodeURIComponent(`Mirá esta foto de ${category} de AK Producciones: ${image.src}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.035 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.28, ease: "easeOut" },
    },
  };

  return (
    <section id="galeria" data-testid="gallery-section" className="border-y border-neutral-200 bg-neutral-100 py-20 text-slate-950 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold text-red-700">Eventos reales</p>
            <h2 className="mt-3 font-headline text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
              Galería de eventos
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Momentos reales de nuestras producciones: gastronomía, salones, pista LED, discoteca y ambientación.
            </p>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2 border-b border-neutral-300 pb-4">
          {CATEGORY_FILTERS.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                setActiveCategory(category);
                setActiveSubCategory("Todas");
              }}
              className={cn(
                "min-h-11 border px-3 py-2 text-xs font-bold transition-colors",
                activeCategory === category
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-neutral-300 bg-white text-slate-600 hover:border-slate-500 hover:text-slate-950",
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {activeCategory === "Fotografía" && (
          <div className="mb-8 flex flex-wrap gap-2">
            {["Todas", "Pintada", "Civil", "Fiestas", "Exteriores", "Iglesia"].map((subCategory) => (
              <button
                key={subCategory}
                type="button"
                onClick={() => {
                  setActiveSubCategory(subCategory);
                }}
                className={cn(
                    "px-3 py-1.5 text-xs font-semibold transition-colors",
                  activeSubCategory === subCategory
                    ? "bg-red-700 text-white"
                    : "text-slate-600 hover:bg-neutral-200 hover:text-slate-950",
                )}
              >
                {subCategory}
              </button>
            ))}
          </div>
        )}

        <motion.div
          variants={containerVariants}
          initial={shouldReduceMotion ? false : "hidden"}
          whileInView={shouldReduceMotion ? undefined : "visible"}
          viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
        >
          {displayedImages.map((image, index) => (
            <motion.button
              key={`${image.id}-${image.src}`}
              type="button"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={
                shouldReduceMotion
                  ? undefined
                  : {
                      duration: 0.32,
                      delay: (index % 12) * 0.035,
                      ease: [0.22, 1, 0.36, 1] as const,
                    }
              }
              onClick={() => setLightboxIndex(index)}
              className="group relative aspect-[4/3] overflow-hidden border border-neutral-200 bg-neutral-200 text-left shadow-sm transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-700"
              aria-label={`Abrir foto: ${image.alt}`}
            >
              <GalleryMedia
                src={image.src}
                alt={image.alt}
                className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.03] motion-reduce:transition-none"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/35" />
              <span className="absolute left-3 top-3 bg-white/95 px-2 py-1 text-[10px] font-bold text-slate-800">
                {image.categorias[0] || "Eventos"}
              </span>
              <span className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                {image.titulo ? (
                  <span className="line-clamp-2 bg-black/70 px-2 py-1 text-xs font-semibold text-white">
                    {image.titulo}
                  </span>
                ) : (
                  <span />
                )}
                <ZoomIn className="h-5 w-5 shrink-0 text-white opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
            </motion.button>
          ))}
        </motion.div>

        {displayedImages.length === 0 && (
          <div className="border border-neutral-300 bg-white px-6 py-16 text-center text-slate-600">
            <Camera className="mx-auto mb-3 h-9 w-9 text-slate-400" />
            No hay fotos cargadas en esta categoría todavía.
          </div>
        )}

        {hasMore && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((value) => value + BATCH_STEP)}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition-colors hover:border-slate-500 hover:bg-neutral-50"
            >
              Ver más fotos y videos ({Math.min(visibleCount + BATCH_STEP, filtered.length)} de {filtered.length})
              <ChevronDown className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && displayedImages[lightboxIndex] && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
            onClick={() => setLightboxIndex(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Vista ampliada de la galería"
          >
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/20"
              aria-label="Cerrar galería"
              title="Cerrar galería"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setLightboxIndex((index) => (index === null ? null : (index - 1 + displayedImages.length) % displayedImages.length));
              }}
              className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/20 sm:left-6"
              aria-label="Foto anterior"
              title="Foto anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
              <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-white/15 bg-zinc-950">
                <GalleryMedia
                  src={displayedImages[lightboxIndex].src}
                  alt={displayedImages[lightboxIndex].alt}
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 bg-zinc-900 px-4 py-3 text-white">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    {displayedImages[lightboxIndex].titulo || displayedImages[lightboxIndex].alt}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {displayedImages[lightboxIndex].categorias[0] || "Evento"} · {lightboxIndex + 1} / {displayedImages.length}
                  </p>
                  {displayedImages[lightboxIndex].descripcion && (
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{displayedImages[lightboxIndex].descripcion}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(displayedImages[lightboxIndex])}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                  aria-label="Compartir foto por WhatsApp"
                  title="Compartir por WhatsApp"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setLightboxIndex((index) => (index === null ? null : (index + 1) % displayedImages.length));
              }}
              className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/20 sm:right-6"
              aria-label="Foto siguiente"
              title="Foto siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

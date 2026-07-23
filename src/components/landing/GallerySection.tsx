"use client";

import { useEffect, useMemo, useState } from "react";
import Image, { type ImageLoaderProps } from "next/image";
import {
  ArrowRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Share2,
  X,
  ZoomIn,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { canUseNextImage } from "@/lib/next-image-url";
import type { GaleriaFoto } from "@/types/galeria";

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
  if (canUseNextImage(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        priority={priority}
      />
    );
  }

  return (
    <Image
      loader={passthroughImageLoader}
      unoptimized
      src={src}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      priority={priority}
    />
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
}

export interface LandingGalleryItem {
  id: string;
  src: string;
  alt: string;
  hint: string;
  titulo?: string;
  descripcion?: string;
  destacada?: boolean;
  categorias: string[];
  subCategoria?: string;
}

const CATEGORY_FILTERS = [
  "Todos",
  "Discoteca",
  "Catering",
  "Decoración",
  "Barra de Tragos",
  "Fotocabina",
  "Repostería",
  "Fotografía",
  "Salón",
];

function getCategoriasAsociadas(
  titulo: string,
  descripcion: string,
  categoriaOriginal: string,
): string[] {
  const text = `${titulo} ${descripcion} ${categoriaOriginal}`.toLowerCase();
  const cats: string[] = [];

  if (/(salon|salón|club|uruguay)/.test(text)) cats.push("Salón");
  if (/(decor|ambient|mesa principal|velas|flores|estilo|cortinas)/.test(text)) cats.push("Decoración");
  if (/(comida|catering|menu|menú|finger|gastro|plato|bocado|recepcion|recepción|kebab|kebat|shawarma|asado|parrilla|picada|brochete|brochette|sandwich|sándwich|tabla|perro|pancho|hamburguesa|pizza|pizzeta|empanada|gastronomia|gastronomía|lunch|carne|snack|buffet|buffêt)/.test(text)) {
    cats.push("Catering");
  }
  if (/(trago|bebida|bar |barra|coctel|cóctel|whisky|gin|cerveza)/.test(text)) cats.push("Barra de Tragos");
  if (/(cabina|espejo|plataforma|touchpix|fotocabina|fotobina|totem|tótem| 360)/.test(text)) {
    cats.push("Fotocabina");
  }
  if (/(torta|dulce|candy|postre|reposteria|repostería|chocolat|volcán|helado)/.test(text)) cats.push("Repostería");
  if (/(disco|luz|luces|pantalla|led|dj|sonido|pista|baile|valz|vals|robot)/.test(text)) {
    cats.push("Discoteca");
  }
  if (/(foto|video|film|bogue|exteriores|civil|iglesia|pintada|sesion|sesión|retrato)/.test(text)) {
    cats.push("Fotografía");
  }

  if (cats.length === 0) {
    if (/(gastro|comida|catering|menú|menu|bocado|plato|carne|kebab)/.test(text)) {
      cats.push("Catering");
    } else {
      cats.push("Fotografía");
    }
  }
  return cats;
}

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
  const categorias = getCategoriasAsociadas(titulo || "", descripcion || "", categoriaOriginal);

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
    categorias,
    subCategoria: categorias.includes("Fotografía")
      ? getSubCategoriaFotografia(titulo || "", descripcion || "", categoriaOriginal)
      : undefined,
  };
}

function mediaIdentity(src: string) {
  return src.trim().split(/[?#]/, 1)[0].toLowerCase();
}

export function dedupeGalleryImages(items: LandingGalleryItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const identity = mediaIdentity(item.src);
    if (!identity || seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

interface GallerySectionProps {
  images?: GalleryImage[];
  galeriaFotos?: GaleriaFoto[];
}

export function GallerySection({ images, galeriaFotos }: GallerySectionProps) {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [activeSubCategory, setActiveSubCategory] = useState("Todas");
  const [showAll, setShowAll] = useState(false);
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

  const displayedImages = showAll ? filtered : filtered.slice(0, 12);

  useEffect(() => {
    setLightboxIndex(null);
  }, [activeCategory, activeSubCategory, showAll]);

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
    <section id="galeria" data-testid="gallery-section" className="border-y border-white/10 bg-zinc-950 py-20 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-pink-500/20 bg-pink-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-widest text-pink-300">
              <Instagram className="h-3.5 w-3.5 text-pink-400" />
              Sincronizado con Instagram @akproduccioneseventos
            </div>
            <h2 className="font-headline text-4xl font-black leading-tight text-white sm:text-5xl">
              Galería de Eventos Reales
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
              Explorá fotos reales de nuestras producciones: gastronomía gourmet, salones armados, pistas LED, discoteca y ambientación.
            </p>
          </div>
          <a
            href="https://www.instagram.com/akproduccioneseventos/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:scale-[1.02] hover:border-pink-500/40 hover:bg-white/10 active:scale-95"
          >
            <Instagram className="h-4 w-4 text-pink-400" />
            Ver @akproduccioneseventos
            <ArrowRight className="h-4 w-4 text-red-400" />
          </a>
        </div>

        <div className="mb-8 flex flex-wrap gap-2 border-b border-white/10 pb-4">
          {CATEGORY_FILTERS.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                setActiveCategory(category);
                setActiveSubCategory("Todas");
                setShowAll(false);
              }}
              className={cn(
                      "min-h-11 rounded-md border px-3 py-2 text-xs font-bold transition-colors",
                activeCategory === category
                  ? "border-white bg-white text-zinc-950"
                  : "border-white/15 text-zinc-400 hover:border-white/40 hover:text-white",
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
                  setShowAll(false);
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                  activeSubCategory === subCategory
                    ? "bg-red-700 text-white"
                    : "text-zinc-500 hover:bg-white/10 hover:text-white",
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
              variants={cardVariants}
              onClick={() => setLightboxIndex(index)}
              className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-zinc-900 text-left focus:outline-none focus:ring-2 focus:ring-red-400"
              aria-label={`Abrir foto: ${image.alt}`}
            >
              <GalleryMedia
                src={image.src}
                alt={image.alt}
                className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.03] motion-reduce:transition-none"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/45" />
              {image.destacada && (
                <span className="absolute left-3 top-3 rounded-sm bg-red-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  Destacada
                </span>
              )}
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
          <div className="border border-white/10 bg-white/[0.03] px-6 py-16 text-center text-zinc-400">
            <Camera className="mx-auto mb-3 h-9 w-9 text-zinc-600" />
            No hay fotos cargadas en esta categoría todavía.
          </div>
        )}

        {filtered.length > 12 && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/20 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:border-white/50 hover:bg-white/10"
            >
              {showAll ? "Ver menos fotos" : `Ver todas las fotos (${filtered.length})`}
              <ChevronRight className={cn("h-4 w-4 transition-transform", showAll && "rotate-90")} />
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

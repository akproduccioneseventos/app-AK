'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Check, ChevronDown, ChevronUp, ListChecks, Music, Camera, Utensils, Palette, Users, Zap, Package, Gift, Sparkles, Info, Images } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SlideLayout } from '../components/slide-layout';
import { ImagePlaceholder } from '../components/image-placeholder';
import { cn } from '@/lib/utils';
import { slugify } from '../lib/string-utils';
import type { ServicioEmpresa } from '@/types/empresa';
import type { CatalogoFoto } from '@/types/catalogo';
import { SERVICES } from '@/data/presentacion';

function isSafeHttpsUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

interface CategoriaServiciosSlideProps {
  categoria: string;
  servicios: ServicioEmpresa[];
  selectedServices: string[];
  onToggleSelect: (id: string) => void;
  mostrarPrecios: boolean;
  categoriaIndex: number;
  totalCategorias: number;
  catalogoFotos?: CatalogoFoto[];
  tipoFiesta?: string;
  /** Map of service ID -> uploaded LED photo URL */
  ledFotoMap?: Record<string, string>;
  /** Called when user clicks 'Ver experiencia visual' to open inline gallery */
  onOpenGallery?: (categoria: string, subcategoria?: string) => void;
}

function getServiceIcon(categoria?: string) {
  if (!categoria) return <Package className="h-8 w-8" />;
  const c = categoria.toLowerCase();
  if (c.includes('musica') || c.includes('música') || c.includes('discoteca') || c.includes('dj') || c.includes('sonido')) return <Music className="h-8 w-8" />;
  if (c.includes('fotografia') || c.includes('fotografía') || c.includes('filmacion') || c.includes('filmación') || c.includes('video') || c.includes('foto')) return <Camera className="h-8 w-8" />;
  if (c.includes('catering') || c.includes('bebida') || c.includes('reposteria') || c.includes('repostería') || c.includes('menu') || c.includes('menú') || c.includes('gastro')) return <Utensils className="h-8 w-8" />;
  if (c.includes('decoracion') || c.includes('decoración')) return <Palette className="h-8 w-8" />;
  if (c.includes('personal') || c.includes('coordinac')) return <Users className="h-8 w-8" />;
  if (c.includes('entretenimiento') || c.includes('show') || c.includes('animac')) return <Zap className="h-8 w-8" />;
  if (c.includes('regalo')) return <Gift className="h-8 w-8" />;
  return <Sparkles className="h-8 w-8" />;
}

function formatPrice(servicio: ServicioEmpresa): string | null {
  if (servicio.calculationMethod === 'porPersona' && servicio.precioPorPersona) {
    return `$${servicio.precioPorPersona.toLocaleString('es-UY')} / persona`;
  }
  if (servicio.precioVenta) {
    return `$${servicio.precioVenta.toLocaleString('es-UY')}`;
  }
  return null;
}

function getCatalogSpecsForService(categoria?: string, nombre?: string): string[] {
  if (!categoria && !nombre) return [];
  const lower = (categoria ?? '').toLowerCase();
  const nombreLower = (nombre ?? '').toLowerCase();
  const match = SERVICES.find(s => {
    const sLabel = s.label.toLowerCase();
    const sId = s.id.toLowerCase();
    return lower.includes(sId) || lower.includes(sLabel) ||
      nombreLower.includes(sId) || nombreLower.includes(sLabel);
  });
  if (match) return match.specs;
  return [];
}

function findPhotoForService(
  servicio: ServicioEmpresa,
  catalogoFotos: CatalogoFoto[],
  tipoFiesta: string,
): string | null {
  const safeFotos = catalogoFotos.filter(f => isSafeHttpsUrl(f.url));
  const nombreLower = (servicio.nombre ?? '').toLowerCase();
  const catLower = (servicio.categoria ?? '').toLowerCase();

  const byNombre = safeFotos.filter(f => {
    const tituloLower = (f.titulo ?? '').toLowerCase();
    return tituloLower && nombreLower && (
      tituloLower.includes(nombreLower) || nombreLower.includes(tituloLower)
    );
  });

  const byCategoria = safeFotos.filter(f =>
    f.categoriaServicio.toLowerCase() === catLower,
  );

  const candidates = byNombre.length > 0 ? byNombre : byCategoria;
  if (candidates.length === 0) return null;

  if (tipoFiesta) {
    const byTipo = candidates.filter(
      f => f.tipoFiesta && f.tipoFiesta.toLowerCase() === tipoFiesta.toLowerCase(),
    );
    if (byTipo.length > 0) return byTipo[0].url;
  }
  const generic = candidates.filter(f => !f.tipoFiesta);
  if (generic.length > 0) return generic[0].url;
  return candidates[0].url;
}

function ServicioCard({
  servicio,
  isSelected,
  onToggle,
  mostrarPrecios,
  fotoUrl,
  onOpenGallery,
}: {
  servicio: ServicioEmpresa;
  isSelected: boolean;
  onToggle: () => void;
  mostrarPrecios: boolean;
  fotoUrl?: string | null;
  onOpenGallery?: (categoria: string, subcategoria?: string) => void;
}) {
  const [showSpecs, setShowSpecs] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const specs = getCatalogSpecsForService(servicio.categoria, servicio.nombre);
  const price = mostrarPrecios ? formatPrice(servicio) : null;
  const showPhoto = fotoUrl != null && isSafeHttpsUrl(fotoUrl) && !imgFailed;

  const handleGallery = () => {
    if (onOpenGallery) {
      onOpenGallery(servicio.categoria ?? '', servicio.subcategoria ?? undefined);
    }
  };

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border-2 transition-all duration-200',
        isSelected
          ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_32px_rgba(16,185,129,0.16)]'
          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10',
      )}
    >
      {showPhoto && (
        <div className="relative h-40 w-full md:h-48 overflow-hidden">
          <Image
            src={fotoUrl!}
            alt={servicio.nombre}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw"
            unoptimized
            className="object-cover"
            onError={() => setImgFailed(true)}
          />
        </div>
      )}
      {!showPhoto && (
        <div className="flex h-32 w-full items-center justify-center border-b border-white/10 bg-slate-900/80 md:h-40">
          <div className="flex flex-col items-center gap-1 opacity-50">
            <Camera className="h-7 w-7 text-white/70" />
            <span className="text-xs font-bold text-white/55">Visual pendiente</span>
          </div>
        </div>
      )}
      <div className="p-4 md:p-5">
        <div className="flex items-start gap-3">
          <button
            onClick={onToggle}
            className={cn(
              'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all',
              isSelected ? 'border-emerald-400 bg-emerald-500' : 'border-white/30 hover:border-white/60',
            )}
            aria-label={isSelected ? 'Quitar de la propuesta' : 'Agregar a la propuesta'}
          >
            {isSelected && <Check className="h-4 w-4 text-white" />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-black leading-tight text-white md:text-lg">{servicio.nombre}</h3>
              {price && (
                <span className="shrink-0 text-sm font-black text-emerald-300">{price}</span>
              )}
            </div>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-white/38">Agregar a propuesta</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {servicio.notas && (
            <button
              onClick={() => setShowDesc(v => !v)}
              className="flex items-center gap-1 text-xs font-bold text-red-200 transition-colors hover:text-red-100"
            >
              <Info className="h-3.5 w-3.5" />
              {showDesc ? 'Ocultar' : 'Detalle'}
            </button>
          )}
          <button
            onClick={handleGallery}
            className="flex items-center gap-1 text-xs font-bold text-emerald-200 transition-colors hover:text-emerald-100"
          >
            <Images className="h-3.5 w-3.5" />
            Ver experiencia visual
          </button>
          {specs.length > 0 && (
            <button
              onClick={() => setShowSpecs(v => !v)}
              className="ml-auto flex items-center gap-1 text-xs text-white/50 transition-colors hover:text-white/70"
            >
              <ListChecks className="h-3.5 w-3.5" />
              {showSpecs ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
        </div>

        <AnimatePresence>
          {showDesc && servicio.notas && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="mt-3 border-t border-white/10 pt-3 text-sm leading-relaxed text-white/66">
                {servicio.notas}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showSpecs && specs.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 px-4 pb-4 pt-3">
              <ul className="space-y-1.5">
                {specs.map((spec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CategoriaServiciosSlide({
  categoria,
  servicios,
  selectedServices,
  onToggleSelect,
  mostrarPrecios,
  categoriaIndex,
  totalCategorias,
  catalogoFotos = [],
  tipoFiesta = '',
  ledFotoMap = {},
  onOpenGallery,
}: CategoriaServiciosSlideProps) {
  const allSelected = servicios.every(s => selectedServices.includes(s.id));
  const anySelected = servicios.some(s => selectedServices.includes(s.id));
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());

  const categorySlug = slugify(categoria);

  const fotosCategoria = useMemo(() => {
    const byCategoria = catalogoFotos.filter(
      f => isSafeHttpsUrl(f.url)
        && f.categoriaServicio.toLowerCase() === categoria.toLowerCase(),
    );

    if (tipoFiesta) {
      const byTipo = byCategoria.filter(
        f => f.tipoFiesta
          && f.tipoFiesta.toLowerCase() === tipoFiesta.toLowerCase(),
      );
      if (byTipo.length > 0) return byTipo.slice(0, 4);
    }

    const genericas = byCategoria.filter(f => !f.tipoFiesta);
    if (genericas.length > 0) return genericas.slice(0, 4);

    return byCategoria.slice(0, 4);
  }, [catalogoFotos, categoria, tipoFiesta]);

  const visibleFotos = useMemo(
    () => fotosCategoria.filter(f => !failedIds.has(f.id)),
    [fotosCategoria, failedIds],
  );

  return (
    <SlideLayout overflowScroll>
      <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1680px]">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex items-center gap-5"
        >
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white/85 md:h-20 md:w-20">
            {getServiceIcon(categoria)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge className="border border-white/20 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-white/64">
                Experiencia {categoriaIndex + 1} de {totalCategorias}
              </Badge>
              {anySelected && (
                <Badge className="border border-emerald-400/30 bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300">
                  <Check className="mr-1 h-3 w-3" />
                  {servicios.filter(s => selectedServices.includes(s.id)).length} en propuesta
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-black tracking-normal text-white drop-shadow-lg md:text-6xl xl:text-7xl">
              {categoria}
            </h1>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.05fr] 2xl:gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-4"
          >
            {visibleFotos.length > 0 ? (
              <div className={cn(
                'grid gap-2 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2',
                visibleFotos.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
              )}>
                {visibleFotos.map((foto) => (
                   <div
                     key={foto.id}
                     className={cn(
                       'relative w-full rounded-xl overflow-hidden',
                       visibleFotos.length === 1 ? 'aspect-[16/10]' : 'aspect-square',
                     )}
                   >
                     <Image
                       src={foto.url}
                       alt={foto.titulo ?? categoria}
                       fill
                       sizes="(max-width: 768px) 100vw, 50vw"
                       unoptimized
                       className="object-cover"
                       onError={() => setFailedIds(prev => new Set(prev).add(foto.id))}
                     />
                   </div>
                ))}
              </div>
            ) : (
              <ImagePlaceholder
                id={`categoria-${categorySlug}-hero`}
                label={`Visual de ${categoria}`}
                aspectRatio="4/3"
              />
            )}

            {visibleFotos.length > 0 && onOpenGallery && (
              <button
                onClick={() => onOpenGallery(categoria)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500/15 py-2.5 text-xs font-bold text-indigo-300 transition-all hover:bg-indigo-500/25 hover:text-indigo-200"
              >
                <Images className="h-3.5 w-3.5" />
                Ver galería completa
              </button>
            )}

            {servicios.length > 1 && (
              <button
                onClick={() => {
                  if (allSelected) {
                    servicios.forEach(s => { if (selectedServices.includes(s.id)) onToggleSelect(s.id); });
                  } else {
                    servicios.forEach(s => { if (!selectedServices.includes(s.id)) onToggleSelect(s.id); });
                  }
                }}
                className={cn(
                  'w-full rounded-xl border py-3 text-sm font-black transition-all',
                  allSelected
                    ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                    : 'border-white/20 bg-white/5 text-white/64 hover:bg-white/10',
                )}
              >
                {allSelected ? 'Todo incluido en la propuesta' : 'Incluir todas las opciones'}
              </button>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="grid max-h-[56vh] gap-3 overflow-y-auto pr-1 md:grid-cols-2 lg:block lg:space-y-3 lg:max-h-none"
          >
            {servicios.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
                Elegi el tipo de fiesta para ver opciones personalizadas.
              </div>
            ) : (
              servicios.map((servicio, i) => (
                <motion.div
                  key={servicio.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.07 }}
                >
                  <ServicioCard
                    servicio={servicio}
                    isSelected={selectedServices.includes(servicio.id)}
                    onToggle={() => onToggleSelect(servicio.id)}
                    mostrarPrecios={mostrarPrecios}
                    fotoUrl={ledFotoMap[servicio.id] || findPhotoForService(servicio, catalogoFotos, tipoFiesta)}
                    onOpenGallery={onOpenGallery}
                  />
                </motion.div>
              ))
            )}
          </motion.div>
        </div>
      </div>
    </SlideLayout>
  );
}

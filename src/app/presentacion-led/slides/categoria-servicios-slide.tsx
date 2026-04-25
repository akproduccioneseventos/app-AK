'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, ListChecks, Music, Camera, Utensils, Palette, Users, Zap, Package, Gift, Sparkles } from 'lucide-react';
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
}

function getServiceIcon(categoria?: string) {
  if (!categoria) return <Package className="h-8 w-8" />;
  const c = categoria.toLowerCase();
  if (c.includes('música') || c.includes('discoteca') || c.includes('dj') || c.includes('sonido')) return <Music className="h-8 w-8" />;
  if (c.includes('fotografía') || c.includes('filmación') || c.includes('video') || c.includes('foto')) return <Camera className="h-8 w-8" />;
  if (c.includes('catering') || c.includes('bebida') || c.includes('repostería') || c.includes('menú') || c.includes('gastro')) return <Utensils className="h-8 w-8" />;
  if (c.includes('decoración') || c.includes('decoracion')) return <Palette className="h-8 w-8" />;
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

  // Try to match by service name first (most specific)
  const byNombre = safeFotos.filter(f => {
    const tituloLower = (f.titulo ?? '').toLowerCase();
    return tituloLower && nombreLower && (
      tituloLower.includes(nombreLower) || nombreLower.includes(tituloLower)
    );
  });

  // Then by catalog categoria matching service name
  const byCategoria = safeFotos.filter(f =>
    f.categoriaServicio.toLowerCase() === catLower,
  );

  const candidates = byNombre.length > 0 ? byNombre : byCategoria;
  if (candidates.length === 0) return null;

  // Prefer photos matching the event type
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
}: {
  servicio: ServicioEmpresa;
  isSelected: boolean;
  onToggle: () => void;
  mostrarPrecios: boolean;
  fotoUrl?: string | null;
}) {
  const [showSpecs, setShowSpecs] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const specs = getCatalogSpecsForService(servicio.categoria, servicio.nombre);
  const price = mostrarPrecios ? formatPrice(servicio) : null;
  const showPhoto = fotoUrl != null && isSafeHttpsUrl(fotoUrl) && !imgFailed;

  return (
    <div
      className={cn(
        'rounded-2xl border-2 transition-all duration-200 overflow-hidden',
        isSelected
          ? 'border-emerald-400 bg-emerald-500/10'
          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20',
      )}
    >
      {showPhoto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fotoUrl!}
          alt={servicio.nombre}
          className="w-full h-36 object-cover"
          onError={() => setImgFailed(true)}
        />
      )}
      {!showPhoto && (
        <div className="w-full h-28 bg-gradient-to-br from-slate-800/60 to-slate-700/40 flex items-center justify-center border-b border-white/10">
          <div className="flex flex-col items-center gap-1 opacity-40">
            <Camera className="h-6 w-6 text-white/60" />
            <span className="text-white/50 text-xs">Sin foto</span>
          </div>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Select button */}
          <button
            onClick={onToggle}
            className={cn(
              'shrink-0 h-7 w-7 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all',
              isSelected ? 'border-emerald-400 bg-emerald-500' : 'border-white/30 hover:border-white/60',
            )}
          >
            {isSelected && <Check className="h-4 w-4 text-white" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-white font-bold text-base leading-tight">{servicio.nombre}</h3>
              {price && (
                <span className="text-emerald-400 font-bold text-sm shrink-0">{price}</span>
              )}
            </div>
            {servicio.notas && (
              <p className="text-white/60 text-sm mt-1 leading-relaxed line-clamp-2">{servicio.notas}</p>
            )}
          </div>
        </div>

        {/* Specs toggle */}
        {specs.length > 0 && (
          <button
            onClick={() => setShowSpecs(v => !v)}
            className="mt-3 flex items-center gap-1.5 text-indigo-300 text-xs font-semibold hover:text-indigo-200 transition-colors"
          >
            <ListChecks className="h-3.5 w-3.5" />
            {showSpecs ? 'Ocultar detalles' : '¿Qué incluye?'}
            {showSpecs ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
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
            <div className="px-4 pb-4 border-t border-white/10 pt-3">
              <ul className="space-y-1.5">
                {specs.map((spec, i) => (
                  <li key={i} className="flex items-start gap-2 text-white/70 text-sm">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
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
}: CategoriaServiciosSlideProps) {
  const allSelected = servicios.every(s => selectedServices.includes(s.id));
  const anySelected = servicios.some(s => selectedServices.includes(s.id));
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());

  const categorySlug = slugify(categoria);

  // Memoize filtered catalog photos to avoid recalculating on every render
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
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-4 mb-6"
        >
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-emerald-500/30 border border-white/20 flex items-center justify-center text-white/80 shrink-0">
            {getServiceIcon(categoria)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="text-xs px-3 py-1 bg-white/10 text-white/60 border border-white/20 uppercase tracking-widest font-medium">
                Servicio {categoriaIndex + 1} de {totalCategorias}
              </Badge>
              {anySelected && (
                <Badge className="text-xs px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <Check className="h-3 w-3 mr-1" />
                  {servicios.filter(s => selectedServices.includes(s.id)).length} seleccionado{servicios.filter(s => selectedServices.includes(s.id)).length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-lg">
              {categoria}
            </h1>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Category-level images (shown when multiple photos exist) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-4"
          >
            {visibleFotos.length > 0 ? (
              <div className={cn(
                'grid gap-2 rounded-2xl overflow-hidden',
                visibleFotos.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
              )}>
                {visibleFotos.map((foto) => (
                   // eslint-disable-next-line @next/next/no-img-element
                   <img
                     key={foto.id}
                     src={foto.url}
                     alt={foto.titulo ?? categoria}
                     className={cn(
                       'w-full object-cover rounded-xl',
                       visibleFotos.length === 1 ? 'aspect-[4/3]' : 'aspect-square',
                     )}
                     onError={() => setFailedIds(prev => new Set(prev).add(foto.id))}
                   />
                ))}
              </div>
            ) : (
              <ImagePlaceholder
                id={`categoria-${categorySlug}-hero`}
                label={`Foto de ${categoria}`}
                aspectRatio="4/3"
              />
            )}

            {/* Select all / deselect all shortcut */}
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
                  'w-full py-2.5 rounded-xl text-sm font-semibold border transition-all',
                  allSelected
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30'
                    : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10',
                )}
              >
                {allSelected ? '✓ Todo seleccionado' : 'Seleccionar todos'}
              </button>
            )}
          </motion.div>

          {/* Right: Service cards — each with its own photo */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-col gap-3 overflow-y-auto max-h-[50vh] lg:max-h-none pr-1"
          >
            {servicios.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                Elegí el tipo de fiesta para ver las opciones personalizadas.
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
                    fotoUrl={findPhotoForService(servicio, catalogoFotos, tipoFiesta)}
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

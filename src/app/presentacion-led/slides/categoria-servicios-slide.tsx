'use client';

import { useState } from 'react';
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

interface CategoriaServiciosSlideProps {
  categoria: string;
  servicios: ServicioEmpresa[];
  selectedServices: string[];
  onToggleSelect: (id: string) => void;
  mostrarPrecios: boolean;
  categoriaIndex: number;
  totalCategorias: number;
  catalogoFotos?: CatalogoFoto[];
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

function ServicioCard({
  servicio,
  isSelected,
  onToggle,
  mostrarPrecios,
}: {
  servicio: ServicioEmpresa;
  isSelected: boolean;
  onToggle: () => void;
  mostrarPrecios: boolean;
}) {
  const [showSpecs, setShowSpecs] = useState(false);
  const specs = getCatalogSpecsForService(servicio.categoria, servicio.nombre);
  const price = mostrarPrecios ? formatPrice(servicio) : null;

  return (
    <div
      className={cn(
        'rounded-2xl border-2 transition-all duration-200 overflow-hidden',
        isSelected
          ? 'border-emerald-400 bg-emerald-500/10'
          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20',
      )}
    >
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
}: CategoriaServiciosSlideProps) {
  const allSelected = servicios.every(s => selectedServices.includes(s.id));
  const anySelected = servicios.some(s => selectedServices.includes(s.id));

  const categorySlug = slugify(categoria);

  // Filter catalog photos matching this category (up to 4)
  const fotosCategoria = catalogoFotos
    .filter(f => f.categoriaServicio.toLowerCase() === categoria.toLowerCase())
    .slice(0, 4);

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
          {/* Left: Image placeholder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-4"
          >
            {fotosCategoria.length > 0 ? (
              <div className={cn(
                'grid gap-2 rounded-2xl overflow-hidden',
                fotosCategoria.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
              )}>
                {fotosCategoria.map((foto, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={foto.id}
                    src={foto.url}
                    alt={foto.titulo ?? categoria}
                    className={cn(
                      'w-full object-cover rounded-xl',
                      fotosCategoria.length === 1 ? 'aspect-[4/3]' : 'aspect-square',
                    )}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
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

          {/* Right: Service cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-col gap-3 overflow-y-auto max-h-[50vh] lg:max-h-none pr-1"
          >
            {servicios.map((servicio, i) => (
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
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </SlideLayout>
  );
}

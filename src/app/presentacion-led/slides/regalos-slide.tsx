'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Gift, Star, Info, ExternalLink } from 'lucide-react';
import { SlideLayout } from '../components/slide-layout';
import { getContenidoPorTipo } from '../lib/contenido-por-tipo';
import { cn } from '@/lib/utils';
import type { ServicioEmpresa } from '@/types/empresa';
import type { CatalogoFoto } from '@/types/catalogo';

interface RegalosSlideProps {
  servicios: ServicioEmpresa[];
  tipoFiesta: string;
  catalogoFotos?: CatalogoFoto[];
  /** Map of service ID → uploaded LED photo URL */
  ledFotoMap?: Record<string, string>;
  onOpenGallery?: (categoria: string) => void;
}

const DEFAULT_REGALOS = [
  { titulo: 'Consultoría gratuita', descripcion: 'Una reunión de planificación personalizada sin cargo.' },
  { titulo: 'Descuento especial', descripcion: 'Beneficio exclusivo por contratar el servicio integral.' },
  { titulo: 'Coordinador dedicado', descripcion: 'Un coordinador asignado a tu evento durante todo el día.' },
  { titulo: 'Sorpresa para el festejado/a', descripcion: 'Un detalle especial que preparamos con mucho cariño.' },
];

const REGALOS_FALLBACK_POOL = [
  '/media/catalogo-servicios/fotografia_cabina_img_252_p27_x1692.jpeg',
  '/media/catalogo-servicios/xv-pista-iluminada-01.jpeg',
  '/media/catalogo-servicios/social_persuasivo.png',
  '/media/catalogo-servicios/discoteca-iluminacion-bolas-01.jpeg',
  '/media/catalogo-servicios/postres-mesa-ak-01.jpeg',
  '/media/catalogo-servicios/organizador_equipo.png',
  '/media/catalogo-servicios/tecnologia_fiesta.png',
  '/media/catalogo-servicios/familia_feliz_evento.png',
  '/media/catalogo-servicios/souvenirs-cotillon-01.jpeg',
  '/media/catalogo-servicios/souvenirs_cotillon_img_174_p15_x1525.jpeg',
  '/media/catalogo-servicios/souvenirs_cotillon_img_175_p15_x1526.jpeg',
  '/media/catalogo-servicios/souvenirs_cotillon_img_176_p15_x1527.jpeg',
  '/media/catalogo-servicios/recepcion-display-evento-01.jpeg',
  '/media/catalogo-servicios/boda_persuasiva.png',
  '/media/catalogo-servicios/quinceanera_persuasiva.png',
  '/media/catalogo-servicios/montaje_equipo.png',
];

function getGiftThemePool(titulo: string): string[] {
  const n = titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (n.includes('album') || n.includes('foto')) {
    return ['/media/catalogo-servicios/fotografia_cabina_img_252_p27_x1692.jpeg', ...REGALOS_FALLBACK_POOL];
  }
  if (n.includes('fuego')) {
    return ['/media/catalogo-servicios/xv-pista-iluminada-01.jpeg', ...REGALOS_FALLBACK_POOL];
  }
  if (n.includes('invitacion')) {
    return ['/media/catalogo-servicios/social_persuasivo.png', ...REGALOS_FALLBACK_POOL];
  }
  if (n.includes('burbuja')) {
    return ['/media/catalogo-servicios/discoteca-iluminacion-bolas-01.jpeg', ...REGALOS_FALLBACK_POOL];
  }
  if (n.includes('cafe')) {
    return ['/media/catalogo-servicios/postres-mesa-ak-01.jpeg', ...REGALOS_FALLBACK_POOL];
  }
  if (n.includes('organizacion') || n.includes('coordinador') || n.includes('consultoria')) {
    return ['/media/catalogo-servicios/organizador_equipo.png', ...REGALOS_FALLBACK_POOL];
  }
  if (n.includes('pantalla') || n.includes('proyector')) {
    return ['/media/catalogo-servicios/tecnologia_fiesta.png', ...REGALOS_FALLBACK_POOL];
  }
  if (n.includes('video')) {
    return ['/media/catalogo-servicios/familia_feliz_evento.png', ...REGALOS_FALLBACK_POOL];
  }
  if (n.includes('descuento')) {
    return ['/media/catalogo-servicios/boda_persuasiva.png', ...REGALOS_FALLBACK_POOL];
  }
  if (n.includes('sorpresa')) {
    return ['/media/catalogo-servicios/quinceanera_persuasiva.png', ...REGALOS_FALLBACK_POOL];
  }
  return REGALOS_FALLBACK_POOL;
}

function isSafeHttpsUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith('/')) return true;
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

export function RegalosSlide({ servicios, tipoFiesta, catalogoFotos = [], ledFotoMap = {}, onOpenGallery }: RegalosSlideProps) {
  const contenido = getContenidoPorTipo(tipoFiesta);
  const gifts = servicios.filter(s => s.categoria === 'Regalo exclusivo');
  const itemsToShow = useMemo(
    () =>
      gifts.length > 0
        ? gifts.map(g => ({ id: g.id, titulo: g.nombre, descripcion: g.notas || '' }))
        : DEFAULT_REGALOS.map((g, i) => ({ id: `default-${i}`, ...g })),
    [gifts],
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [imgFailed, setImgFailed] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleGift = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleDesc = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleGallery = () => {
    if (onOpenGallery) {
      onOpenGallery('Regalo exclusivo');
    }
  };

  // Build a unique photo map: gift id → photo url (nunca dos regalos con el mismo src)
  const giftPhotoMap = useMemo(() => {
    const safeFotos = catalogoFotos.filter(f => isSafeHttpsUrl(f.url));
    const regaloFotos = safeFotos.filter(f =>
      f.categoriaServicio.toLowerCase().includes('regalo'),
    );
    const usedUrls = new Set<string>();
    const map: Record<string, { primary: string; fallback: string }> = {};

    itemsToShow.forEach((item, i) => {
      const pool = getGiftThemePool(item.titulo);
      let chosen: string | null = null;

      const ledUrl = ledFotoMap[item.id];
      if (ledUrl && isSafeHttpsUrl(ledUrl) && !usedUrls.has(ledUrl)) {
        chosen = ledUrl;
      }

      if (!chosen) {
        const foto = regaloFotos.find(f => !usedUrls.has(f.url));
        if (foto) {
          chosen = foto.url;
        }
      }

      if (!chosen) {
        chosen = pool.find(url => !usedUrls.has(url)) ?? REGALOS_FALLBACK_POOL[i % REGALOS_FALLBACK_POOL.length];
      }

      usedUrls.add(chosen);
      const fallback = REGALOS_FALLBACK_POOL.find(url => !usedUrls.has(url) && url !== chosen)
        ?? '/media/catalogo-servicios/souvenirs-cotillon-01.jpeg';
      map[item.id] = { primary: chosen, fallback };
    });

    return map;
  }, [catalogoFotos, itemsToShow, ledFotoMap]);

  return (
    <SlideLayout overflowScroll>
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-5"
        >
          <div className="h-12 w-12 mx-auto rounded-2xl bg-gradient-to-br from-yellow-400/30 to-rose-500/30 border border-white/20 flex items-center justify-center mb-2">
            <Gift className="h-6 w-6 text-yellow-300" />
          </div>
          <p className="text-yellow-400 font-bold uppercase tracking-widest text-xs mb-1">Beneficios exclusivos</p>
          <h1 className="text-3xl md:text-4xl font-black text-white drop-shadow-lg mb-1.5">
            🎁 Regalos & Extras
          </h1>
          <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto">
            {contenido.mensajeRegalos}
          </p>
          {selectedIds.size > 0 && (
            <p className="text-emerald-300 text-xs mt-1.5 font-semibold">
              {selectedIds.size} regalo{selectedIds.size !== 1 ? 's' : ''} seleccionado{selectedIds.size !== 1 ? 's' : ''}
            </p>
          )}
        </motion.div>

        {/* Gift grid — one unique photo per gift */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {itemsToShow.map((item, i) => {
            const isSelected = selectedIds.has(item.id);
            const fotoInfo = giftPhotoMap[item.id] ?? {
              primary: '/media/catalogo-servicios/souvenirs-cotillon-01.jpeg',
              fallback: '/media/catalogo-servicios/recepcion-display-evento-01.jpeg',
            };
            const imgBroken = imgFailed.has(item.id);
            const activeSrc = !imgBroken && isSafeHttpsUrl(fotoInfo.primary) ? fotoInfo.primary : fotoInfo.fallback;
            const isExpanded = expandedIds.has(item.id);

            return (
              <motion.div
                key={item.id}
                data-testid="regalo-card"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className={cn(
                  'relative flex flex-col overflow-hidden rounded-2xl border-2 transition-all duration-200',
                  isSelected
                    ? 'border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                    : 'border-white/15 bg-white/5 hover:border-white/30',
                )}
              >
                {/* Photo */}
                <div className="relative w-full h-24 sm:h-28 overflow-hidden bg-slate-900">
                  <Image
                    src={activeSrc}
                    alt={item.titulo}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    unoptimized
                    className="object-cover"
                    onError={() => setImgFailed(prev => new Set(prev).add(item.id))}
                  />
                </div>

                {/* Selection badge */}
                {isSelected && (
                  <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                )}

                {/* Content */}
                <div className="p-2.5 flex-1 flex flex-col">
                  <button
                    type="button"
                    onClick={() => toggleGift(item.id)}
                    className="flex items-start gap-2 text-left"
                  >
                    <Star className={cn('h-4 w-4 shrink-0 mt-0.5', isSelected ? 'text-emerald-300' : 'text-yellow-300')} />
                    <p className="text-white font-bold text-xs sm:text-sm leading-tight">{item.titulo}</p>
                  </button>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-2">
                    {item.descripcion && (
                      <button
                        onClick={() => toggleDesc(item.id)}
                        className="flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200 font-semibold transition-colors"
                      >
                        <Info className="h-3 w-3" />
                        {isExpanded ? 'Ocultar' : 'Ver más'}
                      </button>
                    )}
                    <button
                      onClick={handleGallery}
                      className="flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200 font-semibold transition-colors ml-auto"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Galería
                    </button>
                  </div>

                  <AnimatePresence>
                    {isExpanded && item.descripcion && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-white/60 text-xs mt-2 leading-relaxed overflow-hidden"
                      >
                        {item.descripcion}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </SlideLayout>
  );
}


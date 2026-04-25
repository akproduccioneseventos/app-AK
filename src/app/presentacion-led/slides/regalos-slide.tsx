'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, Gift, Star } from 'lucide-react';
import { SlideLayout } from '../components/slide-layout';
import { ImagePlaceholder } from '../components/image-placeholder';
import { getContenidoPorTipo } from '../lib/contenido-por-tipo';
import { cn } from '@/lib/utils';
import type { ServicioEmpresa } from '@/types/empresa';
import type { CatalogoFoto } from '@/types/catalogo';

interface RegalosSlideProps {
  servicios: ServicioEmpresa[];
  tipoFiesta: string;
  catalogoFotos?: CatalogoFoto[];
}

const DEFAULT_REGALOS = [
  { titulo: 'Consultoría gratuita', descripcion: 'Una reunión de planificación personalizada sin cargo.' },
  { titulo: 'Descuento especial', descripcion: 'Beneficio exclusivo por contratar el servicio integral.' },
  { titulo: 'Coordinador dedicado', descripcion: 'Un coordinador asignado a tu evento durante todo el día.' },
  { titulo: 'Sorpresa para el festejado/a', descripcion: 'Un detalle especial que preparamos con mucho cariño.' },
];

function isSafeHttpsUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

export function RegalosSlide({ servicios, tipoFiesta, catalogoFotos = [] }: RegalosSlideProps) {
  const contenido = getContenidoPorTipo(tipoFiesta);
  const gifts = servicios.filter(s => s.categoria === 'Regalo exclusivo');
  const itemsToShow = gifts.length > 0
    ? gifts.map(g => ({ id: g.id, titulo: g.nombre, descripcion: g.notas || '' }))
    : DEFAULT_REGALOS.map((g, i) => ({ id: `default-${i}`, ...g }));

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [imgFailed, setImgFailed] = useState<Set<string>>(new Set());

  const toggleGift = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Build a photo map: gift id → photo url
  const giftPhotoMap = useMemo(() => {
    const safeFotos = catalogoFotos.filter(f => isSafeHttpsUrl(f.url));
    const regaloFotos = safeFotos.filter(f =>
      f.categoriaServicio.toLowerCase().includes('regalo'),
    );
    const map: Record<string, string> = {};
    itemsToShow.forEach((item, i) => {
      const foto = regaloFotos[i];
      if (foto) map[item.id] = foto.url;
    });
    return map;
  }, [catalogoFotos, itemsToShow]);

  return (
    <SlideLayout overflowScroll>
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="h-16 w-16 mx-auto rounded-3xl bg-gradient-to-br from-yellow-400/30 to-rose-500/30 border border-white/20 flex items-center justify-center mb-4">
            <Gift className="h-8 w-8 text-yellow-300" />
          </div>
          <p className="text-yellow-400 font-bold uppercase tracking-widest text-sm mb-2">Beneficios exclusivos</p>
          <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg mb-3">
            🎁 Regalos & Extras
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            {contenido.mensajeRegalos}
          </p>
          {selectedIds.size > 0 && (
            <p className="text-emerald-300 text-sm mt-2 font-semibold">
              {selectedIds.size} regalo{selectedIds.size !== 1 ? 's' : ''} seleccionado{selectedIds.size !== 1 ? 's' : ''}
            </p>
          )}
        </motion.div>

        {/* Gift grid — one photo per gift */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {itemsToShow.map((item, i) => {
            const isSelected = selectedIds.has(item.id);
            const photoUrl = giftPhotoMap[item.id];
            const imgBroken = imgFailed.has(item.id);

            return (
              <motion.button
                key={item.id}
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                onClick={() => toggleGift(item.id)}
                className={cn(
                  'relative flex flex-col overflow-hidden rounded-2xl border-2 transition-all duration-200 text-left',
                  isSelected
                    ? 'border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                    : 'border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30',
                )}
              >
                {/* Photo */}
                {photoUrl && !imgBroken ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt={item.titulo}
                    className="w-full h-32 object-cover"
                    onError={() => setImgFailed(prev => new Set(prev).add(item.id))}
                  />
                ) : (
                  <ImagePlaceholder
                    id={`regalo-foto-${item.id}`}
                    label={item.titulo}
                    aspectRatio="4/3"
                    className="rounded-none border-0 border-b border-white/10"
                  />
                )}

                {/* Selection badge */}
                {isSelected && (
                  <div className="absolute top-2 right-2 h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}

                {/* Content */}
                <div className="flex items-start gap-2 p-3">
                  <Star className={cn('h-4 w-4 shrink-0 mt-0.5', isSelected ? 'text-emerald-300' : 'text-yellow-300')} />
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">{item.titulo}</p>
                    {item.descripcion && (
                      <p className="text-white/60 text-xs mt-1 leading-relaxed">{item.descripcion}</p>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </SlideLayout>
  );
}


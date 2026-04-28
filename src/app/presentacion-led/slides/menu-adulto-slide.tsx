'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Utensils, Info, ImageIcon, ExternalLink } from 'lucide-react';
import { SlideLayout } from '../components/slide-layout';
import { cn } from '@/lib/utils';
import type { FullMenu, MenuItem } from '@/types/catering';

interface MenuAdultoSlideProps {
  menus: FullMenu[];
  selectedMenuId: string | null;
  ledFotoMap?: Record<string, string>;
  mostrarPrecios?: boolean;
  onSelect: (id: string | null) => void;
  onNext: () => void;
}

function isSafeUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

function getPlatoPrincipal(menu: FullMenu): MenuItem | undefined {
  return menu.items.find(item => item.type === 'Plato Principal');
}

function MenuCard({
  menu,
  isSelected,
  onSelect,
  mostrarPrecios,
  photoUrl,
}: {
  menu: FullMenu;
  isSelected: boolean;
  onSelect: () => void;
  mostrarPrecios: boolean;
  photoUrl?: string | null;
}) {
  const [showDesc, setShowDesc] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const safePhoto = photoUrl && isSafeUrl(photoUrl) && !imgFailed ? photoUrl : null;
  const platoPrincipal = getPlatoPrincipal(menu);

  const handleGallery = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('desde_presentacion_led', 'true');
      const slide = sessionStorage.getItem('presentacion_slide_actual') ?? '0';
      sessionStorage.setItem('presentacion_slide_regreso', slide);
      // Always navigate to the Catering category in the gallery
      window.location.assign('/galeria-led?categoria=Catering');
    }
  };

  return (
    <div
      className={cn(
        'rounded-2xl border-2 overflow-hidden transition-all duration-200',
        isSelected
          ? 'border-orange-400 bg-orange-500/10 shadow-lg shadow-orange-500/10'
          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20',
      )}
    >
      {/* Photo */}
      {safePhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={safePhoto}
          alt={menu.name}
          className="w-full h-44 object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="w-full h-36 bg-gradient-to-br from-orange-900/30 to-amber-800/20 flex items-center justify-center border-b border-white/10">
          <div className="flex flex-col items-center gap-1 opacity-40">
            <ImageIcon className="h-8 w-8 text-orange-300" />
            <span className="text-orange-200/60 text-xs">Menú</span>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-3 mb-2">
          {/* Select toggle */}
          <button
            onClick={onSelect}
            className={cn(
              'shrink-0 h-8 w-8 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all',
              isSelected ? 'border-orange-400 bg-orange-500' : 'border-white/30 hover:border-white/60',
            )}
          >
            {isSelected && <Check className="h-4 w-4 text-white" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-white font-bold text-base leading-tight">{menu.name}</p>
              {mostrarPrecios && platoPrincipal?.suggestedSellingPrice != null && platoPrincipal.suggestedSellingPrice > 0 && (
                <span className="text-orange-300 font-bold text-sm shrink-0">
                  ${platoPrincipal.suggestedSellingPrice.toLocaleString('es-UY')} /pers.
                </span>
              )}
            </div>
            {platoPrincipal && (
              <p className="text-white/50 text-xs mt-0.5">{platoPrincipal.name}</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          {menu.description && (
            <button
              onClick={() => setShowDesc(v => !v)}
              className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-indigo-200 font-semibold transition-colors"
            >
              <Info className="h-3.5 w-3.5" />
              {showDesc ? 'Ocultar' : 'Descripción'}
            </button>
          )}
          <button
            onClick={handleGallery}
            className="flex items-center gap-1.5 text-xs text-emerald-300 hover:text-emerald-200 font-semibold transition-colors ml-auto"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver galería
          </button>
        </div>

        <AnimatePresence>
          {showDesc && menu.description && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="text-white/60 text-sm mt-2 leading-relaxed pt-2 border-t border-white/10">
                {menu.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function MenuAdultoSlide({
  menus,
  selectedMenuId,
  ledFotoMap = {},
  mostrarPrecios = true,
  onSelect,
  onNext,
}: MenuAdultoSlideProps) {
  const canContinue = !!selectedMenuId;

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
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-400/30 to-red-500/30 border border-white/20 flex items-center justify-center shrink-0">
            <Utensils className="h-7 w-7 text-orange-300" />
          </div>
          <div>
            <p className="text-orange-400 font-bold uppercase tracking-widest text-xs mb-1">Menú adultos</p>
            <h1 className="text-3xl md:text-4xl font-black text-white drop-shadow-lg">
              Elegí el Menú Principal
            </h1>
            <p className="text-white/60 text-sm mt-1">Seleccioná el plato principal del evento</p>
          </div>
        </motion.div>

        {menus.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <Utensils className="h-12 w-12 mx-auto text-white/30 mb-3" />
            <p className="text-white/50 text-lg">No hay menús configurados.</p>
            <p className="text-white/30 text-sm mt-1">Podés continuar y elegir el menú al presupuestar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menus.map((menu, i) => (
              <motion.div
                key={menu.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.07 }}
              >
                <MenuCard
                  menu={menu}
                  isSelected={selectedMenuId === menu.id}
                  onSelect={() => onSelect(menu.id)}
                  mostrarPrecios={mostrarPrecios}
                  photoUrl={ledFotoMap[menu.id] || menu.imageUrl || null}
                />
              </motion.div>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <button
            onClick={onNext}
            disabled={menus.length > 0 && !canContinue}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar
            <ChevronRight className="h-5 w-5" />
          </button>
          {menus.length > 0 && !canContinue && (
            <p className="text-orange-300 text-xs mt-2 text-center">
              Seleccioná un menú para avanzar.
            </p>
          )}
        </motion.div>
      </div>
    </SlideLayout>
  );
}

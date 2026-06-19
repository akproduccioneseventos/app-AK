'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Check, ChevronRight, Sparkles, Info, ImageIcon, ExternalLink } from 'lucide-react';
import { SlideLayout } from '../components/slide-layout';
import { cn } from '@/lib/utils';
import type { MenuItem } from '@/types/catering';
import { getCateringDishImage } from '@/lib/catering/menu-images';

interface MenuAdolescenteSlideProps {
  adolescentesCount: number;
  options: MenuItem[];
  selectedOptionId: string | null;
  ledFotoMap?: Record<string, string>;
  mostrarPrecios?: boolean;
  onSelect: (id: string | null) => void;
  onNext: () => void;
}

function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith('/')) return true;
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

function TeenCard({
  option,
  isSelected,
  onSelect,
  mostrarPrecios,
  photoUrl,
}: {
  option: MenuItem;
  isSelected: boolean;
  onSelect: () => void;
  mostrarPrecios: boolean;
  photoUrl?: string | null;
}) {
  const [showDesc, setShowDesc] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const safePhoto = photoUrl && isSafeUrl(photoUrl) && !imgFailed ? photoUrl : null;

  const handleGallery = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('desde_presentacion_led', 'true');
      const slide = sessionStorage.getItem('presentacion_slide_actual') ?? '0';
      sessionStorage.setItem('presentacion_slide_regreso', slide);
      window.location.assign('/galeria-led?categoria=Catering');
    }
  };

  return (
    <div
      className={cn(
        'rounded-2xl border-2 overflow-hidden transition-all duration-200',
        isSelected
          ? 'border-violet-400 bg-violet-500/10 shadow-lg shadow-violet-500/10'
          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20',
      )}
    >
      {/* Photo */}
      {safePhoto ? (
        <div className="relative w-full h-40 overflow-hidden">
          <Image
            src={safePhoto}
            alt={option.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
            className="object-cover"
            onError={() => setImgFailed(true)}
          />
        </div>
      ) : (
        <div className="w-full h-36 bg-gradient-to-br from-violet-900/30 to-indigo-800/20 flex items-center justify-center border-b border-white/10">
          <div className="flex flex-col items-center gap-1 opacity-40">
            <ImageIcon className="h-8 w-8 text-violet-300" />
            <span className="text-violet-200/60 text-xs">Menú Adolescente</span>
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
              isSelected ? 'border-violet-400 bg-violet-500' : 'border-white/30 hover:border-white/60',
            )}
          >
            {isSelected && <Check className="h-4 w-4 text-white" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-white font-bold text-base leading-tight">{option.name}</p>
              {mostrarPrecios && option.suggestedSellingPrice != null && option.suggestedSellingPrice > 0 && (
                <span className="text-violet-300 font-bold text-sm shrink-0">
                  ${option.suggestedSellingPrice.toLocaleString('es-UY')} /pers.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          {option.notes && (
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
          {showDesc && option.notes && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="text-white/60 text-sm mt-2 leading-relaxed pt-2 border-t border-white/10">
                {option.notes}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function MenuAdolescenteSlide({
  adolescentesCount,
  options,
  selectedOptionId,
  ledFotoMap = {},
  mostrarPrecios = true,
  onSelect,
  onNext,
}: MenuAdolescenteSlideProps) {
  const requiresSelection = adolescentesCount > 0 && options.length > 0;
  const canContinue = !requiresSelection || !!selectedOptionId;

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
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-400/30 to-indigo-500/30 border border-white/20 flex items-center justify-center shrink-0">
            <Sparkles className="h-7 w-7 text-violet-300" />
          </div>
          <div>
            <p className="text-violet-400 font-bold uppercase tracking-widest text-xs mb-1">Paso condicional</p>
            <h1 className="text-3xl md:text-4xl font-black text-white drop-shadow-lg">
              Menú Adolescente
            </h1>
            <p className="text-white/60 text-sm mt-1">
              {adolescentesCount > 0
                ? `Evento con ${adolescentesCount} adolescente${adolescentesCount === 1 ? '' : 's'}. Seleccioná su menú.`
                : 'No hay adolescentes en el evento. Podés seguir con el menú adulto.'}
            </p>
          </div>
        </motion.div>

        {requiresSelection ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {options.map((opt, idx) => (
              <motion.div
                key={opt.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + idx * 0.07 }}
              >
                <TeenCard
                  option={opt}
                  isSelected={selectedOptionId === opt.id}
                  onSelect={() => onSelect(opt.id)}
                  mostrarPrecios={mostrarPrecios}
                  photoUrl={ledFotoMap[opt.id] || getCateringDishImage(opt) || null}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-white/30 mb-3" />
            <p className="text-white/50 text-lg">No se requiere menú adolescente para esta configuración.</p>
            <p className="text-white/30 text-sm mt-1">Podés continuar al siguiente paso directamente.</p>
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
            disabled={!canContinue}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar
            <ChevronRight className="h-5 w-5" />
          </button>
          {requiresSelection && !selectedOptionId && (
            <p className="text-violet-300 text-xs mt-2 text-center">
              Seleccioná una opción de menú para avanzar.
            </p>
          )}
        </motion.div>
      </div>
    </SlideLayout>
  );
}

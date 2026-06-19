'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CatalogoFoto } from '@/types/catalogo';
import Image from 'next/image';

interface GaleriaLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  fotos: CatalogoFoto[];
  categoriaLabel?: string;
  initialIndex?: number;
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

export function GaleriaLightboxModal({
  isOpen,
  onClose,
  fotos,
  categoriaLabel = 'Galería',
  initialIndex = 0,
}: GaleriaLightboxModalProps) {
  const safeFotos = fotos.filter((f) => isSafeHttpsUrl(f.url));
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [imgFailed, setImgFailed] = useState<Set<string>>(new Set());

  // Reset index when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(Math.min(initialIndex, Math.max(0, safeFotos.length - 1)));
      setImgFailed(new Set());
    }
  }, [isOpen, initialIndex, safeFotos.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? safeFotos.length - 1 : prev - 1));
  }, [safeFotos.length]);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev === safeFotos.length - 1 ? 0 : prev + 1));
  }, [safeFotos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') { e.stopPropagation(); goPrev(); }
      if (e.key === 'ArrowRight') { e.stopPropagation(); goNext(); }
    };
    window.addEventListener('keydown', handler, { capture: true });
    return () => window.removeEventListener('keydown', handler, { capture: true });
  }, [isOpen, onClose, goPrev, goNext]);

  const activeFoto = safeFotos[activeIndex];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex flex-col"
          style={{ background: 'rgba(2, 6, 23, 0.97)' }}
          onClick={onClose}
        >
          {/* Blur background blobs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-indigo-600/15 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-emerald-600/15 blur-3xl" />
          </div>

          {/* Header */}
          <div
            className="relative z-10 flex items-center justify-between px-6 py-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10">
                <Camera className="h-4 w-4 text-white/70" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">{categoriaLabel}</h2>
                {safeFotos.length > 0 && (
                  <p className="text-xs text-white/40">
                    {activeIndex + 1} / {safeFotos.length}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white/70 transition-all hover:border-white/40 hover:bg-white/20 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Main image area */}
          <div
            className="relative flex flex-1 items-center justify-center overflow-hidden px-4"
            onClick={(e) => e.stopPropagation()}
          >
            {safeFotos.length === 0 ? (
              <div className="flex flex-col items-center gap-4 text-white/40">
                <ZoomIn className="h-16 w-16" />
                <p className="text-lg font-semibold">No hay fotos disponibles aún</p>
                <p className="text-sm">Pronto agregaremos imágenes para esta categoría.</p>
              </div>
            ) : (
              <>
                {/* Prev button */}
                {safeFotos.length > 1 && (
                  <button
                    onClick={goPrev}
                    className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/80 backdrop-blur-sm transition-all hover:border-white/50 hover:bg-black/60 hover:text-white"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}

                {/* Image */}
                <AnimatePresence mode="wait">
                  {activeFoto && !imgFailed.has(activeFoto.id) ? (
                    <motion.img
                      key={activeFoto.id}
                      src={activeFoto.url}
                      alt={activeFoto.titulo ?? categoriaLabel}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                      className="max-h-[70vh] max-w-full rounded-2xl object-contain shadow-2xl"
                      style={{ filter: 'drop-shadow(0 0 60px rgba(99,102,241,0.2))' }}
                      onError={() =>
                        setImgFailed((prev) => new Set(prev).add(activeFoto.id))
                      }
                    />
                  ) : (
                    <motion.div
                      key="fallback"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-3 text-white/40"
                    >
                      <Camera className="h-12 w-12" />
                      <p className="text-sm">Imagen no disponible</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Next button */}
                {safeFotos.length > 1 && (
                  <button
                    onClick={goNext}
                    className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/80 backdrop-blur-sm transition-all hover:border-white/50 hover:bg-black/60 hover:text-white"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Caption + dot indicators */}
          {safeFotos.length > 0 && (
            <div
              className="relative z-10 flex flex-col items-center gap-3 px-6 pb-6 pt-4"
              onClick={(e) => e.stopPropagation()}
            >
              {activeFoto?.titulo && (
                <p className="text-center text-sm font-semibold text-white/70">
                  {activeFoto.titulo}
                </p>
              )}
              {/* Thumbnail strip */}
              {safeFotos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {safeFotos.map((foto, i) => (
                    <button
                      key={foto.id}
                      onClick={() => setActiveIndex(i)}
                      className={cn(
                        'relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                        i === activeIndex
                          ? 'border-emerald-400 opacity-100'
                          : 'border-white/10 opacity-50 hover:opacity-80',
                      )}
                    >
                      {!imgFailed.has(foto.id) ? (
                        <Image
                          src={foto.url}
                          alt={foto.titulo ?? ''}
                          fill
                          unoptimized
                          className="object-cover"
                          onError={() =>
                            setImgFailed((prev) => new Set(prev).add(foto.id))
                          }
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-800">
                          <Camera className="h-4 w-4 text-white/30" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-white/25">ESC para cerrar · ← → navegar</p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

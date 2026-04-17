'use client';

import { motion } from 'framer-motion';
import { Check, ChevronRight, Utensils, BookOpen } from 'lucide-react';
import { SlideLayout } from '../components/slide-layout';
import { ImagePlaceholder } from '../components/image-placeholder';
import { cn } from '@/lib/utils';
import type { FullMenu } from '@/types/catering';

interface MenuSlideProps {
  menus: FullMenu[];
  selectedMenuId: string | null;
  entradasCount: 1 | 2;
  adolescentesCount: number;
  onSelectMenu: (id: string | null) => void;
  onChangeEntradasCount: (count: 1 | 2) => void;
  onNext: () => void;
}

export function MenuSlide({
  menus,
  selectedMenuId,
  entradasCount,
  adolescentesCount,
  onSelectMenu,
  onChangeEntradasCount,
  onNext,
}: MenuSlideProps) {
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
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400/30 to-orange-500/30 border border-white/20 flex items-center justify-center">
            <Utensils className="h-7 w-7 text-amber-300" />
          </div>
          <div>
            <p className="text-amber-400 font-bold uppercase tracking-widest text-xs mb-1">Gastronomía</p>
            <h1 className="text-3xl md:text-4xl font-black text-white drop-shadow-lg">
              Seleccioná el Menú
            </h1>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Image placeholder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <ImagePlaceholder
              id="menu-foto"
              label="Foto de la propuesta gastronómica"
              aspectRatio="4/3"
            />
          </motion.div>

          {/* Right: Menu options */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            {menus.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-white/30 mb-3" />
                <p className="text-white/50 text-lg">No hay menús configurados aún.</p>
                <p className="text-white/30 text-sm mt-1">Podés continuar y elegir el menú al presupuestar.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {menus.map((menu, i) => (
                  <motion.button
                    key={menu.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.07 }}
                    onClick={() => onSelectMenu(menu.id)}
                    className={cn(
                      'text-left p-4 rounded-2xl border-2 transition-all w-full',
                      selectedMenuId === menu.id
                        ? 'border-amber-400 bg-amber-400/20'
                        : 'border-white/10 bg-white/5 hover:bg-white/10',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5', selectedMenuId === menu.id ? 'border-amber-400 bg-amber-400' : 'border-white/30')}>
                        {selectedMenuId === menu.id && <Check className="h-4 w-4 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold leading-tight">{menu.name}</p>
                        {menu.description && <p className="text-white/50 text-xs mt-0.5 line-clamp-2">{menu.description}</p>}
                        {menu.items && menu.items.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {menu.items.slice(0, 4).map(item => (
                              <span key={item.id} className="text-xs bg-white/10 text-white/60 rounded-full px-2 py-0.5">{item.name}</span>
                            ))}
                            {menu.items.length > 4 && <span className="text-xs text-white/40">+{menu.items.length - 4} más</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            <div className="mt-4 rounded-2xl border border-white/20 bg-white/5 p-4 space-y-3">
              <p className="text-white font-semibold text-sm uppercase tracking-wider">Configuración de entradas</p>
              <div className="grid grid-cols-2 gap-2">
                {[1, 2].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => onChangeEntradasCount(count as 1 | 2)}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
                      entradasCount === count
                        ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                        : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10',
                    )}
                  >
                    {count} entrada{count > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
              {adolescentesCount > 0 && (
                <p className="text-xs text-amber-200">
                  Hay {adolescentesCount} adolescente{adolescentesCount === 1 ? '' : 's'}: en el siguiente paso se define su menú específico.
                </p>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-4"
            >
              <button
                onClick={onNext}
                disabled={!canContinue}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-lg transition-all flex items-center justify-center gap-2"
              >
                Continuar
                <ChevronRight className="h-5 w-5" />
              </button>
              {!canContinue && (
                <p className="text-amber-300 text-xs mt-2 text-center">
                  Seleccioná un menú principal para avanzar.
                </p>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </SlideLayout>
  );
}

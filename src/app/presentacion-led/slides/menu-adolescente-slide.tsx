'use client';

import { motion } from 'framer-motion';
import { Check, ChevronRight, UserRound } from 'lucide-react';
import { SlideLayout } from '../components/slide-layout';
import { cn } from '@/lib/utils';

interface TeenMenuOption {
  id: string;
  name: string;
}

interface MenuAdolescenteSlideProps {
  adolescentesCount: number;
  options: TeenMenuOption[];
  selectedOptionId: string | null;
  onSelect: (id: string) => void;
  onNext: () => void;
}

export function MenuAdolescenteSlide({
  adolescentesCount,
  options,
  selectedOptionId,
  onSelect,
  onNext,
}: MenuAdolescenteSlideProps) {
  const requiresSelection = adolescentesCount > 0 && options.length > 0;
  const canContinue = !requiresSelection || !!selectedOptionId;

  return (
    <SlideLayout overflowScroll>
      <div className="w-full max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <p className="text-violet-300 font-bold uppercase tracking-widest text-xs mb-1">Paso condicional</p>
          <h1 className="text-3xl md:text-4xl font-black text-white">Menú Adolescente</h1>
          <p className="text-white/60 mt-2">
            {adolescentesCount > 0
              ? `Evento con ${adolescentesCount} adolescente${adolescentesCount === 1 ? '' : 's'}. Seleccioná su menú.`
              : 'No hay adolescentes en el evento. Podés seguir con el menú adulto.'}
          </p>
        </motion.div>

        {requiresSelection ? (
          <div className="space-y-3">
            {options.map((opt, idx) => (
              <motion.button
                key={opt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + idx * 0.06 }}
                onClick={() => onSelect(opt.id)}
                className={cn(
                  'w-full rounded-2xl border-2 p-4 text-left transition-all',
                  selectedOptionId === opt.id
                    ? 'border-violet-400 bg-violet-500/20'
                    : 'border-white/15 bg-white/5 hover:bg-white/10',
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'h-7 w-7 rounded-full border-2 flex items-center justify-center',
                    selectedOptionId === opt.id ? 'border-violet-300 bg-violet-400 text-white' : 'border-white/40',
                  )}>
                    {selectedOptionId === opt.id ? <Check className="h-4 w-4" /> : <UserRound className="h-4 w-4 text-white/50" />}
                  </span>
                  <span className="text-white font-semibold">{opt.name}</span>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/15 bg-white/5 p-5 text-white/80">
            No se requiere menú adolescente para esta configuración.
          </div>
        )}

        <button
          onClick={onNext}
          disabled={!canContinue}
          className="mt-6 w-full h-14 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-lg transition-all flex items-center justify-center gap-2"
        >
        Continuar
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </SlideLayout>
  );
}

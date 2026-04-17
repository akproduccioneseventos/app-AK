'use client';

import { motion } from 'framer-motion';
import { ChefHat, ChevronRight, Shirt, Soup, Table2, UserCheck, Users } from 'lucide-react';
import { SlideLayout } from '../components/slide-layout';
import type { ResourceSummary } from '../lib/tipos';

interface RecursosSlideProps {
  summary: ResourceSummary;
  onNext: () => void;
}

const formatBool = (v: boolean) => (v ? 'Sí' : 'No');

export function RecursosSlide({ summary, onNext }: RecursosSlideProps) {
  const cards = [
    { icon: Users, label: 'Invitados', value: summary.invitadosTotales },
    { icon: Table2, label: 'Mesas', value: summary.mesas },
    { icon: Soup, label: 'Vajilla', value: summary.vajilla },
    { icon: Shirt, label: 'Mantelería', value: summary.manteleria },
    { icon: UserCheck, label: 'Mozos', value: summary.mozos },
    { icon: ChefHat, label: 'Asador', value: formatBool(summary.requiereAsador) },
  ];

  return (
    <SlideLayout overflowScroll>
      <div className="w-full max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <p className="text-emerald-300 font-bold uppercase tracking-widest text-xs mb-1">Paso 4</p>
          <h1 className="text-3xl md:text-4xl font-black text-white">Cálculo automático de recursos</h1>
          <p className="text-white/60 mt-2">Estimación inmediata según menú, invitados y duración configurada.</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {cards.map((card, idx) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.05 }}
              className="rounded-2xl border border-white/15 bg-white/5 p-4"
            >
              <card.icon className="h-5 w-5 text-emerald-300 mb-2" />
              <p className="text-white/50 text-xs uppercase tracking-widest font-semibold">{card.label}</p>
              <p className="text-white text-2xl font-black mt-1">{card.value}</p>
            </motion.div>
          ))}
        </div>

        <button
          onClick={onNext}
          className="mt-6 w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-lg transition-all flex items-center justify-center gap-2"
        >
          Continuar a secciones especiales
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </SlideLayout>
  );
}

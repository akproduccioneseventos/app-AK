'use client';

import { motion } from 'framer-motion';
import { Gift, Star } from 'lucide-react';
import { SlideLayout } from '../components/slide-layout';
import { ImagePlaceholder } from '../components/image-placeholder';
import { getContenidoPorTipo } from '../lib/contenido-por-tipo';
import type { ServicioEmpresa } from '@/types/empresa';

interface RegalosSlideProps {
  servicios: ServicioEmpresa[];
  tipoFiesta: string;
}

const DEFAULT_REGALOS = [
  { titulo: 'Consultoría gratuita', descripcion: 'Una reunión de planificación personalizada sin cargo.' },
  { titulo: 'Descuento especial', descripcion: 'Beneficio exclusivo por contratar el servicio integral.' },
  { titulo: 'Coordinador dedicado', descripcion: 'Un coordinador asignado a tu evento durante todo el día.' },
  { titulo: 'Sorpresa para el festejado/a', descripcion: 'Un detalle especial que preparamos con mucho cariño.' },
];

export function RegalosSlide({ servicios, tipoFiesta }: RegalosSlideProps) {
  const contenido = getContenidoPorTipo(tipoFiesta);
  const gifts = servicios.filter(s => s.categoria === 'Regalo exclusivo');
  const itemsToShow = gifts.length > 0 ? gifts.map(g => ({ titulo: g.nombre, descripcion: g.notas || '' })) : DEFAULT_REGALOS;

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
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Gift cards */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {itemsToShow.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-3 bg-gradient-to-br from-yellow-500/15 to-rose-500/15 border border-yellow-400/20 rounded-2xl p-4"
              >
                <Star className="h-5 w-5 text-yellow-300 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-bold text-sm">{item.titulo}</p>
                  {item.descripcion && <p className="text-white/60 text-xs mt-1 leading-relaxed">{item.descripcion}</p>}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Right: Image placeholder */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            <ImagePlaceholder
              id="regalos-foto"
              label="Foto de los regalos y extras exclusivos"
              aspectRatio="4/3"
            />
          </motion.div>
        </div>
      </div>
    </SlideLayout>
  );
}

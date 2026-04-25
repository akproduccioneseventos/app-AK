'use client';

import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { SlideLayout } from '../components/slide-layout';
import { ImagePlaceholder } from '../components/image-placeholder';

export function ContratarnosSlide({
  titulo,
  mensaje,
  ctaTexto,
  onCtaAction,
}: {
  titulo: string;
  mensaje: string;
  ctaTexto: string;
  onCtaAction: () => void;
}) {
  return (
    <SlideLayout className="text-center">
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-black text-white"
        >
          {titulo}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-white/70 text-lg"
        >
          {mensaje}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="max-w-sm mx-auto"
        >
          <ImagePlaceholder
            id="contratarnos-foto"
            label="Foto de contratación / forma de pago"
            aspectRatio="16/9"
          />
        </motion.div>

        <motion.button
          type="button"
          onClick={onCtaAction}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-indigo-600 text-white font-bold text-lg shadow-2xl hover:opacity-90 transition-opacity"
        >
          <MessageCircle className="h-5 w-5" />
          {ctaTexto}
        </motion.button>
      </div>
    </SlideLayout>
  );
}

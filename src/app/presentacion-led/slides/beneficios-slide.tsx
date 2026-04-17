'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { SlideLayout } from '../components/slide-layout';
import { ImagePlaceholder } from '../components/image-placeholder';

const BENEFICIOS = [
  { emoji: '🛡️', texto: 'Un solo proveedor para coordinar todo el evento.' },
  { emoji: '⏱️', texto: 'Puntualidad garantizada en cada etapa.' },
  { emoji: '🎧', texto: 'Atención personalizada antes, durante y después.' },
  { emoji: '⭐', texto: 'Calidad premium en servicios y ejecución.' },
  { emoji: '⚡', texto: 'Resolución inmediata ante cualquier imprevisto.' },
  { emoji: '❤️', texto: 'Experiencia que emociona y se recuerda.' },
];

export function BeneficiosSlide({
  beneficios = BENEFICIOS,
  imagenLateralUrl,
}: {
  beneficios?: { emoji: string; texto: string }[];
  imagenLateralUrl?: string;
}) {
  const safeLateralImageUrl = imagenLateralUrl && /^https?:\/\//i.test(imagenLateralUrl) ? imagenLateralUrl : null;
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
          <p className="text-emerald-400 font-bold uppercase tracking-widest text-sm mb-2">La diferencia AK</p>
          <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">
            ¿Por qué elegirnos?
          </h1>
          <p className="text-white/60 text-lg mt-2 max-w-2xl mx-auto">
            Somos tu solución integral. Un solo equipo se encarga de todo para que vos solo tengas que disfrutar.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {beneficios.map((b, i) => (
            <motion.div
              key={`${b.texto}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 border border-indigo-500/30 rounded-2xl p-5"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">
                  {b.emoji || '✨'}
                </div>
                <div>
                  <p className="text-white/80 text-sm leading-relaxed">{b.texto}</p>
                </div>
              </div>
            </motion.div>
          ))}
          </div>
          <div>
            {safeLateralImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={safeLateralImageUrl} alt="Imagen beneficios" className="w-full aspect-[4/3] object-cover rounded-2xl shadow-2xl" />
            ) : (
              <ImagePlaceholder id="beneficios-lateral" label="Imagen lateral beneficios" aspectRatio="4/3" />
            )}
          </div>
        </div>

        {/* Bottom CTA line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-6 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 border border-white/10">
            <Check className="h-5 w-5 text-emerald-400" />
            <span className="text-white/80 font-semibold">Servicio integral · Sin estrés · Resultado garantizado</span>
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}

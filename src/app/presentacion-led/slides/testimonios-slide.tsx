'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SlideLayout } from '../components/slide-layout';
import { getContenidoPorTipo } from '../lib/contenido-por-tipo';
import { sharedTestimonials } from '@/data/event-catalogs/shared';
import { getTestimonials } from '@/app/actions/feedback';
import { testimoniosParaMostrar } from '@/lib/testimonios/para-mostrar';

const SOURCE_ICON: Record<string, string> = {
  instagram: '📸',
  whatsapp: '💬',
  google: '⭐',
  text: '💭',
};

interface TestimoniosSlideProps {
  tipoFiesta: string;
}

export function TestimoniosSlide({ tipoFiesta }: TestimoniosSlideProps) {
  const contenido = getContenidoPorTipo(tipoFiesta);

  // Los testimonios reales que el dueño aprobó. `getTestimonials` devuelve nada
  // más que los aprobados, y `testimoniosParaMostrar` lo vuelve a controlar: una
  // opinión mala no se proyecta nunca en la pantalla que ve el cliente. Mientras
  // no haya ninguno aprobado se muestran los de ejemplo, para no dejar la pantalla
  // vacía en medio de una venta.
  const [testimonios, setTestimonios] = useState(() =>
    testimoniosParaMostrar([], sharedTestimonials),
  );

  useEffect(() => {
    let vigente = true;
    getTestimonials()
      .then((aprobados) => {
        if (vigente) setTestimonios(testimoniosParaMostrar(aprobados, sharedTestimonials));
      })
      .catch(() => {
        // Si no se pueden leer, quedan los de ejemplo: la presentación no se corta.
      });
    return () => {
      vigente = false;
    };
  }, []);

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
          <p
            className={`text-transparent bg-clip-text bg-gradient-to-r ${contenido.colorAcento} font-bold uppercase tracking-widest text-sm mb-2`}
          >
            Clientes que confían en nosotros
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">
            Lo que dicen 💬
          </h1>
          <p className="text-white/60 text-lg mt-2 max-w-2xl mx-auto">
            Más de 500 familias eligieron AK Producciones para sus momentos más especiales.
          </p>
        </motion.div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonios.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{t.authorName}</span>
                <span className="text-xl">{SOURCE_ICON[t.source] ?? '💬'}</span>
              </div>
              <p className="text-white/70 text-sm leading-relaxed italic flex-1">
                &ldquo;{t.text}&rdquo;
              </p>
              {t.date && (
                <span className="text-white/30 text-xs">{t.date}</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </SlideLayout>
  );
}

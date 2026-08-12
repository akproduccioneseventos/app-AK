'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SlideLayout } from '../components/slide-layout';
import { getContenidoPorTipo } from '../lib/contenido-por-tipo';
import { sharedTestimonials } from '@/data/event-catalogs/shared';
import { getTestimonials } from '@/app/actions/feedback';
import type { Testimonial } from '@/types/feedback';

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
  const [testimoniosReales, setTestimoniosReales] = useState<Testimonial[]>([]);

  useEffect(() => {
    async function cargarTestimonios() {
      try {
        // REGLA ESTRICTA: Solo usamos getTestimonials() porque filtra los que están aprobados (isApproved = true).
        // NUNCA usar getAllTestimonials() ni leer el archivo directo, porque se filtrarían opiniones que el dueño no aprobó.
        const reales = await getTestimonials();
        setTestimoniosReales(reales);
      } catch (e) {
        console.error('Error al cargar testimonios', e);
      }
    }
    cargarTestimonios();
  }, []);

  // Si hay reales aprobados, mostramos esos (limitados a 3 para la grilla).
  // Si no hay, mostramos la lista ficticia compartida de ejemplo para no dejar vacío.
  const testimoniosAMostrar = testimoniosReales.length > 0 
    ? testimoniosReales.slice(0, 3) 
    : sharedTestimonials;

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
          {testimoniosAMostrar.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{t.authorName || t.clientName}</span>
                <span className="text-xl">{SOURCE_ICON[t.source || 'google'] ?? '💬'}</span>
              </div>
              <p className="text-white/70 text-sm leading-relaxed italic flex-1">
                &ldquo;{t.text || t.feedbackText}&rdquo;
              </p>
              {(t.date || t.createdAt) && (
                <span className="text-white/30 text-xs">{t.date || (t.createdAt ? new Date(t.createdAt).toLocaleDateString('es-UY') : '')}</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </SlideLayout>
  );
}

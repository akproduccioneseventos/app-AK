'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  eventType: string;
  rating: number;
  text: string;
  avatarInitials: string;
  avatarColor: string;
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    name: 'Valentina & Rodrigo',
    role: 'Novios',
    eventType: 'Boda',
    rating: 5,
    text: 'Nunca imaginamos que nuestra boda pudiera ser tan perfecta. El equipo de AK Producciones se encargó de absolutamente todo, desde la decoración hasta el último detalle del catering. ¡Nuestros invitados todavía hablan de lo bien que estuvo!',
    avatarInitials: 'V&R',
    avatarColor: 'bg-pink-500',
  },
  {
    id: 't2',
    name: 'Florencia Méndez',
    role: 'Quinceañera',
    eventType: 'XV Años',
    rating: 5,
    text: 'Fue la fiesta más hermosa que pude imaginar. Todo el equipo estuvo presente desde el primer ensayo del vals hasta el último baile. Mi mamá y yo quedamos enamoradas del resultado. ¡100% recomendados!',
    avatarInitials: 'FM',
    avatarColor: 'bg-fuchsia-500',
  },
  {
    id: 't3',
    name: 'Carlos Suárez',
    role: 'Organizador',
    eventType: 'Evento Corporativo',
    rating: 5,
    text: 'Contratamos a AK Producciones para nuestra gala anual de empresa con 250 personas. La logística fue impecable, el ambiente espectacular y los empleados siempre atentos. Definitivamente los volveremos a contratar.',
    avatarInitials: 'CS',
    avatarColor: 'bg-purple-500',
  },
  {
    id: 't4',
    name: 'María José Álvarez',
    role: 'Mamá de los festejados',
    eventType: 'Cumpleaños',
    rating: 5,
    text: 'Organicé el cumpleaños de 50 de mi esposo con AK y fue todo lo que soñé. La atención personalizada, la creatividad y los precios son incomparables. ¡Gracias por hacer ese día tan especial!',
    avatarInitials: 'MJ',
    avatarColor: 'bg-violet-500',
  },
];

interface TestimonialsSectionProps {
  testimonials?: Testimonial[];
}

export function TestimonialsSection({ testimonials = DEFAULT_TESTIMONIALS }: TestimonialsSectionProps) {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const total = testimonials.length;

  const go = useCallback(
    (dir: 1 | -1) => {
      if (isAnimating) return;
      setIsAnimating(true);
      setCurrent((c) => (c + dir + total) % total);
      setTimeout(() => setIsAnimating(false), 400);
    },
    [isAnimating, total]
  );

  // Auto-advance
  useEffect(() => {
    const id = setInterval(() => go(1), 6000);
    return () => clearInterval(id);
  }, [go]);

  const t = testimonials[current];

  return (
    <section id="testimonios" className="py-24 bg-gradient-to-b from-purple-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-primary mb-4">Lo que dicen nuestros clientes</p>
          <h2 className="font-headline text-5xl sm:text-6xl font-black text-slate-800 leading-tight">
            Testimonios
          </h2>
        </div>

        {/* Main testimonial card */}
        <div className="max-w-3xl mx-auto">
          <div
            className={cn(
              'relative bg-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-purple-100',
              'transition-all duration-400',
              isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
            )}
          >
            {/* Quote icon */}
            <Quote className="absolute top-6 right-6 w-12 h-12 text-purple-100 fill-purple-100" />

            {/* Stars */}
            <div className="flex gap-1 mb-6">
              {[...Array(t.rating)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
              ))}
            </div>

            {/* Text */}
            <p className="text-slate-700 text-lg sm:text-xl leading-relaxed mb-8 font-medium italic">
              &ldquo;{t.text}&rdquo;
            </p>

            {/* Author */}
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm',
                  t.avatarColor
                )}
              >
                {t.avatarInitials}
              </div>
              <div>
                <p className="font-black text-slate-800">{t.name}</p>
                <p className="text-sm text-slate-500">
                  {t.role} · {t.eventType}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => go(-1)}
              className="w-10 h-10 rounded-full border border-purple-200 flex items-center justify-center text-slate-500 hover:bg-purple-50 hover:border-purple-300 transition-colors"
              aria-label="Testimonio anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { if (!isAnimating) { setIsAnimating(true); setCurrent(i); setTimeout(() => setIsAnimating(false), 400); } }}
                  className={cn(
                    'rounded-full transition-all duration-300',
                    i === current
                      ? 'w-6 h-3 bg-primary'
                      : 'w-3 h-3 bg-purple-200 hover:bg-purple-300'
                  )}
                  aria-label={`Ir al testimonio ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => go(1)}
              className="w-10 h-10 rounded-full border border-purple-200 flex items-center justify-center text-slate-500 hover:bg-purple-50 hover:border-purple-300 transition-colors"
              aria-label="Siguiente testimonio"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

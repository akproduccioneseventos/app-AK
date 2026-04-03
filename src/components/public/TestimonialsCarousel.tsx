'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Instagram, MessageSquare, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Testimonial } from '@/types/public-landing';

interface TestimonialsCarouselProps {
  testimonials: Testimonial[];
  className?: string;
}

const sourceConfig: Record<
  Testimonial['source'],
  { label: string; Icon: React.ElementType; colorClass: string }
> = {
  instagram: {
    label: 'Instagram',
    Icon: Instagram,
    colorClass: 'text-pink-500',
  },
  whatsapp: {
    label: 'WhatsApp',
    Icon: MessageSquare,
    colorClass: 'text-green-500',
  },
  google: {
    label: 'Google',
    Icon: Star,
    colorClass: 'text-amber-500',
  },
  text: {
    label: 'Reseña',
    Icon: Star,
    colorClass: 'text-purple-500',
  },
};

export function TestimonialsCarousel({ testimonials, className }: TestimonialsCarouselProps) {
  const [current, setCurrent] = useState(0);

  if (!testimonials.length) return null;

  const prev = () => setCurrent((c) => (c === 0 ? testimonials.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === testimonials.length - 1 ? 0 : c + 1));

  const testimonial = testimonials[current];
  const config = sourceConfig[testimonial.source] ?? sourceConfig.text;
  const { Icon } = config;

  return (
    <section className={cn('py-20 px-4 bg-gradient-to-br from-purple-50 to-pink-50', className)}>
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-black uppercase tracking-[0.3em] text-purple-500 mb-3">
            Testimonios
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            Lo que dicen nuestros clientes
          </h2>
          <p className="mt-3 text-slate-500">
            Cada celebración es única, pero la satisfacción siempre es la misma.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative flex flex-col items-center gap-6">
          {/* Screenshot preview placeholder */}
          {testimonial.screenshotUrl && (
            <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-xl border border-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={testimonial.screenshotUrl}
                alt={`Captura de testimonio de ${testimonial.authorName}`}
                className="w-full object-cover"
              />
            </div>
          )}

          {/* Quote card */}
          <div className="w-full max-w-2xl bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center relative">
            {/* Source badge */}
            <div className={cn('absolute top-4 right-4 flex items-center gap-1', config.colorClass)}>
              <Icon className="w-4 h-4" />
              <span className="text-xs font-bold">{config.label}</span>
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>

            {/* Quote text */}
            <blockquote className="text-lg sm:text-xl text-slate-700 font-medium leading-relaxed italic">
              &ldquo;{testimonial.text}&rdquo;
            </blockquote>

            {/* Author */}
            <div className="mt-6">
              <p className="font-black text-slate-900">{testimonial.authorName}</p>
              {testimonial.date && (
                <p className="text-sm text-slate-400 mt-1">{testimonial.date}</p>
              )}
            </div>
          </div>

          {/* Navigation */}
          {testimonials.length > 1 && (
            <div className="flex items-center gap-4">
              <button
                onClick={prev}
                aria-label="Anterior testimonio"
                className="w-10 h-10 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center hover:bg-purple-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>

              {/* Dots */}
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    aria-label={`Testimonio ${i + 1}`}
                    className={cn(
                      'w-2.5 h-2.5 rounded-full transition-all duration-200',
                      i === current ? 'bg-purple-500 scale-125' : 'bg-slate-300 hover:bg-slate-400'
                    )}
                  />
                ))}
              </div>

              <button
                onClick={next}
                aria-label="Siguiente testimonio"
                className="w-10 h-10 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center hover:bg-purple-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

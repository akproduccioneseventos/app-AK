'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Star, Quote, Sparkles, MessageSquare, X, HeartHandshake } from 'lucide-react';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  eventType: string;
  rating?: number;
  text: string;
  avatarInitials: string;
  avatarColor: string;
}

interface TestimonialsSectionProps {
  testimonials?: Testimonial[];
  whatsappNumber?: string;
}

interface SuccessStory {
  id: string;
  title: string;
  text: string;
  clientName: string;
  role: string;
  eventType: string;
  whatsappMessage: string;
  rating?: number;
}

export function testimonialToStory(testimonial: Testimonial): SuccessStory {
  const eventType = testimonial.eventType || 'Evento AK';
  return {
    id: `testimonial-${testimonial.id}`,
    title: `La experiencia de ${testimonial.name}`,
    text: testimonial.text,
    clientName: testimonial.name,
    role: testimonial.role || 'Cliente AK',
    eventType,
    whatsappMessage: `Hola AK Producciones, vi el testimonio de ${testimonial.name} y quiero consultar una propuesta para mi evento.`,
    rating: testimonial.rating ?? 5,
  };
}

export function TestimonialsSection({ testimonials = [], whatsappNumber = AK_WHATSAPP_NUMBER }: TestimonialsSectionProps) {
  const [selectedStory, setSelectedStory] = useState<SuccessStory | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const stories = testimonials.map(testimonialToStory);

  const openStory = (story: SuccessStory) => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelectedStory(story);
  };

  useEffect(() => {
    if (!selectedStory) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusFrame = requestAnimationFrame(() => closeButtonRef.current?.focus());
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedStory(null);
        return;
      }
      if (e.key !== 'Tab') return;
      const dialog = closeButtonRef.current?.closest('[role="dialog"]');
      if (!(dialog instanceof HTMLElement)) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      requestAnimationFrame(() => previousFocusRef.current?.focus());
    };
  }, [selectedStory]);

  if (stories.length === 0) return null;

  return (
    <section id="landing-testimonials" className="relative overflow-hidden border-t border-slate-200 bg-white py-24 text-slate-950">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header de Venta */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-black uppercase tracking-widest text-red-400 mb-4">
            <HeartHandshake className="w-3.5 h-3.5" />
            Reseñas de clientes
          </span>
          <h2 className="mb-4 font-headline text-5xl font-black leading-tight text-slate-950 sm:text-6xl">
            Experiencias compartidas
          </h2>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-slate-600">
            Opiniones compartidas por clientes sobre su experiencia con AK Producciones.
          </p>
        </motion.div>

        {/* Grilla de Casos de Éxito */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stories.map((story, index) => (
            <motion.button
              type="button"
              key={story.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, delay: Math.min(index * 0.06, 0.24), ease: 'easeOut' }}
              whileHover={{ y: -6, scale: 1.01 }}
              onClick={() => openStory(story)}
              aria-label={`Ver reseña de ${story.clientName}`}
              className="group relative flex w-full cursor-pointer flex-col justify-between overflow-hidden rounded-lg border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-red-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Quote className="h-8 w-8 fill-red-100 text-red-100" />
                  <span className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-red-700">
                    {story.eventType}
                  </span>
                </div>
                
                <div className="flex gap-0.5">
                  {Array.from({ length: Math.max(1, Math.min(story.rating ?? 5, 5)) }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                
                <h3 className="font-headline text-lg font-black text-slate-950 transition-colors group-hover:text-red-700">
                  {story.title}
                </h3>
                <p className="line-clamp-5 text-xs font-semibold italic leading-relaxed text-slate-600">
                  &ldquo;{story.text}&rdquo;
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between gap-2 border-t border-slate-200 pt-4">
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-slate-950">{story.clientName}</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{story.role}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Opinión publicada
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Modal Popup Detallado (Inmersivo) */}
      <AnimatePresence>
        {selectedStory && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStory(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />
            
            {/* Contenido Modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-story-title"
              className="relative max-w-lg w-full bg-slate-950 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl flex flex-col z-20 text-left overflow-y-auto max-h-[90vh]"
            >
              {/* Botón de cierre */}
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setSelectedStory(null)}
                className="absolute top-6 right-6 z-30 w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
                aria-label="Cerrar historia"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-6 space-y-2 pr-8">
                <span className="px-2.5 py-1 rounded-lg bg-red-950/40 border border-red-500/25 text-[9px] font-black uppercase tracking-widest text-red-400">
                  {selectedStory.eventType}
                </span>
                <h3 id="modal-story-title" className="font-headline font-black text-2xl sm:text-3xl text-white pt-2">
                  {selectedStory.title}
                </h3>
              </div>

              {/* Info y Detalle */}
              <div className="space-y-6">
                {/* Cita de valor */}
                <div className="relative bg-white/[0.01] border border-white/5 rounded-3xl p-5 italic text-slate-300 text-sm leading-relaxed">
                  <Quote className="absolute -top-3 left-4 w-7 h-7 text-red-500/20 fill-red-500/20" />
                  &ldquo;{selectedStory.text}&rdquo;
                  <div className="mt-4 flex items-center gap-2 not-italic">
                    <span className="w-6 h-0.5 bg-red-600" />
                    <p className="text-xs font-black text-white">{selectedStory.clientName} ({selectedStory.role})</p>
                  </div>
                </div>

                {/* Call to Action */}
                <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-red-400 animate-pulse" />
                    <p className="text-xs font-bold text-slate-400">¿Querés una propuesta similar?</p>
                  </div>
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(selectedStory.whatsappMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-red-700 hover:bg-red-600 text-white text-xs font-black uppercase tracking-widest px-6 py-4 shadow-lg shadow-red-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 w-full sm:w-auto justify-center"
                  >
                    <MessageSquare className="w-4 h-4 text-red-300" />
                    Quiero esta propuesta
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}


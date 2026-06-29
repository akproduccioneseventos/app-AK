'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, Sparkles, MessageSquare, X, ShieldCheck, HeartHandshake } from 'lucide-react';
import Image from 'next/image';

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
}

interface SuccessStory {
  id: string;
  title: string;
  text: string;
  clientName: string;
  role: string;
  eventType: string;
  logro: string;
  image: string;
  servicios: string[];
  whatsappMessage: string;
}

const SUCCESS_STORIES: SuccessStory[] = [
  {
    id: 'story-1',
    title: 'Los 15 Años de Valentina',
    text: 'Ver a mi hija entrar y ver todo tal cual lo soñó fue hermoso. La discoteca y la pista de luces LED interactiva fueron el centro de la diversión. Nos liberamos de coordinar con diez proveedores distintos. ¡AK se encargó de todo!',
    clientName: 'María José',
    role: 'Mamá de Valentina',
    eventType: 'Fiesta de 15 Años',
    logro: 'Pista llena toda la noche y organización impecable',
    image: '/media/catalogo-servicios/quinceanera_persuasiva.png',
    servicios: ['Salón Club Uruguay', 'Gastronomía Integral', 'Pista LED Interactiva', 'Decoración Temática'],
    whatsappMessage: 'Hola AK Producciones, vi el caso de éxito de los 15 de Valentina y me gustaría cotizar un cumpleaños similar.',
  },
  {
    id: 'story-2',
    title: 'La Boda de Belén & Sebastián',
    text: 'Buscábamos un servicio premium que nos diera paz mental. El menú gourmet fue elogiado por todos los invitados y el montaje clásico en el Club Uruguay superó nuestras expectativas. Excelente coordinación durante la ceremonia y el baile.',
    clientName: 'Belén & Sebastián',
    role: 'Novios',
    eventType: 'Boda Premium',
    logro: 'Gastronomía de gala y ambientación señorial de ensueño',
    image: '/media/catalogo-servicios/boda_persuasiva.png',
    servicios: ['Catering Gourmet', 'Discoteca Profesional', 'Diseño Floral y Livings', 'Coordinación In Situ'],
    whatsappMessage: 'Hola AK Producciones, vi la boda de Belén y Sebastián y me interesa recibir información para mi casamiento.',
  },
  {
    id: 'story-3',
    title: 'Fiesta Social Egresados',
    text: 'La barra de tragos moderna y la tecnología del muro social interactivo en pantalla gigante marcaron la diferencia. Los chicos compartían las fotos en vivo desde sus celulares al instante. Todo el staff estuvo en cada detalle.',
    clientName: 'Rodrigo',
    role: 'Comisión de Egresados',
    eventType: 'Evento Social',
    logro: 'Tecnología interactiva y barras móviles de vanguardia',
    image: '/media/catalogo-servicios/social_persuasivo.png',
    servicios: ['Barra Libre de Tragos', 'Muro Social QR', 'Pantalla Gigante LED', 'Efectos Especiales'],
    whatsappMessage: 'Hola AK Producciones, me interesa la tecnología interactiva y barra de tragos para una fiesta de egresados/social.',
  },
];

export function TestimonialsSection({ testimonials = [] }: TestimonialsSectionProps) {
  const [selectedStory, setSelectedStory] = useState<SuccessStory | null>(null);

  return (
    <section id="testimonios" className="py-24 bg-zinc-950 text-white relative overflow-hidden border-t border-white/5">
      {/* Glow de fondo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header de Venta */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-black uppercase tracking-widest text-indigo-400 mb-4">
            <HeartHandshake className="w-3.5 h-3.5" />
            Casos de Éxito Reales
          </span>
          <h2 className="font-headline text-5xl sm:text-6xl font-black text-white leading-tight mb-4">
            Historias de Felicidad
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
            Descubrí cómo organizamos eventos espectaculares y sin estrés en Salto, contados por sus propios protagonistas.
          </p>
        </div>

        {/* Grilla de Casos de Éxito */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SUCCESS_STORIES.map((story) => (
            <motion.div
              key={story.id}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.3 }}
              onClick={() => setSelectedStory(story)}
              className="flex flex-col justify-between rounded-3xl bg-white/[0.02] border border-white/10 overflow-hidden cursor-pointer shadow-xl hover:shadow-[0_10px_35px_rgba(99,102,241,0.15)] group transition-all"
            >
              {/* Portada */}
              <div className="relative aspect-[16/10] overflow-hidden bg-zinc-900 border-b border-white/5">
                <Image
                  src={story.image}
                  alt={story.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />

                {/* Badge de tipo de fiesta */}
                <span className="absolute bottom-4 left-4 z-10 px-3 py-1 rounded-lg bg-indigo-650/80 backdrop-blur-sm border border-indigo-400/20 text-[9px] font-black uppercase tracking-widest text-white">
                  {story.eventType}
                </span>
              </div>

              {/* Contenido Card */}
              <div className="p-6 flex-1 flex flex-col justify-between gap-6 text-left">
                <div className="space-y-3">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <h3 className="font-headline font-black text-xl text-white group-hover:text-indigo-400 transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-zinc-400 text-xs font-semibold leading-relaxed line-clamp-3 italic">
                    &ldquo;{story.text}&rdquo;
                  </p>
                </div>

                {/* Cliente / Logro */}
                <div className="border-t border-white/5 pt-4 mt-auto flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-black text-xs text-white truncate">{story.clientName}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">{story.role}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Logrado
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
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
              className="relative max-w-2xl w-full bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col z-20"
            >
              {/* Botón de cierre */}
              <button
                onClick={() => setSelectedStory(null)}
                className="absolute top-4 right-4 z-30 w-10 h-10 rounded-xl bg-black/45 border border-white/10 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
                aria-label="Cerrar historia"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Imagen Portada */}
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={selectedStory.image}
                  alt={selectedStory.title}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="px-3 py-1 rounded-lg bg-indigo-650 text-[10px] font-black uppercase tracking-widest text-white border border-indigo-400/20">
                    {selectedStory.eventType}
                  </span>
                  <h3 className="font-headline font-black text-2xl sm:text-3xl text-white mt-3">
                    {selectedStory.title}
                  </h3>
                </div>
              </div>

              {/* Info y Detalle */}
              <div className="p-6 sm:p-8 space-y-6 text-left">
                {/* Cita de valor */}
                <div className="relative bg-white/[0.02] border border-white/5 rounded-3xl p-5 italic text-slate-300 text-sm sm:text-base leading-relaxed">
                  <Quote className="absolute -top-3 left-4 w-7 h-7 text-indigo-500/20 fill-indigo-500/20" />
                  &ldquo;{selectedStory.text}&rdquo;
                  <div className="mt-4 flex items-center gap-2 not-italic">
                    <span className="w-6 h-0.5 bg-indigo-500" />
                    <p className="text-xs font-black text-white">{selectedStory.clientName} ({selectedStory.role})</p>
                  </div>
                </div>

                {/* Logro y Servicios */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400">Logro emocional</h4>
                    <p className="text-xs font-semibold text-slate-300 leading-relaxed">
                      {selectedStory.logro}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400">Servicios Incluidos</h4>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedStory.servicios.map((s, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-[9px] font-bold text-slate-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Call to Action */}
                <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                    <p className="text-xs font-bold text-slate-400">¿Querés que organicemos tu fiesta igual?</p>
                  </div>
                  <a
                    href={`https://wa.me/59898355530?text=${encodeURIComponent(selectedStory.whatsappMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-black uppercase tracking-widest px-6 py-4 shadow-lg shadow-indigo-900/30 transition-all hover:scale-[1.02] active:scale-98 shrink-0 w-full sm:w-auto justify-center"
                  >
                    <MessageSquare className="w-4 h-4 text-indigo-300" />
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

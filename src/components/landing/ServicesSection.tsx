'use client';

import Image from 'next/image';
import { MessageSquare, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface ServiceItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  imageUrl: string;
  imageHint: string;
  accentColor: string;
  emoji: string;
  whatsappMessage?: string;
}

const PARTY_TYPES = [
  { title: 'Bodas', emoji: '💍', desc: 'Producción integral de ceremonias y fiestas.' },
  { title: '15 Años', emoji: '👑', desc: 'Pistas LED, cabinas interactivas y temáticas exclusivas.' },
  { title: 'Cumpleaños & Sociales', emoji: '🎉', desc: 'Aniversarios y festejos familiares únicos.' },
  { title: 'Corporativos', emoji: '🏢', desc: 'Lanzamientos, cenas empresariales y conferencias.' },
];

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 'bodas',
    title: 'Bodas',
    subtitle: 'El día más especial',
    description: 'Tranquilidad total en el día más importante, con un diseño floral y gastronómico coordinado.',
    features: ['Gastronomía premium', 'Decoración y flores exclusivas', 'Coordinación integral del día'],
    imageUrl: '/media/catalogo-servicios/boda_persuasiva.png',
    imageHint: 'wedding ceremony',
    accentColor: 'bg-indigo-500',
    emoji: '💍',
    whatsappMessage: '¡Hola AK Producciones! Me gustaría cotizar el paquete de Boda.',
  },
  {
    id: 'xv-anos',
    title: 'XV Años',
    subtitle: 'Una noche de ensueño',
    description: 'Hacemos realidad la fiesta que soñaste con shows de luces interactivos y la tecnología que divierte a tus amigos.',
    features: ['Pistas LED interactivas', 'Cabinas y recuerdos en vivo', 'Ambientación temática a medida'],
    imageUrl: '/media/catalogo-servicios/quinceanera_persuasiva.png',
    imageHint: 'quinceañera party',
    accentColor: 'bg-fuchsia-500',
    emoji: '👑',
    whatsappMessage: '¡Hola AK Producciones! Me gustaría cotizar el paquete de XV Años.',
  },
  {
    id: 'cumpleanos',
    title: 'Cumpleaños & Sociales',
    subtitle: 'Celebraciones sin límites',
    description: 'El festejo familiar perfecto con la mejor discoteca, barra de tragos y ambientación a tu medida.',
    features: ['Discoteca y luces pro', 'Animación y barras exclusivas', 'Organización de tiempos y sorpresas'],
    imageUrl: '/media/catalogo-servicios/social_persuasivo.png',
    imageHint: 'birthday party lights',
    accentColor: 'bg-indigo-500',
    emoji: '🎉',
    whatsappMessage: '¡Hola AK Producciones! Me gustaría cotizar un cumpleaños.',
  },
  {
    id: 'corporativos',
    title: 'Eventos Corporativos',
    subtitle: 'Imagen corporativa premium',
    description: 'La imagen de tu empresa con logística de vanguardia, sonido profesional y pantallas de alta definición.',
    features: ['Pantallas LED gigantes', 'Sonido y microfonía de fidelidad', 'Recepción y livings premium'],
    imageUrl: '/media/catalogo-servicios/corporativo_persuasivo.png',
    imageHint: 'corporate event',
    accentColor: 'bg-slate-800',
    emoji: '🏢',
    whatsappMessage: '¡Hola AK Producciones! Me gustaría cotizar un evento corporativo.',
  },
];

interface ServicesSectionProps {
  whatsappNumber?: string;
  services?: ServiceItem[];
}

export function ServicesSection({ whatsappNumber = '59898355530', services }: ServicesSectionProps) {
  const displayServices = services && services.length > 0 ? services : DEFAULT_SERVICES;

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  return (
    <section id="servicios" className="py-24 bg-zinc-950 text-white border-y border-white/5 relative overflow-hidden">
      {/* Glow de fondo */}
      <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="text-center mb-20">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-black uppercase tracking-widest text-indigo-400 mb-4">
            🔥 Todo en un solo lugar
          </span>
          <h2 className="font-headline text-5xl sm:text-6xl font-black text-white leading-tight mb-5">
            Solución Integral para tu Fiesta
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
            Coordinamos y ejecutamos cada detalle: comida, decoración, luces y fotos bajo un mismo equipo para que disfrutes sin estrés.
          </p>
        </div>

        {/* ── SECTION: TIPOS DE FIESTA ──────────────────────── */}
        <div className="mb-24">
          <div className="mb-8">
            <h3 className="text-2xl font-black text-white flex items-center gap-2 font-headline">
              <Calendar className="w-6 h-6 text-indigo-400" /> Celebraciones que Producimos
            </h3>
            <p className="text-zinc-400 text-sm mt-1">Hacemos realidad el evento de tus sueños según tu estilo.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PARTY_TYPES.map((party) => (
              <div
                key={party.title}
                className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-1"
              >
                <span className="text-4xl block mb-4">{party.emoji}</span>
                <h4 className="text-lg font-black text-white font-headline">{party.title}</h4>
                <p className="text-xs font-semibold text-zinc-400 mt-2 leading-relaxed">{party.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION: SERVICIOS DETALLADOS ───────────────────── */}
        <div>
          <div className="mb-10">
            <h3 className="text-2xl font-black text-white font-headline">
              ¿Qué incluye la producción integral?
            </h3>
            <p className="text-zinc-400 text-sm mt-1">
              Todo resuelto bajo un estricto control de calidad, sin lidiar con diez proveedores diferentes.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            {displayServices.map((service) => {
              const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                `👋 ¡Hola AK Producciones! Me gustaría consultar por el servicio de ${service.title} para mi evento.`
              )}`;
              return (
                <motion.div
                  key={service.id}
                  variants={cardVariants}
                  className="group flex flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.01] shadow-xl hover:shadow-[0_10px_35px_rgba(99,102,241,0.15)] transition-all duration-300 overflow-hidden"
                >
                  <div>
                    {/* Image Area */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900 border-b border-white/5">
                      <Image
                        src={service.imageUrl}
                        alt={service.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 768px) 100vw, 30vw"
                      />
                      <div className="absolute top-4 left-4 w-11 h-11 rounded-2xl bg-zinc-950/80 backdrop-blur-sm border border-white/10 flex items-center justify-center text-xl shadow-md">
                        {service.emoji}
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-6 space-y-4 text-left">
                      <h4 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors font-headline">
                        {service.title}
                      </h4>
                      <p className="text-sm text-zinc-400 leading-relaxed font-semibold">
                        {service.description}
                      </p>

                      {/* Features mini list */}
                      <ul className="space-y-2 pt-2">
                        {service.features.map((feat) => (
                          <li key={feat} className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="p-6 pt-0 mt-auto border-t border-white/5">
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'flex items-center justify-center gap-2 w-full mt-4 px-4 py-3.5 rounded-2xl',
                        'bg-white/5 hover:bg-indigo-650 hover:text-white text-zinc-300 font-black text-xs uppercase tracking-wider',
                        'border border-white/10 hover:border-indigo-500/35 transition-all duration-200 shadow-md active:scale-98'
                      )}
                    >
                      <MessageSquare className="w-4 h-4 shrink-0 text-indigo-400 group-hover:text-white transition-colors" />
                      Consultar Servicio
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

      </div>
    </section>
  );
}

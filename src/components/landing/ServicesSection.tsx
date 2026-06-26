'use client';

import Image from 'next/image';
import { MessageSquare, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface ServiceDetail {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  emoji: string;
  features: string[];
}

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
    description: 'Convertimos tu boda en una experiencia única. Desde la decoración floral hasta la pista de baile, coordinamos cada detalle.',
    features: ['Coordinación integral del evento', 'Decoración y flores personalizadas', 'Catering y menú a medida'],
    imageUrl: '/media/catalogo-servicios/boda-decoracion-dorada-01.jpeg',
    imageHint: 'wedding ceremony',
    accentColor: 'bg-indigo-500',
    emoji: '💍',
    whatsappMessage: '¡Hola AK Producciones! Me gustaría cotizar el paquete de Boda.',
  },
  {
    id: 'xv-anos',
    title: 'XV Años',
    subtitle: 'Una noche de ensueño',
    description: 'Los 15 años merecen la mejor producción. Creamos ambientes mágicos, luces impactantes y momentos que durarán siempre.',
    features: ['Temática y ambientación exclusiva', 'Pista LED y efectos especiales', 'Fotografía y video premium'],
    imageUrl: '/media/catalogo-servicios/decoracion-xv-lila-01.jpeg',
    imageHint: 'quinceañera party',
    accentColor: 'bg-fuchsia-500',
    emoji: '👑',
    whatsappMessage: '¡Hola AK Producciones! Me gustaría cotizar el paquete de XV Años.',
  },
  {
    id: 'cumpleanos',
    title: 'Cumpleaños & Sociales',
    subtitle: 'Celebraciones sin límites',
    description: 'Festejos de cumpleaños, aniversarios y reuniones sociales adaptadas a tu medida con la mejor música y diversión.',
    features: ['Discoteca y luces inteligentes', 'Mesa dulce y torta decorada', 'Animación y barras de tragos'],
    imageUrl: '/media/catalogo-servicios/xv-pista-iluminada-01.jpeg',
    imageHint: 'birthday party lights',
    accentColor: 'bg-indigo-500',
    emoji: '🎉',
    whatsappMessage: '¡Hola AK Producciones! Me gustaría cotizar un cumpleaños.',
  },
  {
    id: 'corporativos',
    title: 'Eventos Corporativos',
    subtitle: 'Imagen corporativa premium',
    description: 'Lanzamientos de marcas, cenas empresariales, conferencias y eventos institucionales con todo resuelto.',
    features: ['Planificación y logística completa', 'Pantallas LED y microfonía', 'Catering y livings premium'],
    imageUrl: '/media/catalogo-servicios/recepcion-display-evento-01.jpeg',
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
    <section id="servicios" className="py-24 bg-gradient-to-b from-white to-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-20">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-purple-50 border border-purple-100 text-xs font-black uppercase tracking-widest text-purple-700 mb-4">
            🔥 Todo en un solo lugar
          </span>
          <h2 className="font-headline text-5xl sm:text-6xl font-black text-slate-900 leading-tight mb-5">
            Nuestros Servicios & Fiestas
          </h2>
          <p className="text-slate-550 text-lg max-w-xl mx-auto leading-relaxed">
            Coordinamos y ejecutamos cada elemento para que tu fiesta sea espectacular, transparente y sin sorpresas de costos.
          </p>
        </div>

        {/* ── SECTION: TIPOS DE FIESTA ──────────────────────── */}
        <div className="mb-24">
          <div className="mb-8">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-650" /> Tipos de Fiesta que Hacemos
            </h3>
            <p className="text-slate-500 text-sm mt-1">Soluciones diseñadas a medida según el tipo de celebración.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PARTY_TYPES.map((party) => (
              <div
                key={party.title}
                className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <span className="text-4xl block mb-4">{party.emoji}</span>
                <h4 className="text-lg font-black text-slate-800">{party.title}</h4>
                <p className="text-xs font-medium text-slate-500 mt-2 leading-relaxed">{party.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION: SERVICIOS DETALLADOS ───────────────────── */}
        <div>
          <div className="mb-10">
            <h3 className="text-2xl font-black text-slate-900">
              ¿Qué incluye la producción integral?
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              Desde el armado de la pista hasta la mesa dulce, nos encargamos de todo bajo un mismo control.
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
                  className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden"
                >
                  <div>
                    {/* Image Area */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 border-b border-slate-100">
                      <Image
                        src={service.imageUrl}
                        alt={service.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-103"
                        sizes="(max-width: 768px) 100vw, 30vw"
                      />
                      <div className="absolute top-4 left-4 w-11 h-11 rounded-2xl bg-white/90 backdrop-blur-sm flex items-center justify-center text-xl shadow-md">
                        {service.emoji}
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-6 space-y-4">
                      <h4 className="text-xl font-black text-slate-900 group-hover:text-indigo-650 transition-colors">
                        {service.title}
                      </h4>
                      <p className="text-sm text-slate-550 leading-relaxed font-medium">
                        {service.description}
                      </p>

                      {/* Features mini list */}
                      <ul className="space-y-2 pt-2">
                        {service.features.map((feat) => (
                          <li key={feat} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="p-6 pt-0 mt-auto border-t border-slate-50">
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'flex items-center justify-center gap-2 w-full mt-4 px-4 py-3 rounded-2xl',
                        'bg-slate-50 hover:bg-green-50 hover:text-green-700 text-slate-700 font-black text-xs uppercase tracking-wider',
                        'border border-slate-200 hover:border-green-300 transition-all duration-200'
                      )}
                    >
                      <MessageSquare className="w-4 h-4 shrink-0" />
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

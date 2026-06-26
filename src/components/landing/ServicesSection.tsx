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

const DETAILED_SERVICES: ServiceDetail[] = [
  {
    id: 'discoteca-dj',
    title: 'Discoteca & Luces Inteligentes',
    description: 'Sonido envolvente de alta definición y show de luces robotizadas programadas en vivo por nuestros DJs.',
    imageUrl: '/media/catalogo-servicios/salon-discoteca-ak-01.jpeg',
    emoji: '🎧',
    features: ['Estructura reticulada premium', 'Efectos especiales en pista', 'Sincronización de sonido'],
  },
  {
    id: 'decoracion-ambientacion',
    title: 'Decoración & Ambientación',
    description: 'Centros de mesa, arreglos florales, livings premium y diseños temáticos completos adaptados a tu estilo.',
    imageUrl: '/media/catalogo-servicios/boda-decoracion-dorada-01.jpeg',
    emoji: '✨',
    features: ['Centros de mesa únicos', 'Fondos para fotos e ingresos', 'Mobiliario de living premium'],
  },
  {
    id: 'catering-premium',
    title: 'Catering & Menús a Medida',
    description: 'Gastronomía premium, bocados calientes en recepción, plato principal servido e islas temáticas.',
    imageUrl: '/media/catalogo-servicios/catering-mesa-ak-01.jpeg',
    emoji: '🍽️',
    features: ['Ingredientes frescos de calidad', 'Opciones celiacas/vegetarianas', 'Devolución de comida sobrante'],
  },
  {
    id: 'barra-tragos',
    title: 'Barra de Tragos & Coctelería',
    description: 'Barras móviles iluminadas con tragos clásicos y de autor, jugos naturales y coctelería sin alcohol.',
    imageUrl: '/media/catalogo-servicios/barra-tragos-ak-01.jpeg',
    emoji: '🍹',
    features: ['Barman profesionales', 'Insumos de primera línea', 'Variedad de mocktails'],
  },
  {
    id: 'fotografia-video',
    title: 'Fotografía, Video & Cabinas',
    description: 'Captura profesional de los mejores momentos y cabinas interactivas para que tus invitados se lleven recuerdos.',
    imageUrl: '/media/catalogo-servicios/fotografia_cabina_img_221_p21_x1613.jpeg',
    emoji: '📸',
    features: ['Cobertura previa y en vivo', 'Descarga directa digital', 'Cabina de fotos interactiva'],
  },
  {
    id: 'pantallas-led',
    title: 'Pantallas LED Gigantes',
    description: 'Proyección de retrospectivas, videos emotivos y transmisión del Muro Social en vivo.',
    imageUrl: '/media/catalogo-servicios/xv-pista-iluminada-01.jpeg',
    emoji: '📺',
    features: ['Paneles de alta definición', 'Contenido personalizado', 'Integrado a la cabina de DJ'],
  },
  {
    id: 'glitter-bar',
    title: 'Glitter & Makeup Bar',
    description: 'Puesto interactivo de maquillaje brillante, apliques y luces para encender la diversión en la pista de baile.',
    imageUrl: '/media/catalogo-servicios/glitter-bar-01.jpeg',
    emoji: '✨',
    features: ['Variedad de brillos y gemas', 'Espejos con luces led', 'Staff de animación dedicado'],
  },
  {
    id: 'candy-bar',
    title: 'Candy Bar & Torta Principal',
    description: 'Repostería fina personalizada combinada con la temática y colores de la ambientación del salón.',
    imageUrl: '/media/catalogo-servicios/candy-bar-completo-ak-02.jpeg',
    emoji: '🍰',
    features: ['Torta de boda o XV decorada', 'Mesa de dulces variados', 'Arreglos decorativos dulces'],
  },
];

interface ServicesSectionProps {
  whatsappNumber?: string;
  services?: any; // Ignored as we render detailed list
}

export function ServicesSection({ whatsappNumber = '59898355530' }: ServicesSectionProps) {
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
            {DETAILED_SERVICES.map((service) => {
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

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
  { title: 'Bodas', emoji: 'ðŸ’', desc: 'ProducciÃ³n integral de ceremonias y fiestas.' },
  { title: '15 AÃ±os', emoji: 'ðŸ‘‘', desc: 'Pistas LED, cabinas interactivas y temÃ¡ticas exclusivas.' },
  { title: 'CumpleaÃ±os & Sociales', emoji: 'ðŸŽ‰', desc: 'Aniversarios y festejos familiares Ãºnicos.' },
  { title: 'Corporativos', emoji: 'ðŸ¢', desc: 'Lanzamientos, cenas empresariales y conferencias.' },
];

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 'bodas',
    title: 'Bodas',
    subtitle: 'El dÃ­a mÃ¡s especial',
    description: 'Tranquilidad total en el dÃ­a mÃ¡s importante, con un diseÃ±o floral y gastronÃ³mico coordinado.',
    features: ['GastronomÃ­a premium', 'DecoraciÃ³n y flores exclusivas', 'CoordinaciÃ³n integral del dÃ­a'],
    imageUrl: '/media/catalogo-servicios/boda_persuasiva.png',
    imageHint: 'wedding ceremony',
    accentColor: 'bg-indigo-500',
    emoji: 'ðŸ’',
    whatsappMessage: 'Â¡Hola AK Producciones! Me gustarÃ­a cotizar el paquete de Boda.',
  },
  {
    id: 'xv-anos',
    title: 'XV AÃ±os',
    subtitle: 'Una noche de ensueÃ±o',
    description: 'Hacemos realidad la fiesta que soÃ±aste con shows de luces interactivos y la tecnologÃ­a que divierte a tus amigos.',
    features: ['Pistas LED interactivas', 'Cabinas y recuerdos en vivo', 'AmbientaciÃ³n temÃ¡tica a medida'],
    imageUrl: '/media/catalogo-servicios/quinceanera_persuasiva.png',
    imageHint: 'quinceaÃ±era party',
    accentColor: 'bg-fuchsia-500',
    emoji: 'ðŸ‘‘',
    whatsappMessage: 'Â¡Hola AK Producciones! Me gustarÃ­a cotizar el paquete de XV AÃ±os.',
  },
  {
    id: 'cumpleanos',
    title: 'CumpleaÃ±os & Sociales',
    subtitle: 'Celebraciones sin lÃ­mites',
    description: 'El festejo familiar perfecto con la mejor discoteca, barra de tragos y ambientaciÃ³n a tu medida.',
    features: ['Discoteca y luces pro', 'AnimaciÃ³n y barras exclusivas', 'OrganizaciÃ³n de tiempos y sorpresas'],
    imageUrl: '/media/catalogo-servicios/social_persuasivo.png',
    imageHint: 'birthday party lights',
    accentColor: 'bg-indigo-500',
    emoji: 'ðŸŽ‰',
    whatsappMessage: 'Â¡Hola AK Producciones! Me gustarÃ­a cotizar un cumpleaÃ±os.',
  },
  {
    id: 'corporativos',
    title: 'Eventos Corporativos',
    subtitle: 'Imagen corporativa premium',
    description: 'La imagen de tu empresa con logÃ­stica de vanguardia, sonido profesional y pantallas de alta definiciÃ³n.',
    features: ['Pantallas LED gigantes', 'Sonido y microfonÃ­a de fidelidad', 'RecepciÃ³n y livings premium'],
    imageUrl: '/media/catalogo-servicios/corporativo_persuasivo.png',
    imageHint: 'corporate event',
    accentColor: 'bg-slate-800',
    emoji: 'ðŸ¢',
    whatsappMessage: 'Â¡Hola AK Producciones! Me gustarÃ­a cotizar un evento corporativo.',
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
    <section id="servicios" className="py-24 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white border-y border-white/5 relative overflow-hidden">
      {/* Glow de fondo */}
      <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="text-center mb-20">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-black uppercase tracking-widest text-indigo-400 mb-4">
            ðŸ”¥ Todo en un solo lugar
          </span>
          <h2 className="font-headline text-5xl sm:text-6xl font-black text-white leading-tight mb-5">
            SoluciÃ³n Integral para tu Fiesta
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
            Coordinamos y ejecutamos cada detalle: comida, decoraciÃ³n, luces y fotos bajo un mismo equipo para que disfrutes sin estrÃ©s.
          </p>
        </div>

        {/* â”€â”€ SECTION: TIPOS DE FIESTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="mb-24">
          <div className="mb-8">
            <h3 className="text-2xl font-black text-white flex items-center gap-2 font-headline">
              <Calendar className="w-6 h-6 text-indigo-400" /> Celebraciones que Producimos
            </h3>
            <p className="text-zinc-400 text-sm mt-1">Hacemos realidad el evento de tus sueÃ±os segÃºn tu estilo.</p>
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

        {/* â”€â”€ SECTION: SERVICIOS DETALLADOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div>
          <div className="mb-10">
            <h3 className="text-2xl font-black text-white font-headline">
              Â¿QuÃ© incluye la producciÃ³n integral?
            </h3>
            <p className="text-zinc-300 text-sm mt-1">
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
                `ðŸ‘‹ Â¡Hola AK Producciones! Me gustarÃ­a consultar por el servicio de ${service.title} para mi evento.`
              )}`;
              return (
                <motion.div
                  key={service.id}
                  variants={cardVariants}
                  className="group flex flex-col justify-between rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-md shadow-xl hover:shadow-[0_10px_35px_rgba(99,102,241,0.2)] hover:border-indigo-500/20 transition-all duration-300 overflow-hidden"
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
                        unoptimized={true}
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
                      <p className="text-sm text-zinc-300 leading-relaxed font-semibold">
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
                        'bg-white/5 hover:bg-indigo-600 hover:text-white text-zinc-300 font-black text-xs uppercase tracking-wider',
                        'border border-white/10 hover:border-indigo-500/35 transition-all duration-200 shadow-md active:scale-[0.98]'
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

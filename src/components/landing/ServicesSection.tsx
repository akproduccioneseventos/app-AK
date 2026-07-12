'use client';

import Image from 'next/image';
import {
  Building2,
  Calendar,
  ChevronRight,
  Crown,
  Heart,
  MessageSquare,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
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
  icon?: LucideIcon;
}

const PARTY_TYPES: Array<{ title: string; icon: LucideIcon; desc: string }> = [
  { title: 'Bodas', icon: Heart, desc: 'Producción integral de ceremonias y fiestas.' },
  { title: '15 Años', icon: Crown, desc: 'Pistas LED, cabinas interactivas y temáticas exclusivas.' },
  { title: 'Cumpleaños & Sociales', icon: Sparkles, desc: 'Aniversarios y festejos familiares únicos.' },
  { title: 'Corporativos', icon: Building2, desc: 'Lanzamientos, cenas empresariales y conferencias.' },
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
    accentColor: 'bg-red-600',
    emoji: 'AK',
    whatsappMessage: '¡Hola AK Producciones! Me gustaría cotizar el paquete de Boda.',
    icon: Heart,
  },
  {
    id: 'xv-anos',
    title: 'XV Años',
    subtitle: 'Una noche de ensueño',
    description: 'Hacemos realidad la fiesta que soñaste con shows de luces interactivos y la tecnología que divierte a tus amigos.',
    features: ['Pistas LED interactivas', 'Cabinas y recuerdos en vivo', 'Ambientación temática a medida'],
    imageUrl: '/media/catalogo-servicios/quinceanera_persuasiva.png',
    imageHint: 'quinceañera party',
    accentColor: 'bg-emerald-600',
    emoji: 'XV',
    whatsappMessage: '¡Hola AK Producciones! Me gustaría cotizar el paquete de XV Años.',
    icon: Crown,
  },
  {
    id: 'cumpleanos',
    title: 'Cumpleaños & Sociales',
    subtitle: 'Celebraciones sin límites',
    description: 'El festejo familiar perfecto con la mejor discoteca, barra de tragos y ambientación a tu medida.',
    features: ['Discoteca y luces pro', 'Animación y barras exclusivas', 'Organización de tiempos y sorpresas'],
    imageUrl: '/media/catalogo-servicios/social_persuasivo.png',
    imageHint: 'birthday party lights',
    accentColor: 'bg-red-600',
    emoji: 'AK',
    whatsappMessage: '¡Hola AK Producciones! Me gustaría cotizar un cumpleaños.',
    icon: Sparkles,
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
    emoji: 'AK',
    whatsappMessage: '¡Hola AK Producciones! Me gustaría cotizar un evento corporativo.',
    icon: Building2,
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
    <section id="servicios" className="border-y border-slate-200 bg-white py-24 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 max-w-3xl">
          <span className="mb-4 inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
            <Sparkles className="h-3.5 w-3.5" />
            Todo en un solo lugar
          </span>
          <h2 className="font-headline text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
            Producción integral para fiestas bien organizadas
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
            Coordinamos comida, decoración, luces, fotos y logística con un equipo único. El cliente ve una propuesta clara y AK controla cada detalle.
          </p>
        </div>

        <div className="mb-20">
          <div className="mb-8 flex items-center gap-3">
            <Calendar className="h-6 w-6 text-red-700" />
            <div>
              <h3 className="font-headline text-2xl font-black text-slate-950">Celebraciones que producimos</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">Cada tipo de evento conserva su estética, tiempos y prioridades.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PARTY_TYPES.map((party) => {
              const Icon = party.icon;
              return (
                <div
                  key={party.title}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:bg-white hover:shadow-lg"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md border border-emerald-100 bg-emerald-50 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-headline text-lg font-black text-slate-950">{party.title}</h4>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">{party.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-10">
            <h3 className="font-headline text-2xl font-black text-slate-950">
              Servicios principales
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-600">
              La propuesta muestra beneficios concretos y deja un camino directo para consultar por WhatsApp.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {displayServices.map((service) => {
              const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                service.whatsappMessage || `¡Hola AK Producciones! Me gustaría consultar por el servicio de ${service.title} para mi evento.`
              )}`;
              const Icon = service.icon;

              return (
                <motion.article
                  key={service.id}
                  variants={cardVariants}
                  className="group flex flex-col justify-between overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-xl"
                >
                  <div>
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                      <Image
                        src={service.imageUrl}
                        alt={service.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 768px) 100vw, 30vw"
                        unoptimized={true}
                      />
                      <div className="absolute inset-0 bg-slate-950/25" />
                      <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-md border border-white/40 bg-white/90 text-sm font-black text-red-700 shadow-sm">
                        {Icon ? <Icon className="h-5 w-5" /> : service.emoji}
                      </div>
                    </div>

                    <div className="space-y-4 p-6 text-left">
                      <div>
                        <p className="text-xs font-bold text-red-700">{service.subtitle}</p>
                        <h4 className="mt-2 font-headline text-xl font-black text-slate-950">
                          {service.title}
                        </h4>
                      </div>
                      <p className="text-sm font-medium leading-relaxed text-slate-600">
                        {service.description}
                      </p>

                      <ul className="space-y-2 pt-1">
                        {service.features.map((feat) => (
                          <li key={feat} className="flex items-start gap-2 text-sm font-medium text-slate-700">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 p-6 pt-0">
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'mt-5 flex w-full items-center justify-center gap-2 rounded-md px-4 py-3.5',
                        'border border-red-200 bg-red-50 text-xs font-bold text-red-700',
                        'shadow-sm transition-all duration-200 hover:border-red-700 hover:bg-red-700 hover:text-white active:scale-[0.98]'
                      )}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      Consultar servicio
                      <ChevronRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

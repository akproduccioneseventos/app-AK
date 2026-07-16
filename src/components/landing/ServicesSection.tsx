'use client';

import Image from 'next/image';
import {
  Building2, Calendar, ChevronRight, Crown, Heart, MessageSquare, Sparkles, type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';
import { canUseNextImage } from '@/lib/next-image-url';

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
  badge?: string; // Persuasive emotion badge
}

const PARTY_TYPES: Array<{
  title: string;
  icon: LucideIcon;
  desc: string;
}> = [
  { title: 'Bodas', icon: Heart, desc: 'Producción integral para una unión inolvidable y sin estrés.' },
  { title: '15 Años', icon: Crown, desc: 'Pistas LED, cabinas interactivas y animación que divierte a tus amigos.' },
  { title: 'Sociales & Cumples', icon: Sparkles, desc: 'Aniversarios y festejos familiares cargados de calidez y diversión.' },
  { title: 'Corporativos', icon: Building2, desc: 'Lanzamientos, cenas de gala y conferencias con logística de vanguardia.' },
];

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 'bodas',
    title: 'Bodas de Gala',
    subtitle: 'El día más importante',
    description: 'La paz mental de saber que todo está coordinado. Unificamos ambientación floral de diseño, música emotiva y un banquete gourmet espectacular.',
    features: ['Coordinador de bodas in situ', 'Ambientación y flores exclusivas', 'Catering gourmet personalizado'],
    imageUrl: '/media/catalogo-servicios/boda_persuasiva.png',
    imageHint: 'wedding ceremony',
    accentColor: 'from-rose-500 to-pink-600',
    emoji: 'AK',
    whatsappMessage: '¡Hola AK Producciones! Me gustaría cotizar el paquete de Boda.',
    icon: Heart,
    badge: 'Paz Mental Garantizada',
  },
  {
    id: 'xv-anos',
    title: 'XV Años Premium',
    subtitle: 'Tu noche soñada',
    description: 'Hacemos realidad la fiesta que imaginas con shows de luces de última generación, cabinas de fotos interactiva y la música del momento.',
    features: ['Pistas de luces LED gigantes', 'Muro social QR en pantalla', 'Cabina de recuerdos en vivo'],
    imageUrl: '/media/catalogo-servicios/quinceanera_persuasiva.png',
    imageHint: 'quinceañera party',
    accentColor: 'from-emerald-500 to-teal-600',
    emoji: 'XV',
    whatsappMessage: '¡Hola AK Producciones! Me gustaría cotizar el paquete de XV Años.',
    icon: Crown,
    badge: 'La Preferida de los Jóvenes',
  },
  {
    id: 'cumpleanos',
    title: 'Cumpleaños & Sociales',
    subtitle: 'Celebrar la vida',
    description: 'Festejos dinámicos con la mejor discoteca, barras de tragos iluminadas y una ambientación cálida adaptada a tu presupuesto.',
    features: ['Discoteca y luces pro', 'Barras móviles exclusivas', 'Coordinación ágil del evento'],
    imageUrl: '/media/catalogo-servicios/social_persuasivo.png',
    imageHint: 'birthday party lights',
    accentColor: 'from-red-500 to-orange-600',
    emoji: 'AK',
    whatsappMessage: '¡Hola AK Producciones! Me gustaría cotizar un cumpleaños.',
    icon: Sparkles,
    badge: 'Diversión para Todos',
  },
];

interface ServicesSectionProps {
  whatsappNumber?: string;
  services?: ServiceItem[];
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export function ServicesSection({
  whatsappNumber = AK_WHATSAPP_NUMBER,
  services,
}: ServicesSectionProps) {
  const displayServices = services && services.length > 0 ? services : DEFAULT_SERVICES;

  return (
    <section id="servicios" className="relative overflow-hidden bg-zinc-950 py-24 text-white border-y border-white/5">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-red-600/5 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-rose-500/5 blur-[130px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-16 max-w-3xl text-left">
          <span className="mb-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-red-400 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-red-500" />
            Vencer la Fricción
          </span>
          <h2 className="font-headline text-4xl font-black leading-tight text-white sm:text-5xl md:text-6xl">
            Todo resuelto en un solo lugar
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-400 font-medium">
            Olvidate de coordinar con diez proveedores por separado. Unificamos gastronomía, música, ambientación y tecnología en propuestas integrales diseñadas para que disfrutes sin preocupaciones.
          </p>
        </div>

        {/* Party Types Quick Info (Neuroventas: categorización emocional) */}
        <div className="mb-20">
          <div className="mb-8 flex items-center gap-3 text-left">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-headline text-2xl font-black text-white">¿Cuál es tu celebración?</h3>
              <p className="mt-1 text-sm font-medium text-zinc-500">Diseñamos la estética, los tiempos y la música a tu medida.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-left">
            {PARTY_TYPES.map((party) => {
              const Icon = party.icon;
              return (
                <div
                  key={party.title}
                  className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:bg-white/[0.04] shadow-md"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-red-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-headline text-lg font-black text-white">{party.title}</h4>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-400">{party.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Services List with Premium Cards */}
        <div>
          <div className="mb-10 text-left">
            <h3 className="font-headline text-2xl font-black text-white">Nuestras Soluciones de Producción</h3>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              Elegí la base de tu evento y personalizala después a tu gusto en el simulador.
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
                service.whatsappMessage || `Hola AK Producciones! Me gustaría consultar por el servicio de ${service.title}.`
              )}`;
              const Icon = service.icon;
              const accentGradient = service.accentColor?.startsWith('from-')
                ? service.accentColor
                : 'from-red-600 to-rose-600';

              return (
                <motion.article
                  key={service.id}
                  variants={cardVariants}
                  className="group flex flex-col justify-between overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/30 backdrop-blur-md shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-red-500/20 hover:shadow-2xl hover:shadow-red-500/[0.02]"
                >
                  <div>
                    {/* Header Image Area with Accent Glow */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900">
                      {canUseNextImage(service.imageUrl) ? (
                        <Image
                          src={service.imageUrl}
                          alt={service.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                          sizes="(max-width: 768px) 100vw, 30vw"
                        />
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={service.imageUrl}
                          alt={service.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                      <div className={cn(
                        'absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 text-white shadow-lg backdrop-blur-md bg-zinc-950/80'
                      )}>
                        {Icon ? <Icon className="h-5 w-5 text-red-400" /> : service.emoji}
                      </div>

                      {/* Emotion Badge */}
                      {service.badge && (
                        <div className={cn(
                          'absolute right-4 top-4 rounded-lg bg-gradient-to-r px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow-md',
                          accentGradient
                        )}>
                          {service.badge}
                        </div>
                      )}
                    </div>

                    {/* Content Area */}
                    <div className="space-y-4 p-7 text-left">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-red-400">{service.subtitle}</p>
                        <h4 className="mt-2 font-headline text-xl font-black text-white group-hover:text-red-400 transition-colors">
                          {service.title}
                        </h4>
                      </div>
                      <p className="text-sm font-medium leading-relaxed text-zinc-400">
                        {service.description}
                      </p>
                      <ul className="space-y-2.5 pt-2">
                        {service.features.map((feat) => (
                          <li key={feat} className="flex items-start gap-2.5 text-sm font-medium text-zinc-300">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="p-7 pt-0">
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Consultar servicio de ${service.title} por WhatsApp`}
                      className={cn(
                        'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-4',
                        'border border-white/10 bg-white/5 text-xs font-black uppercase tracking-widest text-white backdrop-blur-md',
                        'shadow-sm transition-all duration-300 hover:border-red-500/30 hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98]'
                      )}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0 text-red-300 group-hover:text-white" />
                      Consultar servicio
                      <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-white" />
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

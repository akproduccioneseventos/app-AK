'use client';

import Image from 'next/image';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  whatsappMessage: string;
}

interface ServiceCardProps {
  service: ServiceItem;
  whatsappNumber?: string;
  reverse?: boolean;
}

export function ServiceCard({ service, whatsappNumber = '59899123456', reverse = false }: ServiceCardProps) {
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(service.whatsappMessage)}`;

  return (
    <div
      className={cn(
        'flex flex-col gap-8 items-center',
        reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'
      )}
    >
      {/* Image */}
      <div className="w-full lg:w-1/2 relative">
        <div className={cn('absolute inset-0 rounded-3xl blur-2xl opacity-30 -z-10', service.accentColor)} />
        <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl group">
          <Image
            src={service.imageUrl}
            alt={service.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
            data-ai-hint={service.imageHint}
          />
          {/* Emoji badge */}
          <div className="absolute top-4 left-4 w-14 h-14 rounded-2xl bg-white/90 backdrop-blur-sm flex items-center justify-center text-3xl shadow-lg">
            {service.emoji}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full lg:w-1/2 space-y-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-2">{service.subtitle}</p>
          <h3 className="font-headline text-4xl sm:text-5xl font-black text-slate-800 leading-tight">{service.title}</h3>
        </div>
        <p className="text-slate-600 text-lg leading-relaxed">{service.description}</p>

        {/* Features */}
        <ul className="space-y-3">
          {service.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <span className={cn('w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5', service.accentColor)}>
                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-slate-700 font-medium">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'inline-flex items-center gap-3 px-6 py-3 rounded-2xl',
            'bg-[#25D366] hover:bg-[#1eb356]',
            'text-white font-black text-sm uppercase tracking-widest',
            'shadow-lg shadow-green-900/20',
            'transition-all duration-300 hover:scale-105 active:scale-95'
          )}
        >
          <MessageSquare className="w-5 h-5 shrink-0" />
          Consultar este paquete
        </a>
      </div>
    </div>
  );
}

// ─── ServicesSection ────────────────────────────────────────────────────────

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 'bodas',
    title: 'Bodas',
    subtitle: 'El día más especial',
    description:
      'Convertimos tu boda en una experiencia única e irrepetible. Desde la decoración floral hasta la pista de baile, coordinamos cada detalle para que solo te preocupes por disfrutar.',
    features: [
      'Coordinación integral del evento',
      'Decoración y flores personalizadas',
      'Fotografía y filmación profesional',
      'Catering y menú a medida',
      'Animación y DJ',
      'Vestimenta y tocado',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80&auto=format&fit=crop',
    imageHint: 'wedding ceremony',
    accentColor: 'bg-pink-500',
    emoji: '💍',
    whatsappMessage: '¡Hola AK Producciones! Me gustaría cotizar el paquete de Boda.',
  },
  {
    id: 'xv-anos',
    title: 'XV Años',
    subtitle: 'Una noche de ensueño',
    description:
      'Los 15 años de tu princesa merecen la mejor producción. Creamos ambientes mágicos, coordinamos cada momento y logramos recuerdos que durarán para siempre.',
    features: [
      'Temática y ambientación exclusiva',
      'Vestido y tocado de la quinceañera',
      'Vals y coreografías ensayadas',
      'Mesa dulce y torta personalizada',
      'Cobertura fotográfica y video',
      'Invitaciones digitales premium',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80&auto=format&fit=crop',
    imageHint: 'quinceañera party dress',
    accentColor: 'bg-fuchsia-500',
    emoji: '👑',
    whatsappMessage: '¡Hola AK Producciones! Me gustaría cotizar el paquete de XV Años.',
  },
  {
    id: 'fiestas',
    title: 'Fiestas & Eventos',
    subtitle: 'Celebraciones sin límites',
    description:
      'Cumpleaños, aniversarios, baby showers, eventos corporativos y más. Adaptamos nuestra producción a cualquier escala y presupuesto, sin perder calidad ni creatividad.',
    features: [
      'Planificación y logística completa',
      'Decoración temática personalizada',
      'Catering variado y buffet',
      'Animación infantil y adultos',
      'Sonido, luces y DJ profesional',
      'Cobertura fotográfica',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?w=800&q=80&auto=format&fit=crop',
    imageHint: 'colorful party celebration',
    accentColor: 'bg-purple-500',
    emoji: '🎉',
    whatsappMessage: '¡Hola AK Producciones! Me gustaría cotizar un evento/fiesta.',
  },
];

interface ServicesSectionProps {
  services?: ServiceItem[];
  whatsappNumber?: string;
}

export function ServicesSection({ services = DEFAULT_SERVICES, whatsappNumber }: ServicesSectionProps) {
  return (
    <section id="servicios" className="py-24 bg-gradient-to-b from-white to-purple-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-primary mb-4">
            Lo que hacemos
          </p>
          <h2 className="font-headline text-5xl sm:text-6xl font-black text-slate-800 leading-tight mb-6">
            Nuestros Servicios
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Producción integral de eventos en Uruguay. Cada celebración, un mundo único.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary" />
            <div className="w-3 h-3 rounded-full bg-primary" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary" />
          </div>
        </div>

        {/* Service cards */}
        <div className="space-y-28">
          {services.map((service, index) => (
            <ServiceCard
              key={service.id}
              service={service}
              whatsappNumber={whatsappNumber}
              reverse={index % 2 !== 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

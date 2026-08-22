import type { ServiceItem } from '@/components/landing/ServicesSection';
import type { GalleryImage } from '@/components/landing/GallerySection';
import type { Testimonial } from '@/components/landing/TestimonialsSection';

export interface PromoConfig {
  metadata: { title: string; description: string };
  hero: {
    headline: string;
    subheadline: string;
    backgroundImageUrl?: string;
  };
  services?: ServiceItem[];
  gallery?: GalleryImage[];
  testimonials?: Testimonial[];
  cta: { headline: string; subheadline: string; label?: string };
  whatsappNumber?: string;
  whatsappMessage?: string;
}

export const PROMO_PAGES: Record<string, PromoConfig> = {
  'bodas': {
    metadata: {
      title: 'Bodas y Casamientos en Salto | AK Producciones',
      description:
        'Organización integral y producción técnica de casamientos en Salto: discoteca, ambientación, catering y salón.',
    },
    hero: {
      headline: 'Tu Boda Soñada\nen Salto',
      subheadline:
        'Organizamos tu casamiento de principio a fin con equipamiento propio y atención personalizada.',
      backgroundImageUrl: '/media/catalogo-servicios/boda_persuasiva.png',
    },
    cta: {
      headline: 'Consultá tu fecha\npara Casamiento',
      subheadline: 'Escribinos por WhatsApp y te asesoramos con la propuesta ideal.',
    },
  },

  'xv-anos': {
    metadata: {
      title: 'Fiestas de 15 Años en Salto | AK Producciones',
      description:
        'Producción de fiestas de 15 con robótica, sonido premium, pantallas LED y barra interactiva.',
    },
    hero: {
      headline: 'Fiestas de 15\nInolvidables',
      subheadline:
        'Todo lo que necesitás para una fiesta de 15 única con tecnología, luces y diversión.',
      backgroundImageUrl: '/media/catalogo-servicios/quinceanera_hero.png',
    },
    cta: {
      headline: 'Planificá tus 15\ncon nosotros',
      subheadline: 'Escribinos hoy y armamos el presupuesto personalizado para tu fiesta.',
    },
  },

  'eventos': {
    metadata: {
      title: 'Eventos Sociales y Fiestas en Salto | AK Producciones',
      description:
        'Equipamiento y coordinación para aniversarios, graduaciones y eventos sociales en Salto.',
    },
    hero: {
      headline: 'Eventos & Fiestas\nen Salto',
      subheadline:
        'Soluciones integrales de sonido, iluminación, catering y salones para tu celebración.',
      backgroundImageUrl: '/media/catalogo-servicios/social_persuasivo.png',
    },
    cta: {
      headline: 'Cotizá tu Evento\nsin compromiso',
      subheadline: 'Escribinos por WhatsApp y recibí asesoramiento inmediato.',
    },
  },

  'paquete-bodas-2026': {
    metadata: {
      title: 'Paquete Bodas 2026 — AK Producciones',
      description:
        'Reservá tu boda 2026 con AK Producciones y accedé a precios especiales de lanzamiento. ¡Cupos limitados!',
    },
    hero: {
      headline: 'Paquete\nBodas 2026',
      subheadline:
        'Precios especiales de lanzamiento para bodas en 2026. Cupos limitados — ¡consultá ahora!',
      backgroundImageUrl: '/media/catalogo-servicios/boda_persuasiva.png',
    },
    services: [
      {
        id: 'boda-2026',
        title: 'Todo incluido',
        subtitle: 'Paquete Bodas 2026',
        description:
          'Un paquete completo y personalizado que cubre desde la decoración hasta el último baile. Precio fijo, sin sorpresas.',
        features: [
          'Coordinación completa del día',
          'Decoración floral y ambientación',
          'Fotografía y filmación en 4K',
          'Catering para hasta 150 personas',
          'DJ y animación profesional',
          'Torta nupcial de 4 pisos',
          'Traslado de novios',
          'Mesa dulce premium',
        ],
        imageUrl: '/media/catalogo-servicios/decoracion-boda-mesa-01.jpeg',
        imageHint: 'wedding decoration flowers',
        accentColor: 'bg-pink-500',
        emoji: '💍',
        whatsappMessage:
          '¡Hola AK Producciones! Vi la promo de Bodas 2026 y me gustaría cotizar.',
      },
    ],
    cta: {
      headline: '¡Reservá tu\nFecha Ahora!',
      subheadline:
        'Los cupos para 2026 son limitados. Escribinos hoy y asegurá el día más especial de tu vida.',
    },
    whatsappMessage: '¡Hola AK Producciones! Vi la promo de Bodas 2026 y me gustaría reservar.',
  },

  'paquete-xv-anos': {
    metadata: {
      title: 'Paquete XV Años — AK Producciones',
      description:
        'La fiesta de 15 años más especial de tu vida. Paquetes completos con todo lo que necesitás.',
    },
    hero: {
      headline: 'XV Años\nPerfectos',
      subheadline:
        'Convertimos los 15 años de tu hija en una noche de ensueño. Paquetes completos y personalizados.',
      backgroundImageUrl: '/media/catalogo-servicios/quinceanera_hero.png',
    },
    services: [
      {
        id: 'xv-completo',
        title: 'Paquete Completo',
        subtitle: 'XV Años Premium',
        description:
          'Todo lo que necesitás para una fiesta de XV años que se recuerde toda la vida. Desde el vals hasta la última sorpresa.',
        features: [
          'Ambientación y decoración temática',
          'Vestido de quinceañera incluido',
          'Vals y coreografía ensayada',
          'Mesa dulce y torta personalizada',
          'Fotografía y video profesional',
          'Invitaciones digitales premium',
          'DJ y animación toda la noche',
          'Sorpresa especial de medianoche',
        ],
        imageUrl: '/media/catalogo-servicios/xv-decoracion-rosa-01.jpeg',
        imageHint: 'sweet fifteen celebration cake',
        accentColor: 'bg-fuchsia-500',
        emoji: '👑',
        whatsappMessage: '¡Hola AK Producciones! Vi el paquete de XV Años y me gustaría cotizar.',
      },
    ],
    cta: {
      headline: '¡Hacé Realidad\nSu Sueño!',
      subheadline:
        'Escribinos hoy con la fecha de los XV y empezamos a planificar la fiesta perfecta.',
    },
    whatsappMessage: '¡Hola AK Producciones! Quiero cotizar el paquete de XV Años.',
  },
};

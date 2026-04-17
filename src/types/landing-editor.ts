/**
 * Types for the Landing Page Visual Editor.
 * The admin can edit these settings from the panel at /empresa/landing-editor.
 * The public landing page at /landing reads these settings and renders accordingly.
 */

export interface LandingHeroSettings {
  headline: string;
  subheadline: string;
  backgroundImageUrl: string;
  badgeText: string;
  ctaLabel: string;
  ctaUrl: string;
}

export interface LandingStatItem {
  value: string;
  label: string;
  icon: string; // emoji or icon name
}

export interface LandingCtaSettings {
  headline: string;
  subheadline: string;
  ctaLabel: string;
  whatsappNumber: string;
}

export interface LandingColorSettings {
  overlayFrom: string; // CSS color, e.g. "rgba(88,28,135,0.8)"
  overlayTo: string;   // CSS color
  accentColor: string; // hex
}

export interface LandingSeoSettings {
  title: string;
  description: string;
  ogImageUrl: string;
}

export interface LandingFaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface LandingGalleryImage {
  id: string;
  url: string;
  caption?: string;
  featured?: boolean;
}

export interface LandingServiceItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  imageUrl?: string;
}

export interface LandingSettings {
  hero: LandingHeroSettings;
  services?: LandingServiceItem[];
  stats: LandingStatItem[];
  cta: LandingCtaSettings;
  gallery?: LandingGalleryImage[];
  colors: LandingColorSettings;
  seo: LandingSeoSettings;
  faqs?: LandingFaqItem[];
  whatsappNumber: string;
  updatedAt?: string;
}

export const defaultLandingSettings: LandingSettings = {
  whatsappNumber: '59898355530',
  hero: {
    headline: 'Hacemos Realidad\ntu Celebración',
    subheadline:
      'Bodas, XV Años, Cumpleaños y más — producción integral con calidad premium en Uruguay.',
    backgroundImageUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=85&auto=format&fit=crop',
    badgeText: 'Producción Integral de Eventos',
    ctaLabel: 'Cotizá tu evento ahora',
    ctaUrl: '/simulador-de-presupuesto',
  },
  services: [
    { id: 'svc_1', icon: '💍', title: 'Bodas', description: 'Producción integral de bodas civiles y religiosas.' },
    { id: 'svc_2', icon: '🎂', title: 'XV Años', description: 'Celebraciones únicas y memorables.' },
    { id: 'svc_3', icon: '🎉', title: 'Cumpleaños', description: 'Fiestas personalizadas para todas las edades.' },
    { id: 'svc_4', icon: '🏢', title: 'Eventos Corporativos', description: 'Lanzamientos, conferencias y team buildings.' },
  ],
  stats: [
    { value: '+500', label: 'Eventos Realizados', icon: '🎉' },
    { value: '+12', label: 'Años de Experiencia', icon: '⭐' },
    { value: '100%', label: 'Clientes Satisfechos', icon: '❤️' },
    { value: '24/7', label: 'Soporte al Cliente', icon: '📞' },
  ],
  cta: {
    headline: '¿Listo para crear algo increíble?',
    subheadline: 'Cotizá tu evento sin compromiso. Respondemos en menos de 24 horas.',
    ctaLabel: 'Hablar con un asesor',
    whatsappNumber: '59898355530',
  },
  gallery: [],
  colors: {
    overlayFrom: 'rgba(88,28,135,0.8)',
    overlayTo: 'rgba(112,26,117,0.6)',
    accentColor: '#a855f7',
  },
  seo: {
    title: 'AK Producciones Eventos — Bodas, XV Años y más en Uruguay',
    description:
      'Producción integral de eventos en Uruguay. Bodas, XV años, cumpleaños y eventos corporativos. ¡Cotizá hoy y hacé realidad tu celebración soñada!',
    ogImageUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=85&auto=format&fit=crop',
  },
  faqs: [
    {
      id: 'faq_1',
      question: '¿Cuánto cuesta organizar una fiesta?',
      answer: 'El precio varía según el tipo de evento, la cantidad de invitados y los servicios incluidos. Podés usar nuestro simulador de presupuesto para obtener una cotización personalizada en minutos.',
    },
    {
      id: 'faq_2',
      question: '¿Con cuánta anticipación debo reservar?',
      answer: 'Recomendamos reservar con al menos 3 a 6 meses de anticipación, especialmente para fechas de alta demanda (fines de semana en temporada alta). Igual, no dudes en consultarnos aunque sea con menos tiempo.',
    },
    {
      id: 'faq_3',
      question: '¿Qué incluye el servicio de AK Producciones?',
      answer: 'Ofrecemos producción integral: catering, ambientación y decoración, discoteca e iluminación, coordinación del evento y mucho más. Cada paquete es personalizable según tus necesidades.',
    },
    {
      id: 'faq_4',
      question: '¿Puedo ver el salón antes de reservar?',
      answer: 'Por supuesto. Podés agendar una visita sin costo para conocer el espacio y hablar con nuestro equipo. Escribinos por WhatsApp o usá el simulador para dar el primer paso.',
    },
  ],
};

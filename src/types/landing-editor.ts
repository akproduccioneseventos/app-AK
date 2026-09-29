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

export type LandingThemeModel = 'elegante' | 'fiesta' | 'sobrio' | 'moderno';

export interface LandingThemePreset {
  id: LandingThemeModel;
  name: string;
  description: string;
  colors: LandingColorSettings;
  heroBadge: string;
}

export const LANDING_THEME_PRESETS: Record<LandingThemeModel, LandingThemePreset> = {
  elegante: {
    id: 'elegante',
    name: 'Elegante',
    description: 'Tonos violeta y púrpura clásicos, ideal para bodas y galas.',
    colors: {
      overlayFrom: 'rgba(88,28,135,0.85)',
      overlayTo: 'rgba(112,26,117,0.65)',
      accentColor: '#a855f7',
    },
    heroBadge: 'Producción Integral de Eventos',
  },
  fiesta: {
    id: 'fiesta',
    name: 'Fiesta',
    description: 'Tonos fucsia y dorados vibrantes, especial para 15 años y aniversarios movidos.',
    colors: {
      overlayFrom: 'rgba(190,24,93,0.85)',
      overlayTo: 'rgba(217,119,6,0.65)',
      accentColor: '#ec4899',
    },
    heroBadge: 'La Mejor Noche de tu Vida',
  },
  sobrio: {
    id: 'sobrio',
    name: 'Sobrio',
    description: 'Tonos azul noche y plata, perfecto para corporativos y celebraciones institucionales.',
    colors: {
      overlayFrom: 'rgba(15,23,42,0.9)',
      overlayTo: 'rgba(30,41,59,0.75)',
      accentColor: '#38bdf8',
    },
    heroBadge: 'Excelencia y Profesionalismo',
  },
  moderno: {
    id: 'moderno',
    name: 'Moderno',
    description: 'Tonos esmeralda y verde tecnológico, enfocado en innovación y pantallas LED.',
    colors: {
      overlayFrom: 'rgba(6,78,59,0.85)',
      overlayTo: 'rgba(4,120,87,0.65)',
      accentColor: '#10b981',
    },
    heroBadge: 'Tecnología y Producción Total',
  },
};

export interface LandingSettings {
  themeModel?: LandingThemeModel;
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
  themeModel: 'elegante',
  whatsappNumber: '59898355530',
  hero: {
    headline: 'Organizá tu fiesta completa\nen Salto con AK Producciones',
    subheadline:
      'Salón, comida, discoteca, decoración, fotografía, filmación, barra y coordinación en un solo lugar.',
    backgroundImageUrl:
      '/media/catalogo-servicios/quinceanera_hero.png',
    badgeText: 'Producción Integral de Eventos',
    ctaLabel: 'Consultar fecha por WhatsApp',
    ctaUrl: 'https://wa.me/59898355530',
  },
  services: [
    { id: 'svc_1', icon: '💍', title: 'Bodas', description: 'Planificación y producción integral de bodas con todo resuelto.' },
    { id: 'svc_2', icon: '👑', title: 'XV Años', description: 'Celebraciones modernas, coreografías y pistas LED espectaculares.' },
    { id: 'svc_3', icon: '🎉', title: 'Cumpleaños & Sociales', description: 'Aniversarios y festejos familiares únicos.' },
    { id: 'svc_4', icon: '🏢', title: 'Eventos Corporativos', description: 'Lanzamientos de marcas, cenas empresariales y conferencias.' },
    { id: 'svc_5', icon: '🏛️', title: 'Salón Club Uruguay', description: 'Producción exclusiva en el salón clásico más elegante de Salto.' },
    { id: 'svc_6', icon: '📱', title: 'Tecnología Interactiva', description: 'Portal del cliente, invitación QR y muro social en pantalla gigante en vivo.' },
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
      '/media/catalogo-servicios/decoracion-boda-mesa-01.jpeg',
  },
  faqs: [
    {
      id: 'faq_1',
      question: '¿Cómo reservo mi fecha?',
      answer: 'Coordinamos una entrevista sin costo (presencial o por videollamada) para ver los detalles básicos de tu fiesta completa. La reserva de la fecha se asegura mediante una seña.',
    },
    {
      id: 'faq_2',
      question: '¿Qué incluye el servicio integral?',
      answer: 'Es una fiesta completa con todo en un solo lugar: salón, comida, discoteca, decoración, fotografía, filmación, barra y la coordinación general antes y durante el evento.',
    },
    {
      id: 'faq_3',
      question: '¿Puedo contratar solo algunos servicios?',
      answer: 'Sí, totalmente. Aunque nos especializamos en darte el servicio integral para tu tranquilidad, podés contratar por separado módulos específicos como discoteca, fotografía o la cabina de fotos.',
    },
    {
      id: 'faq_4',
      question: '¿Trabajan con Club Uruguay?',
      answer: 'Sí, somos especialistas en realizar eventos en el Salón Club Uruguay de Salto. Nos encargamos de coordinar todo el armado clásico, comida, discoteca y personal en ese espacio.',
    },
    {
      id: 'faq_5',
      question: '¿Cómo pido presupuesto?',
      answer: 'Podés usar el simulador de presupuesto en esta web para tener un precio estimado según tu cantidad de invitados y los servicios que elijas, o pedirlo directamente por WhatsApp.',
    },
    {
      id: 'faq_6',
      question: '¿Hacen fiestas de 15, bodas y cumpleaños?',
      answer: 'Sí, producimos de forma integral fiestas de 15 años, bodas, aniversarios, cumpleaños familiares y eventos empresariales en Salto.',
    },
  ],
};

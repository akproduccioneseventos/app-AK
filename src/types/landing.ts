
export interface GalleryItem {
  id: string;
  type: 'photo' | 'video';
  url: string; // photo: direct image URL; video: YouTube/Vimeo watch URL
  caption?: string;
}

export interface ServiceHighlight {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface LandingPageSettings {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  aboutText: string;
  catalogUrl: string;
  catalogType: 'iframe' | 'pdf';
  galleryItems: GalleryItem[];
  serviceHighlights: ServiceHighlight[];
  whatsappNumber: string;
}

export const defaultLandingPageSettings: LandingPageSettings = {
  heroTitle: 'AK Producciones Eventos',
  heroSubtitle: 'Hacemos tus sueños realidad',
  heroDescription:
    'Especialistas en organización de XV Años, Bodas, Cumpleaños y todo tipo de eventos únicos e inolvidables en Salto, Uruguay.',
  aboutText:
    'Somos AK Producciones, una empresa con años de experiencia en la organización de eventos en Uruguay. Nuestro equipo trabaja con dedicación y creatividad para que cada evento sea único e inolvidable.',
  catalogUrl: '',
  catalogType: 'iframe',
  galleryItems: [],
  serviceHighlights: [
    { id: '1', icon: 'Music2', title: 'DJ & Sonido', description: 'Equipamiento profesional de alta gama' },
    { id: '2', icon: 'Palette', title: 'Decoración', description: 'Diseños personalizados y únicos' },
    { id: '3', icon: 'UtensilsCrossed', title: 'Catering', description: 'Gastronomía de alta calidad' },
    { id: '4', icon: 'Camera', title: 'Fotografía', description: 'Momentos eternos capturados' },
    { id: '5', icon: 'Sparkles', title: 'Animación', description: 'Shows y entretenimiento para todos' },
    { id: '6', icon: 'ClipboardList', title: 'Organización', description: 'Gestión integral de tu evento' },
  ],
  whatsappNumber: '59899123456',
};

// ─── Promotional Landing Pages ───────────────────────────────────────────────

export interface PromoPackage {
  id: string;
  name: string;
  description?: string;
  includes: string[];
  price?: string;
  isHighlighted?: boolean;
}

export interface PromoLandingPage {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  heroImageUrl?: string;
  accentColor?: string;
  packages?: PromoPackage[];
  isActive: boolean;
  createdAt: string;
  ctaWhatsAppMessage?: string;
}

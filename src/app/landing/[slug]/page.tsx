import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing/LandingNav';
import { HeroSection } from '@/components/landing/HeroSection';
import { ServicesSection, type ServiceItem } from '@/components/landing/ServicesSection';
import { GallerySection, type GalleryImage } from '@/components/landing/GallerySection';
import { TestimonialsSection, type Testimonial } from '@/components/landing/TestimonialsSection';
import { CTASection } from '@/components/landing/CTASection';
import { PublicFooter } from '@/components/public-footer';
import { notFound } from 'next/navigation';
import { CAMPAIGN_LANDING_MAP, CAMPAIGN_LANDINGS } from '@/lib/marketing/campaign-landings';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

// ─── Promo page data store ──────────────────────────────────────────────────
// To add a new promotion, simply add an entry to this object with a unique slug.
// All fields override the landing page defaults shown below.

interface PromoConfig {
  metadata: { title: string; description: string };
  hero: {
    headline: string;
    subheadline: string;
    backgroundImageUrl?: string;
  };
  services?: ServiceItem[];
  gallery?: GalleryImage[];
  testimonials?: Testimonial[];
  cta: { headline: string; subheadline: string };
  whatsappNumber?: string;
  whatsappMessage?: string;
}

type AnyLandingConfig = PromoConfig | import('@/lib/marketing/campaign-landings').CampaignLandingConfig;

function getConfigMetadata(config: AnyLandingConfig) {
  if ('metadata' in config) return config.metadata;
  return {
    title: config.title,
    description: config.description,
  };
}

function getConfigCtaLabel(config: AnyLandingConfig) {
  return 'label' in config.cta ? config.cta.label : 'Consultar por WhatsApp';
}

function getConfigWhatsappNumber(config: AnyLandingConfig) {
  return 'whatsappNumber' in config && config.whatsappNumber
    ? config.whatsappNumber
    : AK_WHATSAPP_NUMBER;
}

const PROMO_PAGES: Record<string, PromoConfig> = {
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

// ─── Page ───────────────────────────────────────────────────────────────────

interface PromoPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PromoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const config: AnyLandingConfig | undefined = PROMO_PAGES[slug] || CAMPAIGN_LANDING_MAP[slug];
  if (!config) return { title: 'Promo — AK Producciones' };
  const meta = getConfigMetadata(config);
  return {
    title: meta.title,
    description: meta.description,
  };
}

export default async function PromoLandingPage({ params }: PromoPageProps) {
  const { slug } = await params;
  const config: AnyLandingConfig | undefined = PROMO_PAGES[slug] || CAMPAIGN_LANDING_MAP[slug];

  if (!config) notFound();

  const whatsappNumber = getConfigWhatsappNumber(config);
  const ctaLabel = getConfigCtaLabel(config);

  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <HeroSection
        whatsappNumber={whatsappNumber}
        headline={config.hero.headline}
        subheadline={config.hero.subheadline}
        backgroundImageUrl={config.hero.backgroundImageUrl}
        whatsappMessage={config.whatsappMessage}
        ctaLabel={ctaLabel}
      />
      {config.services && (
        <ServicesSection services={config.services} whatsappNumber={whatsappNumber} />
      )}
      {config.gallery && <GallerySection images={config.gallery} />}
      {config.testimonials && <TestimonialsSection testimonials={config.testimonials} />}
      <CTASection
        whatsappNumber={whatsappNumber}
        headline={config.cta.headline}
        subheadline={config.cta.subheadline}
        ctaLabel={ctaLabel}
        whatsappMessage={config.whatsappMessage}
      />
      <PublicFooter variant="dark" />
    </div>
  );
}

// Pre-render known promo pages
export async function generateStaticParams() {
  return [
    ...Object.keys(PROMO_PAGES).map((slug) => ({ slug })),
    ...CAMPAIGN_LANDINGS.map((campaign) => ({ slug: campaign.slug })),
  ];
}

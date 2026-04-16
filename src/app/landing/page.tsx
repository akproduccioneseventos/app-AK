import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing/LandingNav';
import { HeroSection } from '@/components/landing/HeroSection';
import { ServicesSection } from '@/components/landing/ServicesSection';
import { GallerySection } from '@/components/landing/GallerySection';
import { VideoSection } from '@/components/landing/VideoSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { CTASection } from '@/components/landing/CTASection';
import { FAQSection } from '@/components/landing/FAQSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { ProcessSection } from '@/components/landing/ProcessSection';
import { PublicFooter } from '@/components/public-footer';
import { getPromoActiva } from '@/app/actions/promos';
import { PromoWidget } from '@/components/promo/PromoWidget';
import { getGaleriaItems } from '@/app/actions/galeria';
import { getLandingSettings } from '@/app/actions/landing-editor';
import { getCatalogoFotos } from '@/app/actions/catalogo-fotos';
import type { GaleriaFoto } from '@/types/galeria';
import type { GalleryImage } from '@/components/landing/GallerySection';
import type { ServiceItem } from '@/components/landing/ServicesSection';

const DEFAULT_DYNAMIC_SERVICE_SUBTITLE = 'Servicio AK';
const DEFAULT_DYNAMIC_SERVICE_FEATURES = [
  'Atención personalizada',
  'Producción integral',
  'Soporte dedicado',
];
const DEFAULT_DYNAMIC_SERVICE_IMAGE = 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1000&q=80&auto=format&fit=crop';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getLandingSettings();
  return {
    title: settings.seo.title,
    description: settings.seo.description,
    openGraph: {
      title: settings.seo.title,
      description: settings.seo.description,
      type: 'website',
      images: settings.seo.ogImageUrl
        ? [{ url: settings.seo.ogImageUrl, width: 1200, height: 630, alt: 'AK Producciones Eventos' }]
        : [],
    },
  };
}

export default async function LandingPage() {
  const [promo, galeriaData, landingSettings, catalogoFotos] = await Promise.all([
    getPromoActiva(),
    getGaleriaItems(),
    getLandingSettings(),
    getCatalogoFotos().catch(() => []),
  ]);

  const fotos = galeriaData?.fotos ?? [];
  const videos = galeriaData?.videos ?? [];

  // Merge catalog photos into galería, deduplicating by URL
  const galeriaUrls = new Set(fotos.map(f => f.url));
  const catalogoComoGaleria: GaleriaFoto[] = catalogoFotos
    .filter(f => !galeriaUrls.has(f.url))
    .map((f) => ({
      id: f.id,
      tipo: 'foto' as const,
      url: f.url,
      titulo: f.titulo,
      descripcion: f.descripcion,
      categoria: f.categoriaServicio,
      destacada: f.destacada,
      orden: fotos.length + f.orden,
      createdAt: f.createdAt,
    }));
  const fotosCombinadas = [...fotos, ...catalogoComoGaleria];

  const whatsapp = landingSettings.whatsappNumber || '59898355530';
  const servicesForLanding: ServiceItem[] | undefined = landingSettings.services?.length
    ? landingSettings.services.map((service) => ({
      id: service.id,
      title: service.title,
      subtitle: DEFAULT_DYNAMIC_SERVICE_SUBTITLE,
      description: service.description,
      features: DEFAULT_DYNAMIC_SERVICE_FEATURES,
      imageUrl: service.imageUrl || DEFAULT_DYNAMIC_SERVICE_IMAGE,
      imageHint: 'event service',
      accentColor: 'bg-primary',
      emoji: service.icon || '✨',
      whatsappMessage: `¡Hola AK Producciones! Me gustaría cotizar el servicio de ${service.title}.`,
    }))
    : undefined;
  const galleryImagesForLanding: GalleryImage[] | undefined = landingSettings.gallery?.length
    ? landingSettings.gallery.map((img) => ({
      id: img.id,
      src: img.url,
      alt: img.caption || 'Imagen de galería',
      hint: 'event gallery',
      category: 'Landing',
      titulo: img.caption,
      descripcion: img.caption,
      destacada: img.featured,
    }))
    : undefined;

  return (
    <div className="min-h-screen bg-white">
      {promo && <PromoWidget promo={promo} />}
      <LandingNav whatsappNumber={whatsapp} />
      <HeroSection
        whatsappNumber={whatsapp}
        promoActiva={promo}
        headline={landingSettings.hero.headline}
        subheadline={landingSettings.hero.subheadline}
        backgroundImageUrl={landingSettings.hero.backgroundImageUrl}
      />
      <StatsSection stats={landingSettings.stats.length > 0 ? landingSettings.stats : undefined} />
      <ServicesSection whatsappNumber={whatsapp} services={servicesForLanding} />
      <ProcessSection />
      <GallerySection images={galleryImagesForLanding} galeriaFotos={galleryImagesForLanding?.length ? [] : fotosCombinadas} />
      <VideoSection galeriaVideos={videos} />
      <TestimonialsSection />
      <FAQSection faqs={landingSettings.faqs} />
      <CTASection
        whatsappNumber={whatsapp}
        headline={landingSettings.cta.headline}
        subheadline={landingSettings.cta.subheadline}
        ctaLabel={landingSettings.cta.ctaLabel}
      />
      <PublicFooter variant="dark" />
    </div>
  );
}

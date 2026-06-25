import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing/LandingNav';
import { HeroSection } from '@/components/landing/HeroSection';
import { ServicesSection } from '@/components/landing/ServicesSection';
import TechnologyExperienceSection from '@/components/landing/TechnologyExperienceSection';
import { AkDifferenceSection } from '@/components/landing/AkDifferenceSection';
import { AkTeamStorySection } from '@/components/landing/AkTeamStorySection';
import { GallerySection } from '@/components/landing/GallerySection';
import { VideoSection } from '@/components/landing/VideoSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { CTASection } from '@/components/landing/CTASection';
import { FAQSection } from '@/components/landing/FAQSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { ProcessSection } from '@/components/landing/ProcessSection';
import { CommercialJourneySection } from '@/components/landing/CommercialJourneySection';
import { PublicFooter } from '@/components/public-footer';
import { BlogSection } from '@/components/landing/BlogSection';
import { FloatingActions } from '@/components/public/FloatingActions';
import { SalonDestacadoSection } from '@/components/landing/SalonDestacadoSection';
import { getPromoActiva } from '@/app/actions/promos';
import { getGaleriaItems } from '@/app/actions/galeria';
import { getLandingSettings } from '@/app/actions/landing-editor';
import { getCatalogoFotos } from '@/app/actions/catalogo-fotos';
import { getTestimonials } from '@/app/actions/feedback';
import type { GaleriaFoto } from '@/types/galeria';
import type { ServiceItem } from '@/components/landing/ServicesSection';
import { getAkYoutubeVideos, AK_YOUTUBE_CHANNEL_URL } from '@/lib/youtube/ak-channel';
import { commercialAttributionFromRecord } from '@/lib/commercial/acquisition';
import { PromoWidget } from '@/components/promo/PromoWidget';

export const revalidate = 300;

const DEFAULT_DYNAMIC_SERVICE_SUBTITLE = 'Servicio AK';
const DEFAULT_DYNAMIC_SERVICE_FEATURES = [
  'Atención personalizada',
  'Producción integral',
  'Soporte dedicado',
];
const DEFAULT_DYNAMIC_SERVICE_IMAGE = '/media/catalogo-servicios/boda-decoracion-dorada-01.jpeg';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getLandingSettings();
  return {
    title: `${settings.seo.title || 'AK Producciones'} | Organización Integral de Eventos en Salto`,
    description: settings.seo.description || 'Organización completa de bodas, fiestas de 15 años y eventos empresariales en Salto, Uruguay. Discoteca, catering premium, fotografía, decoración y salones de fiesta en un solo lugar con tecnología interactiva.',
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

interface LandingPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HomePage({ searchParams }: LandingPageProps) {
  const resolvedSearchParams = await searchParams;
  const [promo, galeriaData, landingSettings, catalogoFotos, youtubeVideos, testimonialData] = await Promise.all([
    getPromoActiva(),
    getGaleriaItems(),
    getLandingSettings(),
    getCatalogoFotos().catch(() => []),
    getAkYoutubeVideos(),
    getTestimonials().catch(() => []),
  ]);

  const fotos = galeriaData?.fotos ?? [];
  const videos = galeriaData?.videos ?? [];
  const videoIds = new Set(videos.map((video) => video.youtubeId));
  const videosCombinados = [
    ...videos,
    ...youtubeVideos.filter((video) => !videoIds.has(video.youtubeId)),
  ];

  const galeriaUrls = new Set(fotos.map(f => f.url));
  const catalogoComoGaleria: GaleriaFoto[] = catalogoFotos
    .filter(f => !galeriaUrls.has(f.url))
    .map((f) => ({
      id: f.id,
      tipo: 'foto' as const,
      url: f.url,
      titulo: f.titulo,
      description: f.descripcion,
      categoria: f.categoriaServicio,
      destacada: f.destacada,
      orden: fotos.length + f.orden,
      createdAt: f.createdAt,
    }));
  const fotosCombinadas = [...fotos, ...catalogoComoGaleria];

  const whatsapp = '59898355530'; // Usar el número real de contacto de la empresa
  const attribution = commercialAttributionFromRecord(resolvedSearchParams, 'landing');
  const approvedTestimonials = testimonialData
    .filter((testimonial) => testimonial.isApproved)
    .map((testimonial, index) => {
      const initials = testimonial.clientName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
      const colors = ['bg-red-600', 'bg-emerald-600', 'bg-blue-600', 'bg-amber-600'];
      return {
        id: testimonial.id,
        name: testimonial.clientName,
        role: 'Cliente AK',
        eventType: testimonial.fiestaNombre,
        text: testimonial.testimonialText,
        avatarInitials: initials || 'AK',
        avatarColor: colors[index % colors.length],
        rating: 5,
      };
    });

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

  // JSON-LD Structured Data for Local Business SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EventVenue',
    'name': 'AK Producciones',
    'image': fotosCombinadas.slice(0, 3).map(f => f.url),
    'telephone': '+598 98 355 530',
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': 'Gaboto 3390',
      'addressLocality': 'Salto',
      'addressCountry': 'UY',
    },
    'geo': {
      '@type': 'GeoCoordinates',
      'latitude': -31.3893,  // Coordenadas de Salto, Uruguay
      'longitude': -57.9592,
    },
    'url': 'https://akproducciones.uy',
    'sameAs': [
      'https://www.facebook.com/akproduccionessalto',
      'https://www.instagram.com/akproduccionessalto',
    ],
    'description': 'Organización integral de eventos en Salto, Uruguay. Discoteca, catering premium, fotografía, decoración y salones de fiesta en un solo lugar con tecnología interactiva.',
  };

  return (
    <div className="ak-landing-experience min-h-screen bg-white">
      {/* Inject JSON-LD Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {promo && <PromoWidget promo={promo} />}
      <LandingNav whatsappNumber={whatsapp} />
      <HeroSection
        whatsappNumber={whatsapp}
        promoActiva={promo}
        headline={landingSettings.hero.headline}
        subheadline={landingSettings.hero.subheadline}
        backgroundImageUrl={landingSettings.hero.backgroundImageUrl}
        simulatorHref="/simulador-de-presupuesto"
        simulatorLabel="Cotizá tu Fiesta"
      />
      <StatsSection stats={landingSettings.stats.length > 0 ? landingSettings.stats : undefined} />
      <AkDifferenceSection />
      <CommercialJourneySection attribution={attribution} whatsappNumber={whatsapp} />
      <ServicesSection whatsappNumber={whatsapp} services={servicesForLanding} />
      <TechnologyExperienceSection whatsappNumber={whatsapp} />
      <SalonDestacadoSection />
      <AkTeamStorySection />
      <ProcessSection />
      <GallerySection galeriaFotos={fotosCombinadas} />
      <BlogSection />
      <VideoSection galeriaVideos={videosCombinados} channelUrl={AK_YOUTUBE_CHANNEL_URL} />
      <TestimonialsSection testimonials={approvedTestimonials} />
      <FAQSection faqs={landingSettings.faqs} />
      <CTASection
        whatsappNumber={whatsapp}
        headline={landingSettings.cta.headline}
        subheadline={landingSettings.cta.subheadline}
        ctaLabel={landingSettings.cta.ctaLabel}
      />
      <PublicFooter variant="dark" />
      <FloatingActions whatsappNumber={whatsapp} />
    </div>
  );
}

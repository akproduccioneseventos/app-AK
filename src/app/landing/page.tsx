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
  const [promo, galeriaData, landingSettings] = await Promise.all([
    getPromoActiva(),
    getGaleriaItems(),
    getLandingSettings(),
  ]);

  const whatsapp = landingSettings.whatsappNumber || '59898355530';

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
      <ServicesSection whatsappNumber={whatsapp} />
      <ProcessSection />
      <GallerySection galeriaFotos={galeriaData.fotos} />
      <VideoSection galeriaVideos={galeriaData.videos} />
      <TestimonialsSection />
      <FAQSection />
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

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
import { PROMO_PAGES, type PromoConfig } from '@/lib/marketing/promo-pages';

// Las paginas de promocion viven en src/lib/marketing/promo-pages.ts, en un solo
// lugar. Estaban copiadas aca tambien, y la pantalla de posicionamiento leia la
// copia: si alguien cambiaba un titulo aca, la auditoria seguia diciendo que
// estaba todo bien. Para agregar una promocion, se agrega alla y nada mas.

type AnyLandingConfig = PromoConfig | import('@/lib/marketing/campaign-landings').CampaignLandingConfig;

function getConfigMetadata(config: AnyLandingConfig) {
  if ('metadata' in config) return config.metadata;
  return {
    title: config.title,
    description: config.description,
  };
}

function getConfigCtaLabel(config: AnyLandingConfig) {
  return 'label' in config.cta && config.cta.label ? config.cta.label : 'Consultar por WhatsApp';
}

function getConfigWhatsappNumber(config: AnyLandingConfig) {
  return 'whatsappNumber' in config && config.whatsappNumber
    ? config.whatsappNumber
    : AK_WHATSAPP_NUMBER;
}

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

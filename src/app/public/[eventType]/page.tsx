import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCatalogBySlug, catalogList } from '@/data/event-catalogs';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { HeroSection } from '@/components/public/HeroSection';
import { ServiceMenu } from '@/components/public/ServiceMenu';
import { TestimonialsCarousel } from '@/components/public/TestimonialsCarousel';
import { PromotionsOrGifts } from '@/components/public/PromotionsOrGifts';
import { FAQSection } from '@/components/public/FAQSection';
import { PaymentMethods } from '@/components/public/PaymentMethods';
import { CallToActionBanner } from '@/components/public/CallToActionBanner';
import { WhyChooseUs } from '@/components/public/WhyChooseUs';
import { EventProcess } from '@/components/public/EventProcess';
import { GallerySection } from '@/components/public/GallerySection';
import { PublicFooter } from '@/components/public-footer';

interface Props {
  params: Promise<{ eventType: string }>;
}

// Pre-render all known event type slugs at build time
export async function generateStaticParams() {
  return catalogList.map((catalog) => ({ eventType: catalog.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventType } = await params;
  const catalog = getCatalogBySlug(eventType);
  if (!catalog) return { title: 'AK Producciones' };

  return {
    title: `${catalog.name} | AK Producciones Eventos`,
    description: catalog.hero.subheadline,
  };
}

export default async function EventTypePage({ params }: Props) {
  const { eventType } = await params;
  const catalog = getCatalogBySlug(eventType);

  if (!catalog) {
    notFound();
  }

  return (
    <div className="min-h-screen font-body">
      {/* Sticky navbar */}
      <PublicNavbar
        whatsappNumber={catalog.whatsappNumber}
        whatsappMessage={catalog.whatsappMessage}
      />

      {/* Hero */}
      <HeroSection
        hero={catalog.hero}
        whatsappNumber={catalog.whatsappNumber}
        whatsappMessage={catalog.whatsappMessage}
      />

      {/* Services / Packages */}
      <ServiceMenu
        services={catalog.services}
        whatsappNumber={catalog.whatsappNumber}
        whatsappMessage={catalog.whatsappMessage}
      />

      {/* Gallery */}
      <GallerySection images={catalog.gallery} />

      {/* Why choose us */}
      <WhyChooseUs items={catalog.whyUs} />

      {/* CTA Banner (mid-page) */}
      <CallToActionBanner
        headline={`¿Te imaginás tu ${catalog.name.toLowerCase()} perfecta?`}
        subheadline="Hablemos sin compromiso. Te preparamos una propuesta a medida en 24 hs."
        ctaLabel={catalog.hero.ctaLabel}
        whatsappNumber={catalog.whatsappNumber}
        whatsappMessage={catalog.whatsappMessage}
        variant="purple"
      />

      {/* Gifts / Promotions */}
      <PromotionsOrGifts promotion={catalog.promotion} />

      {/* Testimonials */}
      <TestimonialsCarousel testimonials={catalog.testimonials} />

      {/* Our process */}
      <EventProcess steps={catalog.process} />

      {/* FAQ */}
      <FAQSection faqs={catalog.faqs} />

      {/* Payment methods */}
      <PaymentMethods paymentMethods={catalog.paymentMethods} />

      {/* Final CTA */}
      <CallToActionBanner
        headline="¡Reservá tu fecha hoy!"
        subheadline="Las fechas se agotan rápido, especialmente en temporada alta. No esperes más y asegurá la tuya."
        ctaLabel="¡Quiero reservar mi fecha!"
        whatsappNumber={catalog.whatsappNumber}
        whatsappMessage={catalog.whatsappMessage}
        variant="dark"
      />

      {/* Footer */}
      <PublicFooter variant="light" />
    </div>
  );
}

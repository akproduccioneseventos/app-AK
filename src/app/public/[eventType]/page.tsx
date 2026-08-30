import Link from 'next/link';
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
import { FAQJsonLd } from '@/components/seo/FAQJsonLd';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';

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
  if (!catalog) return { title: 'AK Producciones Eventos' };

  const image = catalog.gallery?.[0]?.src || '/media/catalogo-servicios/quinceanera_hero.png';
  const url = `https://akproducciones.uy/public/${eventType}`;

  return {
    metadataBase: new URL('https://akproducciones.uy'),
    title: `${catalog.name} en Salto | AK Producciones Eventos`,
    description: `${catalog.hero.subheadline} Organización integral en Salto con comida, discoteca, tecnología y salones.`,
    alternates: {
      canonical: `/public/${eventType}`,
    },
    openGraph: {
      title: `${catalog.name} en Salto | AK Producciones Eventos`,
      description: catalog.hero.subheadline,
      url,
      siteName: 'AK Producciones Eventos',
      locale: 'es_UY',
      type: 'website',
      images: [{ url: image, width: 1200, height: 630, alt: catalog.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${catalog.name} en Salto | AK Producciones Eventos`,
      description: catalog.hero.subheadline,
      images: [image],
    },
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
      {/* Schemas estructurados para Google */}
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', url: '/' },
          { name: catalog.name, url: `/public/${eventType}` },
        ]}
      />
      {catalog.faqs && catalog.faqs.length > 0 && <FAQJsonLd items={catalog.faqs} />}

      {/* Sticky navbar */}
      <PublicNavbar
        whatsappNumber={catalog.whatsappNumber}
        whatsappMessage={catalog.whatsappMessage}
      />

      {/* Migas de pan visibles que coinciden con BreadcrumbJsonLd */}
      <nav aria-label="Migas de pan" className="bg-slate-950/90 border-b border-slate-800/60 px-4 py-2 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          <Link href="/" className="hover:text-amber-400 transition-colors">Inicio</Link>
          <span>&gt;</span>
          <span className="text-slate-200 font-bold" aria-current="page">{catalog.name}</span>
        </div>
      </nav>

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

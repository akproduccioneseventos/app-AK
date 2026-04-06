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

export const metadata: Metadata = {
  title: 'AK Producciones Eventos — Bodas, XV Años y más en Uruguay',
  description:
    'Producción integral de eventos en Uruguay. Bodas, XV años, cumpleaños y eventos corporativos. ¡Cotizá hoy y hacé realidad tu celebración soñada!',
  openGraph: {
    title: 'AK Producciones Eventos',
    description: 'Producción integral de eventos en Uruguay. ¡Cotizá hoy!',
    type: 'website',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=85&auto=format&fit=crop',
        width: 1200,
        height: 630,
        alt: 'AK Producciones Eventos',
      },
    ],
  },
};

const WHATSAPP_NUMBER = '59899123456';

export default async function LandingPage() {
  const [promo, galeriaData] = await Promise.all([
    getPromoActiva(),
    getGaleriaItems(),
  ]);
  return (
    <div className="min-h-screen bg-white">
      {promo && <PromoWidget promo={promo} />}
      <LandingNav whatsappNumber={WHATSAPP_NUMBER} />
      <HeroSection whatsappNumber={WHATSAPP_NUMBER} promoActiva={promo} />
      <StatsSection />
      <ServicesSection whatsappNumber={WHATSAPP_NUMBER} />
      <ProcessSection />
      <GallerySection galeriaFotos={galeriaData.fotos} />
      <VideoSection galeriaVideos={galeriaData.videos} />
      <TestimonialsSection />
      <FAQSection />
      <CTASection whatsappNumber={WHATSAPP_NUMBER} />
      <PublicFooter variant="dark" />
    </div>
  );
}

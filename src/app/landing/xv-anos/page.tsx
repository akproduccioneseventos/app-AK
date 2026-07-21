import type { Metadata } from 'next';
import { Camera, Music2, Palette } from 'lucide-react';
import { EventLandingPage } from '@/components/landing/EventLandingPage';
import { createEventLandingMetadata } from '@/lib/seo/event-landing';

export const metadata: Metadata = createEventLandingMetadata({
  slug: 'xv-anos',
  title: 'XV Años | AK Producciones',
  description: 'Producción integral de fiestas de 15 años en Uruguay, con ambientación, catering, música y acompañamiento cercano.',
  image: '/media/catalogo-servicios/quinceanera_hero.png',
  imageAlt: 'Fiesta de 15 producida por AK Producciones',
});

export default function XVAnosLanding() {
  return (
    <EventLandingPage
      eventType="XV Años"
      source="landing-xv"
      heroImage="/media/catalogo-servicios/quinceanera_hero.png"
      heroImageAlt="Fiesta de 15 producida por AK Producciones"
      intro="Una noche especial merece una producción pensada junto a la familia y a la quinceañera."
      detailTitle="Una fiesta con identidad propia"
      detailDescription="Desde la ambientación hasta el último baile, ordenamos las ideas para que cada momento tenga su lugar y todos puedan disfrutar."
      detailImage="/media/catalogo-servicios/xv-pista-iluminada-01.jpeg"
      detailImageAlt="Pista iluminada en una fiesta de 15"
      simulatorHref="/simulador-de-presupuesto?tipo=15-anos"
      services={[
        { title: 'Ambientación a medida', description: 'Colores, mesa principal y detalles con una misma idea.', icon: Palette },
        { title: 'Música y pista', description: 'DJ, sonido e iluminación para vivir la noche.', icon: Music2 },
        { title: 'Foto y video', description: 'Opciones para conservar los momentos importantes.', icon: Camera },
      ]}
    />
  );
}

import type { Metadata } from 'next';
import { PartyPopper, UtensilsCrossed, Music, GlassWater, Sparkles } from 'lucide-react';
import { EventLandingPage } from '@/components/landing/EventLandingPage';
import { createEventLandingMetadata } from '@/lib/seo/event-landing';
import { LocalBusinessJsonLd } from '@/components/seo/LocalBusinessJsonLd';

export const metadata: Metadata = createEventLandingMetadata({
  slug: 'cumpleanos',
  title: 'Cumpleaños & Fiestas Sociales | AK Producciones Eventos',
  description: 'Organización integral de cumpleaños de adultos y eventos sociales: discoteca, tragos, catering y diversión garantizada sin complicaciones.',
  image: '/media/catalogo-servicios/social_persuasivo.png',
  imageAlt: 'Cumpleaños producido por AK Producciones',
});

export default function CumpleanosLanding() {
  return (
    <>
      <LocalBusinessJsonLd url="https://akproducciones.uy/cumpleanos" />
      <EventLandingPage
        eventType="Cumpleaños & Fiestas"
        source="landing-cumpleanos"
        heroImage="/media/catalogo-servicios/social_persuasivo.png"
        heroImageAlt="Cumpleaños producido por AK Producciones"
        intro="Festejá tu cumpleaños a lo grande con amigos y familia, sin preocuparte por la organización."
        detailTitle="Tu fiesta con ambientación, barra libre y la mejor música"
        detailDescription="Propuestas dinámicas con finger food, barra de trago libre, discoteca con DJ en vivo y sorpresas para disfrutar cada minuto."
        detailImage="/media/catalogo-servicios/discoteca-salon-ak-02.jpeg"
        detailImageAlt="Fiesta de cumpleaños con discoteca y amigos"
        simulatorHref="/simulador-de-presupuesto?tipo=Cumplea%C3%B1os"
        services={[
          { title: 'Discoteca & DJ en Vivo', description: 'La mejor selección musical adaptada a tu gusto y la vibra de tus invitados.', icon: Music },
          { title: 'Barra Libre de Tragos', description: 'Tragos clásicos, de autor y tragos temáticos preparados en el acto.', icon: GlassWater },
          { title: 'Finger Food & Parrilla', description: 'Opciones ágiles, informales y deliciosas para disfrutar mientras bailás.', icon: UtensilsCrossed },
          { title: 'Fotocabina & Recuerdos', description: 'Impresiones en el acto y registro digital de los momentos más divertidos.', icon: PartyPopper },
          { title: 'Ambientación & Luces LED', description: 'Transformación del espacio con iluminación de fiesta y espacios lounge.', icon: Sparkles },
        ]}
      />
    </>
  );
}

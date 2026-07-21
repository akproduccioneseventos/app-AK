import type { Metadata } from 'next';
import { Camera, HeartHandshake, UtensilsCrossed } from 'lucide-react';
import { EventLandingPage } from '@/components/landing/EventLandingPage';
import { createEventLandingMetadata } from '@/lib/seo/event-landing';

export const metadata: Metadata = createEventLandingMetadata({
  slug: 'bodas',
  title: 'Bodas | AK Producciones',
  description: 'Producción integral de bodas en Uruguay: catering, ambientación, música y coordinación para celebrar con tranquilidad.',
  image: '/media/catalogo-servicios/boda_persuasiva.png',
  imageAlt: 'Boda producida por AK Producciones',
});

export default function BodasLanding() {
  return (
    <EventLandingPage
      eventType="Bodas"
      source="landing-bodas"
      heroImage="/media/catalogo-servicios/boda_persuasiva.png"
      heroImageAlt="Boda producida por AK Producciones"
      intro="Una boda se vive mejor cuando cada detalle tiene un equipo atento detrás."
      detailTitle="Tu día, con una coordinación que se siente simple"
      detailDescription="Catering, ambientación, música y tiempos de la celebración se trabajan como una sola experiencia, siempre en diálogo con ustedes."
      detailImage="/media/catalogo-servicios/boda-decoracion-dorada-01.jpeg"
      detailImageAlt="Mesa decorada para una boda"
      simulatorHref="/simulador-de-presupuesto?tipo=boda"
      services={[
        { title: 'Catering y mesa dulce', description: 'Propuestas pensadas para compartir y disfrutar.', icon: UtensilsCrossed },
        { title: 'Ambientación', description: 'Una puesta que acompaña el estilo de la pareja.', icon: HeartHandshake },
        { title: 'Foto y momentos', description: 'Servicios para guardar lo importante de la noche.', icon: Camera },
      ]}
    />
  );
}

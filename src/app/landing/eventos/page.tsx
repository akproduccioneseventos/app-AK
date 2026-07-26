import type { Metadata } from 'next';
import { Camera, Music2, Presentation } from 'lucide-react';
import { EventLandingPage } from '@/components/landing/EventLandingPage';
import { createEventLandingMetadata } from '@/lib/seo/event-landing';

export const metadata: Metadata = createEventLandingMetadata({
  slug: 'eventos',
  title: 'Eventos | AK Producciones',
  description: 'Producción de eventos sociales y corporativos en Uruguay, con una propuesta clara y servicios coordinados por un mismo equipo.',
  image: '/media/catalogo-servicios/recepcion-display-evento-01.jpeg',
  imageAlt: 'Recepcion de un evento producida por AK Producciones',
});

export default function EventosLanding() {
  return (
    <EventLandingPage
      eventType="Eventos"
      source="landing-eventos"
      heroImage="/media/catalogo-servicios/recepcion-display-evento-01.jpeg"
      heroImageAlt="Recepcion de un evento producida por AK Producciones"
      intro="Eventos sociales y corporativos con una producción que ordena las ideas y acompaña a cada invitado."
      detailTitle="Una experiencia que representa a quienes la organizan"
      detailDescription="Reunimos los servicios necesarios para que la presentación, la celebración y la operativa tengan el mismo nivel de cuidado."
      detailImage="/media/catalogo-servicios/salon-discoteca-ak-01.jpeg"
      detailImageAlt="Salon preparado para un evento"
      simulatorHref="/simulador-de-presupuesto?tipo=social"
      services={[
        { title: 'Producción y coordinación', description: 'Un equipo que organiza los momentos importantes.', icon: Presentation },
        { title: 'Sonido e iluminación', description: 'Recursos técnicos para una experiencia bien resuelta.', icon: Music2 },
        { title: 'Registro del evento', description: 'Foto y video para comunicar y recordar el encuentro.', icon: Camera },
      ]}
    />
  );
}

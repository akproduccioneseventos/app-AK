import type { Metadata } from 'next';
import { Camera, HeartHandshake, UtensilsCrossed, Music, Sparkles } from 'lucide-react';
import { EventLandingPage } from '@/components/landing/EventLandingPage';
import { createEventLandingMetadata } from '@/lib/seo/event-landing';
import { LocalBusinessJsonLd } from '@/components/seo/LocalBusinessJsonLd';

export const metadata: Metadata = createEventLandingMetadata({
  slug: 'bodas',
  title: 'Casamientos en Salto, Uruguay | AK Producciones',
  description: 'Organizamos tu casamiento en Salto de principio a fin: salón, catering de gala, ambientación, discoteca y fotografía, con un solo equipo a cargo. Presupuesto cerrado y sin compromiso.',
  image: '/media/catalogo-servicios/boda_persuasiva.png',
  imageAlt: 'Boda producida por AK Producciones',
});

export default function BodasLanding() {
  return (
    <>
      <LocalBusinessJsonLd url="https://akproducciones.uy/bodas" />
      <EventLandingPage
        eventType="Bodas & Casamientos"
        source="landing-bodas"
        heroImage="/media/catalogo-servicios/boda_persuasiva.png"
        heroImageAlt="Boda producida por AK Producciones"
        intro="Una boda inolvidable se vive cuando cada detalle tiene un equipo profesional cuidándolo."
        detailTitle="Tu gran día, con una coordinación transparente y sin estrés"
        detailDescription="Catering de alta cocina, ambientación distinguida, sonido e iluminación profesional coordinados como una sola experiencia perfecta."
        detailImage="/media/catalogo-servicios/decoracion-boda-mesa-01.jpeg"
        detailImageAlt="Mesa decorada para una boda"
        simulatorHref="/simulador-de-presupuesto?tipo=Boda"
        services={[
          { title: 'Catering de Gala & Recepción', description: 'Platos principales, islas de degustación y mesa dulce pensados para agasajar a todos.', icon: UtensilsCrossed },
          { title: 'Ambientación & Decoración', description: 'Diseño floral, luces cálidas y elegancia ajustada al estilo de los novios.', icon: HeartHandshake },
          { title: 'Discoteca & Sonido Cristalino', description: 'Sets musicales personalizados y momentos inolvidables en la pista de baile.', icon: Music },
          { title: 'Fotocabina & Recuerdos Digitales', description: 'Registro de momentos espontáneos para que todos los invitados se lleven su recuerdo.', icon: Camera },
          { title: 'Coordinación Total del Evento', description: 'Acompañamiento cercano desde la primera reunión hasta el último tema de la noche.', icon: Sparkles },
        ]}
      />
    </>
  );
}

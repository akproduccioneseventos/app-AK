import type { Metadata } from 'next';
import { EventLandingPage } from '@/components/landing/EventLandingPage';
import { createEventLandingMetadata } from '@/lib/seo/event-landing';
import { LocalBusinessJsonLd } from '@/components/seo/LocalBusinessJsonLd';
import { ServiceJsonLd } from '@/components/seo/ServiceJsonLd';

export const metadata: Metadata = createEventLandingMetadata({
  slug: 'quinceaneras',
  title: 'Fiesta de 15 años en Salto | AK Producciones',
  description: 'Organizamos tu fiesta de 15 años en Salto en un solo lugar: salón, comida con vajilla y mobiliario, decoración, discoteca, fotografía, filmación, barra de tragos, fotocabina, Vogue y plataforma 360.',
  image: '/media/catalogo-servicios/quinceanera_persuasiva.png',
  imageAlt: 'Fiesta de 15 años en Salto organizada por AK Producciones',
});

export default function QuinceanerasLanding() {
  return (
    <>
      <LocalBusinessJsonLd url="https://akproducciones.uy/quinceaneras" />
      <ServiceJsonLd
        name="Fiesta de 15 años en Salto"
        description="Organización integral de fiestas de 15 en Salto: salón, comida, decoración, discoteca con iluminación robótica, fotografía, filmación, barra de tragos, fotocabina, Vogue y plataforma 360."
        image="https://akproducciones.uy/media/catalogo-servicios/quinceanera_persuasiva.png"
        url="https://akproducciones.uy/quinceaneras"
      />
      <EventLandingPage
        eventType="Fiesta de 15 años"
        galeriaTipo="15 Años"
        tipoEventoInicial="15 Años"
        source="landing-quince"
        accent="red"
        heroHeadline="Tu fiesta de 15 en Salto, sin correr de un proveedor a otro."
        heroImage="/media/catalogo-servicios/quinceanera_hero.png"
        heroImageAlt="Fiesta de 15 años en Salto producida por AK Producciones"
        intro="Para vos que soñás tu noche y para tu familia que quiere disfrutar tranquila: un solo contacto, una sola reunión y todo resuelto."
        detailTitle="Tu fiesta personalizada con el tema que elegís y la familia tranquila"
        detailDescription="Armamos cada fiesta de 15 años alrededor de tus gustos, tus colores y tu música, mientras la familia cuenta con un solo presupuesto claro y un equipo responsable de principio a fin."
        detailImage="/media/catalogo-servicios/xv-pista-iluminada-01.jpeg"
        detailImageAlt="Pista de baile y luces en una fiesta de 15 años"
        differenceImage="/media/catalogo-servicios/xv-decoracion-equipo-ak-01.jpeg"
        differenceImageAlt="Equipo AK en una fiesta de 15 años"
        plansNote="Contamos con plan básico (4 regalos incluidos) y plan completo (8 regalos incluidos) para que elijas lo que mejor va con tu fiesta."
        simulatorHref="/simulador-de-presupuesto?tipo=XV%20a%C3%B1os"
        services={[
          {
            title: 'Salón de fiesta y organización',
            description: 'Trabajamos en el Salón Club Uruguay o en el salón de Salto que elijas, con una persona coordinando cada momento de la noche.',
          },
          {
            title: 'Comida con vajilla y mobiliario',
            description: 'Opciones pensadas para jóvenes y adultos, con vajilla, mantelería y mobiliario incluidos en un solo lugar.',
          },
          {
            title: 'Decoración temática',
            description: 'Mesa principal, ingresos, sectores para fotos y ambientación personalizada con los colores y el estilo de la quinceañera.',
          },
          {
            title: 'Discoteca con iluminación robótica',
            description: 'Sonido profesional, luces robóticas, entrada especial y tandas armadas con la música que querés bailar.',
          },
          {
            title: 'Fotografía, filmación y barra de tragos',
            description: 'Cobertura completa de fotos y video junto con barra de tragos preparada durante toda la fiesta.',
          },
          {
            title: 'Fotocabina, Vogue y plataforma 360',
            description: 'Fotos impresas al instante, espacio Vogue y videos en plataforma 360 listos para compartir en el celular.',
          },
        ]}
        galeria={[
          {
            id: 'xv-real-1',
            url: '/media/catalogo-servicios/xv-pista-iluminada-01.jpeg',
            titulo: 'Pista iluminada para fiesta de 15',
            alt: 'Fiesta de 15 años con pista iluminada',
            esIlustrativa: false,
          },
          {
            id: 'xv-real-2',
            url: '/media/catalogo-servicios/xv-decoracion-rosa-01.jpeg',
            titulo: 'Decoración y mesa principal de 15',
            alt: 'Decoración rosa para fiesta de 15 años',
            esIlustrativa: false,
          },
          {
            id: 'xv-real-3',
            url: '/media/catalogo-servicios/xv-mesa-principal-ak-02.jpeg',
            titulo: 'Mesa principal y torta de 15',
            alt: 'Mesa principal armada para 15 años',
            esIlustrativa: false,
          },
          {
            id: 'xv-real-4',
            url: '/media/catalogo-servicios/photobooth-vogue-01.jpeg',
            titulo: 'Espacio Vogue en fiesta de 15',
            alt: 'Espacio fotográfico Vogue para fiesta de 15',
            esIlustrativa: false,
          },
        ]}
        faqs={[
          {
            pregunta: '¿Se personaliza con el tema de la quinceañera?',
            respuesta: 'Sí. Definimos los colores, la decoración de la mesa principal, los ingresos, la música y el estilo de la fiesta según lo que la quinceañera elija.',
          },
          {
            pregunta: '¿Qué incluye el plan básico y el completo?',
            respuesta: 'El plan básico incluye los servicios esenciales de la fiesta con 4 regalos incluidos, y el plan completo suma más servicios y experiencias con 8 regalos incluidos. Podés comparar ambos en el simulador.',
          },
          {
            pregunta: '¿Con cuánta anticipación conviene reservar?',
            respuesta: 'Cuanto antes consultes, más fechas tenés disponibles en el salón y con todo el equipo. Podés consultar disponibilidad por WhatsApp o armar tu presupuesto en el simulador.',
          },
          {
            pregunta: '¿Hacen el video y las fotos?',
            respuesta: 'Sí. Ofrecemos fotografía y filmación dentro de la misma organización para que no tengas que buscar ni coordinar otro proveedor por separado.',
          },
        ]}
      />
    </>
  );
}

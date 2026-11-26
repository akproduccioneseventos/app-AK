import type { Metadata } from 'next';
import { EventLandingPage } from '@/components/landing/EventLandingPage';
import { createEventLandingMetadata } from '@/lib/seo/event-landing';
import { LocalBusinessJsonLd } from '@/components/seo/LocalBusinessJsonLd';
import { ServiceJsonLd } from '@/components/seo/ServiceJsonLd';

export const metadata: Metadata = {
  ...createEventLandingMetadata({
    slug: 'cumpleanos',
    title: 'Cumpleaños y fiestas en Salto',
    description: 'Organizamos cumpleaños y fiestas sociales en Salto: salón, comida con vajilla y mobiliario, decoración, barra de tragos, discoteca y fotografía en un solo lugar.',
    image: '/media/catalogo-servicios/social_persuasivo.png',
    imageAlt: 'Imagen ilustrativa de un cumpleaños en Salto',
  }),
  alternates: { canonical: '/cumpleanos' },
};

export default function CumpleanosLanding() {
  return (
    <>
      <LocalBusinessJsonLd url="https://akproducciones.uy/cumpleanos" />
      <ServiceJsonLd
        name="Cumpleaños y Fiestas en Salto"
        description="Organización integral de cumpleaños y celebraciones sociales en Salto con salón, comida, decoración, discoteca, fotografía y barra de tragos."
        image="https://akproducciones.uy/media/catalogo-servicios/social_persuasivo.png"
        url="https://akproducciones.uy/cumpleanos"
      />
      <EventLandingPage
        eventType="Cumpleaños y fiestas"
        galeriaTipo="Cumpleaños"
        tipoEventoInicial="Sociales"
        source="landing-cumpleanos"
        accent="red"
        heroHeadline="Cumpleaños en Salto: vos invitás, nosotros hacemos el resto."
        heroImage="/media/catalogo-servicios/social_persuasivo.png"
        heroImageAlt="Imagen ilustrativa de una fiesta de cumpleaños"
        heroIsIllustrative={true}
        intro="Festejá tu cumpleaños en Salto con amigos y familia, sin correr entre proveedores ni preocuparte por la organización."
        detailTitle="Tu fiesta armada a medida, con un solo contacto"
        detailDescription="Elegís salón, comida con vajilla y mobiliario, decoración, discoteca con iluminación robótica, barra de tragos, fotografía, filmación, fotocabina, Vogue y plataforma 360 en una sola propuesta."
        detailImage="/media/catalogo-servicios/discoteca-salon-ak-02.jpeg"
        detailImageAlt="Salón y discoteca preparados para una fiesta en Salto"
        differenceImage="/media/catalogo-servicios/salon-discoteca-ak-01.jpeg"
        differenceImageAlt="Salón armado con discoteca y mesas"
        simulatorHref="/simulador-de-presupuesto?tipo=Cumplea%C3%B1os"
        services={[
          {
            title: 'Salón de fiesta y organización',
            description: 'Coordinamos tu festejo en el Salón Club Uruguay o en el salón o espacio de Salto que elijas.',
          },
          {
            title: 'Comida con vajilla y mobiliario',
            description: 'Opciones pensadas para disfrutar de pie o en mesa, con vajilla y mobiliario resueltos en el mismo equipo.',
          },
          {
            title: 'Discoteca con iluminación robótica',
            description: 'Música a tu gusto, sonido profesional y luces robóticas para mantener la pista encendida.',
          },
          {
            title: 'Barra de tragos',
            description: 'Barra preparada para tu evento con atención dedicada durante toda la noche.',
          },
          {
            title: 'Decoración, fotografía y filmación',
            description: 'Ambientación del salón junto con registro en fotos y video de los momentos del festejo.',
          },
          {
            title: 'Fotocabina, Vogue y plataforma 360',
            description: 'Recuerdos impresos, espacio Vogue y plataforma 360 para compartir al instante.',
          },
        ]}
        galeria={[
          {
            id: 'cumple-ilus-1',
            url: '/media/catalogo-servicios/social_persuasivo.png',
            titulo: 'Festejo de cumpleaños con amigos',
            alt: 'Imagen ilustrativa de un cumpleaños',
            esIlustrativa: true,
          },
          {
            id: 'cumple-ilus-2',
            url: '/media/catalogo-servicios/blog_bebidas.png',
            titulo: 'Barra de tragos para fiestas',
            alt: 'Imagen ilustrativa de barra de tragos',
            esIlustrativa: true,
          },
          {
            id: 'cumple-ilus-3',
            url: '/media/catalogo-servicios/blog_comida.png',
            titulo: 'Comida y recepción',
            alt: 'Imagen ilustrativa de catering para cumpleaños',
            esIlustrativa: true,
          },
          {
            id: 'cumple-ilus-4',
            url: '/media/catalogo-servicios/blog_iluminacion.png',
            titulo: 'Discoteca e iluminación robótica',
            alt: 'Imagen ilustrativa de iluminación de discoteca',
            esIlustrativa: true,
          },
        ]}
        faqs={[
          {
            pregunta: '¿Puedo elegir sólo los servicios que necesito para mi cumpleaños?',
            respuesta: 'Sí. Armás la propuesta a tu medida en el simulador o por WhatsApp combinando salón, comida, decoración, discoteca, barra, fotografía o cabinas.',
          },
          {
            pregunta: '¿Se puede hacer en el Salón Club Uruguay o en otro lugar de Salto?',
            respuesta: 'Sí. Podés festejar en el Salón Club Uruguay o llevar nuestros servicios al salón o espacio que ya tengas elegido en Salto.',
          },
          {
            pregunta: '¿Cómo se reserva la fecha y se paga la seña?',
            respuesta: 'Se reserva con una sola seña para todo lo contratado, en una sola reunión, con presupuesto detallado en pesos uruguayos.',
          },
        ]}
      />
    </>
  );
}

import type { Metadata } from 'next';
import { EventLandingPage } from '@/components/landing/EventLandingPage';
import { createEventLandingMetadata } from '@/lib/seo/event-landing';
import { LocalBusinessJsonLd } from '@/components/seo/LocalBusinessJsonLd';
import { ServiceJsonLd } from '@/components/seo/ServiceJsonLd';
import { FAQJsonLd } from '@/components/seo/FAQJsonLd';
import { AK_WHATSAPP_PARA_MOSTRAR } from '@/lib/public-contact';

const WHATSAPP_LOCAL = `0${AK_WHATSAPP_PARA_MOSTRAR.replace('+598 ', '')}`;

const CUMPLEANOS_FAQS = [
  {
    pregunta: '¿Puedo elegir sólo los servicios que necesito para mi cumpleaños?',
    respuesta:
      'Sí. Armás la propuesta a tu medida en el simulador o por WhatsApp combinando salón, comida, decoración, discoteca, barra, fotografía o cabinas.',
  },
  {
    pregunta: '¿Se puede hacer en el Salón Club Uruguay o en otro lugar de Salto?',
    respuesta:
      'Sí. Podés festejar en el Salón Club Uruguay (50 a 250 personas según el montaje, Uruguay 754) o llevar nuestros servicios al salón, quinta o espacio que ya tengas elegido en Salto.',
  },
  {
    pregunta: '¿Cómo se reserva la fecha y se paga la seña?',
    respuesta:
      'Se reserva con una sola seña para todo lo contratado, en una sola reunión, con presupuesto detallado en pesos uruguayos.',
  },
  {
    pregunta: '¿Incluyen barra de tragos y opciones de comida adaptadas?',
    respuesta:
      'Sí. Podés sumar barra de tragos con o sin alcohol y opciones gastronómicas completas con vajilla, incluyendo alternativas celíacas y vegetarianas.',
  },
  {
    pregunta: '¿Cómo pido presupuesto para mi festejo?',
    respuesta: `Podés usar el simulador web para calcular un estimado al instante o escribirnos por WhatsApp al ${WHATSAPP_LOCAL} para recibir tu propuesta sin compromiso.`,
  },
];

export const metadata: Metadata = {
  ...createEventLandingMetadata({
    slug: 'cumpleanos',
    title: 'Cumpleaños y fiestas en Salto',
    description:
      'Organizamos cumpleaños y fiestas sociales en Salto: salón, comida con vajilla y mobiliario, decoración, barra de tragos, discoteca y fotografía en un solo lugar.',
    image: '/media/catalogo-servicios/discoteca-salon-ak-02.jpeg',
    imageAlt: 'Salón con iluminación y discoteca para cumpleaños en Salto',
  }),
  alternates: { canonical: '/cumpleanos' },
};

export default function CumpleanosLanding() {
  return (
    <>
      <LocalBusinessJsonLd url="https://akproducciones.uy/cumpleanos" />
      <ServiceJsonLd
        name="Cumpleaños y Fiestas en Salto"
        serviceType="Cumpleaños y fiestas"
        description="Organización integral de cumpleaños y celebraciones sociales en Salto con salón, comida, decoración, discoteca, fotografía y barra de tragos."
        image="https://akproducciones.uy/media/catalogo-servicios/discoteca-salon-ak-02.jpeg"
        url="https://akproducciones.uy/cumpleanos"
      />
      <FAQJsonLd
        items={CUMPLEANOS_FAQS.map((item) => ({
          question: item.pregunta,
          answer: item.respuesta,
        }))}
      />
      <EventLandingPage
        eventType="Cumpleaños y fiestas"
        galeriaTipo="Cumpleaños"
        tipoEventoInicial="Sociales"
        source="landing-cumpleanos"
        accent="red"
        heroHeadline="Cumpleaños en Salto: vos invitás, nosotros hacemos el resto."
        heroImage="/media/catalogo-servicios/discoteca-salon-ak-02.jpeg"
        heroImageAlt="Salón con iluminación y discoteca para cumpleaños en Salto"
        heroIsIllustrative={false}
        intro="Festejá tu cumpleaños en Salto con amigos y familia, sin correr entre proveedores ni preocuparte por la organización."
        detailTitle="Tu fiesta armada a medida, con un solo contacto"
        detailDescription="Elegís salón, comida con vajilla y mobiliario, decoración, discoteca con iluminación robótica, barra de tragos, fotografía, filmación, fotocabina, Vogue y plataforma 360 en una sola propuesta."
        detailImage="/media/catalogo-servicios/salon-discoteca-ak-01.jpeg"
        detailImageAlt="Salón y discoteca preparados para una fiesta en Salto"
        detailIsIllustrative={false}
        differenceImage="/media/catalogo-servicios/barra-tragos-ak-01.jpeg"
        differenceImageAlt="Barra de tragos en fiesta de cumpleaños en Salto"
        differenceIsIllustrative={false}
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
            id: 'cumple-real-1',
            url: '/media/catalogo-servicios/discoteca-salon-ak-02.jpeg',
            titulo: 'Salón y discoteca para cumpleaños',
            alt: 'Salón iluminado para fiesta de cumpleaños en Salto',
            esIlustrativa: false,
          },
          {
            id: 'cumple-real-2',
            url: '/media/catalogo-servicios/salon-discoteca-ak-01.jpeg',
            titulo: 'Armado de mesas y pista',
            alt: 'Salón armado con mesas y pista de baile',
            esIlustrativa: false,
          },
          {
            id: 'cumple-real-3',
            url: '/media/catalogo-servicios/barra-tragos-ak-01.jpeg',
            titulo: 'Barra de tragos para fiestas',
            alt: 'Barra de tragos preparada para cumpleaños',
            esIlustrativa: false,
          },
          {
            id: 'cumple-real-4',
            url: '/media/catalogo-servicios/catering-mesa-ak-01.jpeg',
            titulo: 'Comida y servicio de mesa',
            alt: 'Servicio gastronómico para celebraciones en Salto',
            esIlustrativa: false,
          },
        ]}
        faqs={CUMPLEANOS_FAQS}
        lastUpdated="27 de noviembre de 2026"
      />
    </>
  );
}

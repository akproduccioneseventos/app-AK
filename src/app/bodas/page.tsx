import type { Metadata } from 'next';
import { EventLandingPage } from '@/components/landing/EventLandingPage';
import { createEventLandingMetadata } from '@/lib/seo/event-landing';
import { LocalBusinessJsonLd } from '@/components/seo/LocalBusinessJsonLd';
import { ServiceJsonLd } from '@/components/seo/ServiceJsonLd';
import { FAQJsonLd } from '@/components/seo/FAQJsonLd';
import { AK_WHATSAPP_PARA_MOSTRAR } from '@/lib/public-contact';

const WHATSAPP_LOCAL = `0${AK_WHATSAPP_PARA_MOSTRAR.replace('+598 ', '')}`;

const BODAS_FAQS = [
  {
    pregunta: '¿Qué hace un wedding planner u organizador de bodas en Salto?',
    respuesta:
      'Coordina en un solo equipo todos los rubros del casamiento: elección y armado del salón, comida con vajilla y mobiliario, decoración, discoteca con iluminación robótica, fotografía, filmación, barra de tragos y cronograma completo del día de la boda.',
  },
  {
    pregunta: '¿Dónde se puede hacer la fiesta de boda en Salto?',
    respuesta:
      'Trabajamos en el Salón Club Uruguay (50 a 250 personas según el montaje, Uruguay 754) y también llevamos toda la producción, la comida, la decoración, la discoteca y el equipo a otro salón o chacra en Salto y alrededores.',
  },
  {
    pregunta: '¿Cómo se pide presupuesto para una boda?',
    respuesta: `Podés armar una estimación en pesos uruguayos desde el simulador web o escribirnos por WhatsApp al ${WHATSAPP_LOCAL} para coordinar una reunión y recibir una propuesta clara por escrito sin compromiso.`,
  },
  {
    pregunta: '¿Con cuánta anticipación conviene reservar la fecha?',
    respuesta:
      'Recomendamos consultar con 6 a 12 meses de anticipación, o apenas tengan definida una fecha tentativa, para asegurar disponibilidad de salón y de todo el equipo de producción.',
  },
  {
    pregunta: '¿El menú gastronómico se adapta a celíacos, vegetarianos o niños?',
    respuesta:
      'Sí. Dentro de la misma propuesta gastronómica contemplamos opciones adaptadas para invitados celíacos, vegetarianos e infantiles junto al menú principal de la celebración.',
  },
  {
    pregunta: '¿Cómo funciona la seña para reservar toda la boda?',
    respuesta:
      'Con AK abonás una sola seña para reservar toda la organización del casamiento, en lugar de pagar señas separadas por cada proveedor, y el saldo se organiza de forma clara hasta la fecha de la fiesta.',
  },
];

export const metadata: Metadata = {
  ...createEventLandingMetadata({
    slug: 'bodas',
    title: 'Wedding planner y organizador de bodas en Salto',
    description:
      'Wedding planner y organizador de bodas en Salto, Uruguay. Organizamos tu casamiento de principio a fin: salón, ambientación, música, iluminación y coordinación del día. Presupuesto sin compromiso.',
    image: '/media/catalogo-servicios/decoracion-boda-mesa-01.jpeg',
    imageAlt: 'Mesa decorada para boda organizada por AK Producciones en Salto',
  }),
  alternates: { canonical: '/bodas' },
};

export default function BodasLanding() {
  return (
    <>
      <LocalBusinessJsonLd url="https://akproducciones.uy/bodas" />
      <ServiceJsonLd
        name="Wedding planner y organizador de bodas en Salto"
        alternateName={['Organizador de bodas Salto', 'Wedding planner Salto']}
        serviceType="Organización de bodas"
        description="Wedding planner y organizador de bodas en Salto, Uruguay. Salón, comida con vajilla y mobiliario, decoración, discoteca, fotografía, filmación y coordinación de principio a fin."
        image="https://akproducciones.uy/media/catalogo-servicios/decoracion-boda-mesa-01.jpeg"
        url="https://akproducciones.uy/bodas"
      />
      <FAQJsonLd
        items={BODAS_FAQS.map((item) => ({
          question: item.pregunta,
          answer: item.respuesta,
        }))}
      />
      <EventLandingPage
        eventType="Bodas y Casamientos"
        galeriaTipo="Bodas"
        tipoEventoInicial="Bodas"
        source="landing-bodas"
        accent="gold"
        heroHeadline="Wedding planner y organizador de bodas en Salto"
        heroImage="/media/catalogo-servicios/decoracion-boda-mesa-01.jpeg"
        heroImageAlt="Mesa decorada para boda organizada por AK Producciones en Salto"
        heroIsIllustrative={false}
        intro="Bodas y casamientos con un solo equipo a cargo. Del salón a la última tanda, nos ocupamos de cada detalle de tu casamiento en Salto."
        detailTitle="Tu casamiento en Salto, con una sola reunión y una sola seña"
        detailDescription="Coordinamos el salón (Club Uruguay u otro salón o chacra de Salto), comida con vajilla y mobiliario, decoración, discoteca con iluminación robótica, fotografía, filmación y barra de tragos en un único equipo."
        detailImage="/media/catalogo-servicios/salon-discoteca-ak-01.jpeg"
        detailImageAlt="Salón con pista iluminada preparado para boda en Salto"
        detailIsIllustrative={false}
        differenceImage="/media/catalogo-servicios/discoteca-salon-ak-02.jpeg"
        differenceImageAlt="Discoteca y ambientación en salón para casamiento en Salto"
        differenceIsIllustrative={false}
        techImageIsIllustrative={true}
        salonDescription="Club Uruguay en el centro de Salto (50 a 250 personas según el montaje, Uruguay 754), o el salón o chacra que elijan para su casamiento: nos ocupamos de coordinar todo el armado, los tiempos y los servicios en una sola propuesta."
        simulatorHref="/simulador-de-presupuesto?tipo=Boda"
        extraSection={{
          badge: 'Organización integral',
          title: 'Qué hace un wedding planner (organizador de bodas)',
          body: `Un wedding planner u organizador de bodas centraliza en una sola coordinación cada etapa del casamiento: desde la elección del lugar hasta el último tema de la noche.\n\nEn AK Producciones trabajamos en Salto con un equipo propio para resolver salón (Club Uruguay u otro salón o chacra), comida con vajilla y mobiliario, decoración, discoteca con iluminación robótica, fotografía, filmación, barra de tragos y cronograma del día, con una sola reunión, una sola seña y atención directa por WhatsApp al ${WHATSAPP_LOCAL}.`,
          links: [
            { label: 'Ver guías en el blog', href: '/blog' },
            { label: 'Conocer Salón Club Uruguay', href: '/club-uruguay' },
          ],
        }}
        services={[
          {
            title: 'Salón de fiesta y organización',
            description: 'Coordinamos tu boda en el Salón Club Uruguay, en otro salón de Salto o en una chacra, con una persona responsable de principio a fin.',
          },
          {
            title: 'Comida con vajilla y mobiliario',
            description: 'Recepción, plato principal, mesa dulce, vajilla completa y mobiliario incluidos en un solo servicio pensado para todos los invitados.',
          },
          {
            title: 'Decoración y ambientación',
            description: 'Diseño de mesas, ingresos, iluminación cálida y detalles pensados según el estilo del casamiento.',
          },
          {
            title: 'Discoteca con iluminación robótica',
            description: 'Sonido profesional, luces robóticas y tandas musicales pensadas para cada momento de la noche.',
          },
          {
            title: 'Fotografía, filmación y barra de tragos',
            description: 'Cobertura de fotos y video de toda la celebración, junto con barra de tragos preparada en vivo.',
          },
          {
            title: 'Fotocabina, Vogue y plataforma 360',
            description: 'Recuerdos impresos, espacio Vogue y videos en plataforma 360 para compartir al instante desde el celular.',
          },
        ]}
        galeria={[
          {
            id: 'boda-real-1',
            url: '/media/catalogo-servicios/decoracion-boda-mesa-01.jpeg',
            titulo: 'Mesa principal y decoración de boda',
            alt: 'Mesa decorada para boda en Salto',
            esIlustrativa: false,
          },
          {
            id: 'boda-real-2',
            url: '/media/catalogo-servicios/salon-discoteca-ak-01.jpeg',
            titulo: 'Salón preparado para boda',
            alt: 'Salón con pista de baile e iluminación para casamiento',
            esIlustrativa: false,
          },
          {
            id: 'boda-real-3',
            url: '/media/catalogo-servicios/discoteca-salon-ak-02.jpeg',
            titulo: 'Discoteca e iluminación en salón',
            alt: 'Discoteca armada con luces para fiesta de boda',
            esIlustrativa: false,
          },
          {
            id: 'boda-real-4',
            url: '/media/catalogo-servicios/catering-mesa-ak-01.jpeg',
            titulo: 'Gastronomía y servicio de mesas',
            alt: 'Mesa servida para casamiento y eventos en Salto',
            esIlustrativa: false,
          },
        ]}
        faqs={BODAS_FAQS}
        lastUpdated="27 de noviembre de 2026"
      />
    </>
  );
}

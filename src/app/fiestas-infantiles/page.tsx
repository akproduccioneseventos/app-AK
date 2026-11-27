import type { Metadata } from 'next';
import { EventLandingPage } from '@/components/landing/EventLandingPage';
import { createEventLandingMetadata } from '@/lib/seo/event-landing';
import { LocalBusinessJsonLd } from '@/components/seo/LocalBusinessJsonLd';
import { ServiceJsonLd } from '@/components/seo/ServiceJsonLd';
import { FAQJsonLd } from '@/components/seo/FAQJsonLd';
import { AK_WHATSAPP_PARA_MOSTRAR } from '@/lib/public-contact';

const WHATSAPP_LOCAL = `0${AK_WHATSAPP_PARA_MOSTRAR.replace('+598 ', '')}`;

const INFANTILES_FAQS = [
  {
    pregunta: '¿Para qué edades organizan fiestas infantiles?',
    respuesta:
      'Organizamos cumpleaños infantiles desde los primeros años hasta preadolescentes, adaptando la música, la decoración y la propuesta a cada etapa.',
  },
  {
    pregunta: '¿Se puede hacer en mi casa o en otro salón?',
    respuesta:
      'Sí. Podemos realizar la fiesta en el Salón Club Uruguay (50 a 250 personas según el montaje, Uruguay 754), en otro salón de Salto o llevar nuestros servicios directamente a tu casa.',
  },
  {
    pregunta: '¿Qué comida hay para los chicos?',
    respuesta:
      'Armamos opciones prácticas y ricas pensadas para los chicos, y además sumamos alternativas para los adultos y familiares que acompañan.',
  },
  {
    pregunta: '¿Cómo se reserva?',
    respuesta: `Consultás por WhatsApp al ${WHATSAPP_LOCAL} o armás tu estimación en el simulador, definimos los servicios en una sola reunión y reservás toda la fiesta con una única seña.`,
  },
  {
    pregunta: '¿Incluye música, fotocabina y fotografía?',
    respuesta:
      'Sí. Podés sumar discoteca con luces adaptadas, fotocabina con tiras impresas para que las familias se lleven su recuerdo y cobertura fotográfica del cumple.',
  },
];

export const metadata: Metadata = createEventLandingMetadata({
  slug: 'fiestas-infantiles',
  title: 'Fiestas infantiles en Salto',
  description:
    'Organizamos fiestas infantiles en Salto para que mamá y papá también disfruten: salón, organización, comida, decoración, discoteca, fotocabina y fotografía en un solo lugar.',
  image: '/media/catalogo-servicios/familia_feliz_evento.png',
  imageAlt: 'Imagen ilustrativa de una fiesta infantil en familia',
});

export default function FiestasInfantilesLanding() {
  return (
    <>
      <LocalBusinessJsonLd url="https://akproducciones.uy/fiestas-infantiles" />
      <ServiceJsonLd
        name="Fiestas infantiles en Salto"
        serviceType="Fiestas infantiles"
        description="Organización integral de cumpleaños infantiles en Salto: salón, organización, comida con vajilla y mobiliario, decoración, discoteca, fotocabina y fotografía."
        image="https://akproducciones.uy/media/catalogo-servicios/familia_feliz_evento.png"
        url="https://akproducciones.uy/fiestas-infantiles"
      />
      <FAQJsonLd
        items={INFANTILES_FAQS.map((item) => ({
          question: item.pregunta,
          answer: item.respuesta,
        }))}
      />
      <EventLandingPage
        eventType="Fiestas infantiles"
        galeriaTipo="Infantiles"
        tipoEventoInicial="Cumpleaños"
        source="landing-infantiles"
        accent="cheerful"
        heroHeadline="Fiestas infantiles en Salto: su cumple soñado, y vos también lo disfrutás."
        heroImage="/media/catalogo-servicios/familia_feliz_evento.png"
        heroImageAlt="Imagen ilustrativa de una familia celebrando un cumpleaños infantil"
        heroIsIllustrative={true}
        intro="Pensado para mamá y papá: un solo contacto resuelve el salón, la comida, la decoración, la música y las fotos mientras ustedes disfrutan el festejo."
        detailTitle="Menos corridas para mamá y papá, más disfrute para toda la familia"
        detailDescription="Coordinamos en un solo equipo el salón, la organización, la comida con vajilla y mobiliario, la decoración temática, la discoteca, la fotocabina y la fotografía."
        detailImage="/media/catalogo-servicios/blog_comida.png"
        detailImageAlt="Imagen ilustrativa de mesa de comida para fiesta infantil"
        detailIsIllustrative={true}
        differenceImage="/media/catalogo-servicios/familia_feliz_evento.png"
        differenceImageAlt="Imagen ilustrativa de celebración en familia"
        differenceIsIllustrative={true}
        techImageIsIllustrative={true}
        simulatorHref="/simulador-de-presupuesto?tipo=Cumplea%C3%B1os"
        services={[
          {
            title: 'Salón de fiesta y organización',
            description: 'Organizamos el cumple en el Salón Club Uruguay, en otro salón de Salto o en tu casa, con un solo responsable a cargo.',
          },
          {
            title: 'Comida con vajilla y mobiliario',
            description: 'Opciones pensadas para los chicos y también para los adultos que acompañan, con vajilla y mobiliario incluidos.',
          },
          {
            title: 'Decoración temática',
            description: 'Ambientación y mesa principal con los colores y el estilo elegido para el festejo.',
          },
          {
            title: 'Discoteca con iluminación robótica',
            description: 'Música para bailar, juegos y luces adaptadas a la edad del grupo.',
          },
          {
            title: 'Fotocabina',
            description: 'Fotos impresas al instante para que los chicos y sus familias se lleven un recuerdo divertido.',
          },
          {
            title: 'Fotografía',
            description: 'Registro fotográfico del cumpleaños para que mamá y papá no tengan que estar pendientes del celular.',
          },
        ]}
        galeria={[
          {
            id: 'inf-ilus-1',
            url: '/media/catalogo-servicios/familia_feliz_evento.png',
            titulo: 'Cumpleaños en familia',
            alt: 'Imagen ilustrativa de cumpleaños infantil en familia',
            esIlustrativa: true,
          },
          {
            id: 'inf-ilus-2',
            url: '/media/catalogo-servicios/social_persuasivo.png',
            titulo: 'Celebración y alegría',
            alt: 'Imagen ilustrativa de fiesta infantil',
            esIlustrativa: true,
          },
          {
            id: 'inf-ilus-3',
            url: '/media/catalogo-servicios/blog_comida.png',
            titulo: 'Comida para chicos y adultos',
            alt: 'Imagen ilustrativa de comida para cumpleaños infantil',
            esIlustrativa: true,
          },
          {
            id: 'inf-ilus-4',
            url: '/media/catalogo-servicios/blog_iluminacion.png',
            titulo: 'Música y luces para festejar',
            alt: 'Imagen ilustrativa de música y luces en cumpleaños',
            esIlustrativa: true,
          },
        ]}
        faqs={INFANTILES_FAQS}
        lastUpdated="27 de noviembre de 2026"
      />
    </>
  );
}

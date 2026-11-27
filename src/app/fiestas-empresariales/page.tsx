import type { Metadata } from 'next';
import { EventLandingPage } from '@/components/landing/EventLandingPage';
import { createEventLandingMetadata } from '@/lib/seo/event-landing';
import { LocalBusinessJsonLd } from '@/components/seo/LocalBusinessJsonLd';
import { ServiceJsonLd } from '@/components/seo/ServiceJsonLd';

export const metadata: Metadata = createEventLandingMetadata({
  slug: 'fiestas-empresariales',
  title: 'Eventos y fiestas de empresa en Salto',
  description: 'Salón, organización, comida con vajilla y mobiliario, decoración, discoteca, fotografía, filmación, barra de tragos y cabinas para eventos de empresa en Salto.',
  image: '/media/catalogo-servicios/corporativo_persuasivo.png',
  imageAlt: 'Imagen ilustrativa de un evento empresarial',
});

export default function FiestasEmpresarialesLanding() {
  return (
    <>
      <LocalBusinessJsonLd url="https://akproducciones.uy/fiestas-empresariales" />
      <ServiceJsonLd
        name="Eventos y fiestas de empresa en Salto"
        description="Servicios para eventos empresariales y cenas de fin de año en Salto: salón, organización, comida con vajilla y mobiliario, decoración, discoteca, fotografía, filmación, barra de tragos, fotocabina, Vogue y plataforma 360."
        image="https://akproducciones.uy/media/catalogo-servicios/corporativo_persuasivo.png"
        url="https://akproducciones.uy/fiestas-empresariales"
      />
      <EventLandingPage
        eventType="Fiestas empresariales"
        galeriaTipo="Empresariales"
        tipoEventoInicial="Empresariales"
        source="landing-empresas"
        accent="slate"
        heroHeadline="Tu evento de empresa en Salto, resuelto por un solo equipo."
        heroImage="/media/catalogo-servicios/corporativo_persuasivo.png"
        heroImageAlt="Imagen ilustrativa de un evento empresarial"
        heroIsIllustrative={true}
        intro="Centralizá los servicios de tu fiesta o cena empresarial en Salto con un solo contacto, una sola reunión y presupuesto detallado."
        detailTitle="Todos los servicios para tu empresa en una sola coordinación"
        detailDescription="Disponemos de salón, organización, comida con vajilla y mobiliario, decoración, discoteca con iluminación robótica, fotografía, filmación, barra de tragos, fotocabina, Vogue y plataforma 360."
        detailImage="/media/catalogo-servicios/blog_salon.png"
        detailImageAlt="Imagen ilustrativa de salón armado para un evento empresarial"
        detailIsIllustrative={true}
        differenceImage="/media/catalogo-servicios/corporativo_persuasivo.png"
        differenceImageAlt="Imagen ilustrativa de un evento empresarial"
        differenceIsIllustrative={true}
        techImageIsIllustrative={true}
        simulatorHref="/simulador-de-presupuesto?tipo=Empresariales"
        services={[
          {
            title: 'Salón de fiesta y organización',
            description: 'Servicio disponible en el Salón Club Uruguay o en el lugar de Salto que elija tu empresa, con coordinación integral.',
          },
          {
            title: 'Comida con vajilla y mobiliario',
            description: 'Servicio gastronómico completo con vajilla y mobiliario incluidos, adaptado a la cantidad de colaboradores e invitados.',
          },
          {
            title: 'Decoración y ambientación',
            description: 'Armado del salón acorde a la identidad y colores de tu empresa o a la temática de la celebración.',
          },
          {
            title: 'Discoteca con iluminación robótica',
            description: 'Equipamiento de sonido e iluminación robótica para acompañar la cena, reconocimientos y el baile.',
          },
          {
            title: 'Fotografía, filmación y barra de tragos',
            description: 'Cobertura fotográfica y audiovisual del evento, más servicio de barra de tragos con atención dedicada.',
          },
          {
            title: 'Fotocabina, Vogue y plataforma 360',
            description: 'Propuestas interactivas para que los equipos se lleven recuerdos impresos y videos listos para compartir.',
          },
        ]}
        galeria={[
          {
            id: 'emp-ilus-1',
            url: '/media/catalogo-servicios/corporativo_persuasivo.png',
            titulo: 'Cena y evento empresarial',
            alt: 'Imagen ilustrativa de evento empresarial',
            esIlustrativa: true,
          },
          {
            id: 'emp-ilus-2',
            url: '/media/catalogo-servicios/blog_salon.png',
            titulo: 'Salón preparado para grupos',
            alt: 'Imagen ilustrativa de salón para fiesta de empresa',
            esIlustrativa: true,
          },
          {
            id: 'emp-ilus-3',
            url: '/media/catalogo-servicios/blog_comida.png',
            titulo: 'Servicio de comida y vajilla',
            alt: 'Imagen ilustrativa de comida para eventos empresariales',
            esIlustrativa: true,
          },
          {
            id: 'emp-ilus-4',
            url: '/media/catalogo-servicios/blog_bebidas.png',
            titulo: 'Barra de tragos para empresas',
            alt: 'Imagen ilustrativa de barra de tragos',
            esIlustrativa: true,
          },
        ]}
        faqs={[
          {
            pregunta: '¿Hacen cenas de fin de año?',
            respuesta: 'Sí. Ofrecemos salón, comida con vajilla y mobiliario, decoración, discoteca, fotografía, barra de tragos y cabinas para cenas y fiestas de fin de año de empresas en Salto.',
          },
          {
            pregunta: '¿Se adaptan a la marca de la empresa?',
            respuesta: 'Sí. Podemos adaptar los colores de la ambientación, los marcos de la fotocabina o plataforma 360 y los detalles visuales del evento a la identidad de tu empresa.',
          },
          {
            pregunta: '¿Cuánto antes hay que avisar?',
            respuesta: 'Recomendamos consultar apenas tengan definida una fecha tentativa para asegurar disponibilidad de salón y servicios, especialmente hacia fin de año.',
          },
          {
            pregunta: '¿Presupuestan para un grupo grande?',
            respuesta: 'Sí. Preparamos presupuestos detallados por escrito en pesos uruguayos adaptados a grupos chicos, medianos o grandes, según los servicios elegidos.',
          },
        ]}
      />
    </>
  );
}

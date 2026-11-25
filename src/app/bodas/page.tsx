import type { Metadata } from 'next';
import { EventLandingPage } from '@/components/landing/EventLandingPage';
import { createEventLandingMetadata } from '@/lib/seo/event-landing';
import { LocalBusinessJsonLd } from '@/components/seo/LocalBusinessJsonLd';
import { ServiceJsonLd } from '@/components/seo/ServiceJsonLd';

export const metadata: Metadata = createEventLandingMetadata({
  slug: 'bodas',
  title: 'Bodas y Casamientos en Salto | AK Producciones',
  description: 'Salón, comida, decoración, discoteca, fotografía y más en un solo lugar. Un solo contacto para toda tu boda en Salto.',
  image: '/media/catalogo-servicios/boda_persuasiva.png',
  imageAlt: 'Imagen ilustrativa de una boda',
});

export default function BodasLanding() {
  return (
    <>
      <LocalBusinessJsonLd url="https://akproducciones.uy/bodas" />
      <ServiceJsonLd
        name="Bodas y Casamientos en Salto"
        description="Organización integral de casamientos y bodas en Salto: salón, comida con vajilla y mobiliario, decoración, discoteca, fotografía y coordinación de principio a fin."
        image="https://akproducciones.uy/media/catalogo-servicios/boda_persuasiva.png"
        url="https://akproducciones.uy/bodas"
      />
      <EventLandingPage
        eventType="Bodas y Casamientos"
        galeriaTipo="Bodas"
        tipoEventoInicial="Bodas"
        source="landing-bodas"
        accent="gold"
        heroHeadline="Un solo contacto, toda tu boda en Salto."
        heroImage="/media/catalogo-servicios/boda_persuasiva.png"
        heroImageAlt="Imagen ilustrativa de una boda"
        heroIsIllustrative={true}
        intro="Del salón a la última tanda, nos ocupamos de cada detalle de tu casamiento en Salto. Vos solo disfrutás tu noche."
        detailTitle="Tu casamiento en Salto, con una sola reunión y una sola seña"
        detailDescription="Coordinamos el salón (Club Uruguay u otro salón o chacra de Salto), comida con vajilla y mobiliario, decoración, discoteca con iluminación robótica, fotografía, filmación y barra de tragos en un único equipo."
        detailImage="/media/catalogo-servicios/decoracion-boda-mesa-01.jpeg"
        detailImageAlt="Imagen ilustrativa de mesa decorada para una boda"
        detailIsIllustrative={true}
        differenceImage="/media/catalogo-servicios/boda_persuasiva.png"
        differenceImageAlt="Imagen ilustrativa de una boda"
        differenceIsIllustrative={true}
        techImageIsIllustrative={true}
        salonDescription="Club Uruguay en el centro de Salto, o el salón o chacra que elijan para su casamiento: nos ocupamos de coordinar todo el armado, los tiempos y los servicios en una sola propuesta."
        simulatorHref="/simulador-de-presupuesto?tipo=Boda"
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
            id: 'boda-ilus-1',
            url: '/media/catalogo-servicios/boda_persuasiva.png',
            titulo: 'Ceremonia y recepción de casamiento',
            alt: 'Imagen ilustrativa de una boda',
            esIlustrativa: true,
          },
          {
            id: 'boda-ilus-2',
            url: '/media/catalogo-servicios/blog_salon.png',
            titulo: 'Salón preparado para boda',
            alt: 'Imagen ilustrativa de un salón preparado para una boda',
            esIlustrativa: true,
          },
          {
            id: 'boda-ilus-3',
            url: '/media/catalogo-servicios/blog_comida.png',
            titulo: 'Comida y vajilla de gala',
            alt: 'Imagen ilustrativa de gastronomía para una boda',
            esIlustrativa: true,
          },
          {
            id: 'boda-ilus-4',
            url: '/media/catalogo-servicios/blog_iluminacion.png',
            titulo: 'Discoteca e iluminación',
            alt: 'Imagen ilustrativa de pista iluminada para casamiento',
            esIlustrativa: true,
          },
        ]}
        faqs={[
          {
            pregunta: '¿Se puede hacer la boda en otro salón o en una chacra?',
            respuesta: 'Sí. Trabajamos en el Salón Club Uruguay y también llevamos toda la producción, la comida, la decoración, la discoteca y el equipo a otro salón o chacra en Salto y alrededores.',
          },
          {
            pregunta: '¿Cómo es la primera reunión?',
            respuesta: 'En una sola reunión conversamos sobre la fecha tentativa, el estilo de casamiento que buscan, el salón y los servicios necesarios, y armamos una propuesta clara por escrito.',
          },
          {
            pregunta: '¿Cuántas personas pueden ser?',
            respuesta: 'Adaptamos la propuesta tanto a casamientos íntimos como a bodas numerosas, ajustando comida, vajilla, mobiliario y personal a la cantidad de invitados confirmados.',
          },
          {
            pregunta: '¿Cómo se paga la seña?',
            respuesta: 'Con AK abonás una sola seña para reservar toda la boda, en lugar de pagar una seña separada por cada proveedor, y el resto se organiza de forma clara hasta el evento.',
          },
        ]}
      />
    </>
  );
}

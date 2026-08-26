import React from 'react';
import { AK_SAME_AS_URLS, AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

export interface LocalBusinessJsonLdProps {
  url: string;
  image?: string[];
  description?: string;
  name?: string;
  isClubUruguay?: boolean;
}

export function LocalBusinessJsonLd({
  url,
  image = [
    'https://akproducciones.uy/media/catalogo-servicios/boda_persuasiva.png',
  ],
  description = 'Organización integral de eventos en Salto, Uruguay. Discoteca, comida premium, fotografía, decoración y salones de fiesta en un solo lugar con tecnología interactiva.',
  name = 'AK Producciones Eventos',
  isClubUruguay = false,
}: LocalBusinessJsonLdProps) {
  /**
   * La ficha de negocio que lee Google.
   *
   * **Aca habia una direccion de calle escrita a mano, y AK no tiene local.** Decia
   * `streetAddress: 'Gaboto 3390'` y se declaraba como `EventVenue`, o sea "salon de
   * eventos en esa direccion". Google podia estar mandandole gente a un lugar donde no
   * hay nada.
   *
   * AK trabaja **en salones y a domicilio**. Lo correcto es un negocio que va al lugar
   * del cliente: sin direccion de calle, con **zona de cobertura**. Decision del dueno,
   * confirmada el 26 de agosto de 2026: *"Salto Uruguay pone"*.
   *
   * **La excepcion es el Salon Club Uruguay**, que si es un salon de verdad con
   * direccion real (Uruguay 754). Esa ficha va en su propia pagina, no aca.
   */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name,
    image,
    telephone: `+${AK_WHATSAPP_NUMBER}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Salto',
      addressRegion: 'Salto',
      addressCountry: 'UY',
    },
    areaServed: {
      '@type': 'City',
      name: 'Salto',
      addressCountry: 'UY',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -31.3893,
      longitude: -57.9592, // Coordenadas de Salto, Uruguay
    },
    url,
    sameAs: AK_SAME_AS_URLS,
    description,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

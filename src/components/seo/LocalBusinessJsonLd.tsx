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
  const jsonLd = isClubUruguay
    ? {
        '@context': 'https://schema.org',
        '@type': 'EventVenue',
        name: 'Salón Club Uruguay — AK Producciones',
        image,
        telephone: `+${AK_WHATSAPP_NUMBER}`,
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Uruguay 754',
          addressLocality: 'Salto',
          addressRegion: 'Salto',
          postalCode: '50000',
          addressCountry: 'UY',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: -31.3887,
          longitude: -57.9628,
        },
        url: url || 'https://akproducciones.uy/club-uruguay',
        sameAs: AK_SAME_AS_URLS,
        description:
          'Salón de eventos Club Uruguay en el centro de Salto. Salón de gala histórico con capacidad para eventos sociales y corporativos.',
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name,
        image,
        telephone: `+${AK_WHATSAPP_NUMBER}`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Salto',
          addressRegion: 'Salto',
          postalCode: '50000',
          addressCountry: 'UY',
        },
        areaServed: {
          '@type': 'City',
          name: 'Salto',
          sameAs: 'https://es.wikipedia.org/wiki/Salto_(Uruguay)',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: -31.3893,
          longitude: -57.9592,
        },
        url: url || 'https://akproducciones.uy',
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

import React from 'react';
import { AK_SAME_AS_URLS } from '@/lib/public-contact';

export interface LocalBusinessJsonLdProps {
  url: string;
  image?: string[];
  description?: string;
  name?: string;
}

export function LocalBusinessJsonLd({
  url,
  image = [
    'https://akproducciones.uy/media/catalogo-servicios/boda_persuasiva.png',
  ],
  description = 'Organización integral de eventos en Salto, Uruguay. Discoteca, comida premium, fotografía, decoración y salones de fiesta en un solo lugar con tecnología interactiva.',
  name = 'AK Producciones',
}: LocalBusinessJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EventVenue',
    name,
    image,
    telephone: '+598 98 355 530',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Gaboto 3390',
      addressLocality: 'Salto',
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

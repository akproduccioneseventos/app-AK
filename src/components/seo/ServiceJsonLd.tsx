import React from 'react';

export interface ServiceJsonLdProps {
  name: string;
  description: string;
  image: string;
  url: string;
  price?: string;
}

export function ServiceJsonLd({ name, description, image, url }: ServiceJsonLdProps) {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Event Planning",
    "name": name,
    "provider": {
      "@type": "LocalBusiness",
      "name": "AK Producciones Eventos",
      "image": "https://akproducciones.uy/media/catalogo-servicios/quinceanera_hero.png",
      "@id": "https://akproducciones.uy/#localbusiness",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Salto",
        "addressCountry": "UY"
      }
    },
    "areaServed": {
      "@type": "City",
      "name": "Salto",
      "addressCountry": "UY"
    },
    "description": description,
    "image": image,
    "url": url
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}

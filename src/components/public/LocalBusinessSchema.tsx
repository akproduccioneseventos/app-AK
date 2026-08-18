export function LocalBusinessSchema() {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "EventVenue", "ProfessionalService"],
    "name": "AK Producciones Eventos",
    "alternateName": "AK Producciones",
    "image": [
      "https://akproducciones.uy/media/catalogo-servicios/quinceanera_hero.png",
      "https://akproducciones.uy/media/catalogo-servicios/xv-pista-iluminada-01.jpeg",
      "https://akproducciones.uy/media/catalogo-servicios/barra-tragos-ak-01.jpeg"
    ],
    "@id": "https://akproducciones.uy/#localbusiness",
    "url": "https://akproducciones.uy",
    "telephone": "+59898355530",
    "priceRange": "$$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Brasil 743",
      "addressLocality": "Salto",
      "addressRegion": "Salto",
      "postalCode": "50000",
      "addressCountry": "UY"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -31.3833,
      "longitude": -57.9667
    },
    "areaServed": {
      "@type": "City",
      "name": "Salto",
      "sameAs": "https://es.wikipedia.org/wiki/Salto_(Uruguay)"
    },
    "description": "Organización integral y producción completa de fiestas de 15 años, bodas y eventos en Salto, Uruguay. Servicios de discoteca móvil, pistas de luces LED, fotocabina interactiva, plataforma 360, catering, barras de tragos y salones de fiesta.",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday"
        ],
        "opens": "09:00",
        "closes": "20:00"
      }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Servicios para Eventos en Salto",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Organización de Fiestas de 15 Años en Salto"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Organización de Bodas y Casamientos en Salto"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Servicio de Discoteca, Sonido e Iluminación LED"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Fotocabina Interactiva y Plataforma 360"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Servicio de Catering y Barras de Tragos Premium"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Ambientación y Decoración de Salones de Fiestas"
          }
        }
      ]
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "38",
      "bestRating": "5",
      "worstRating": "1"
    },
    "sameAs": [
      "https://g.page/r/CUagrfscj_5yEAE/review",
      "https://www.facebook.com/akproduccioneseventos/",
      "https://www.instagram.com/akproduccioneseventos/",
      "https://www.tiktok.com/@akproduccioneseventos"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}

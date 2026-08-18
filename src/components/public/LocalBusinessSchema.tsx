export function LocalBusinessSchema() {
  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["ProfessionalService", "EntertainmentBusiness"],
        "@id": "https://akproducciones.uy/#localbusiness",
        "name": "AK Producciones Eventos",
        "alternateName": "AK Producciones",
        "image": [
          "https://akproducciones.uy/media/catalogo-servicios/quinceanera_hero.png",
          "https://akproducciones.uy/media/catalogo-servicios/xv-pista-iluminada-01.jpeg",
          "https://akproducciones.uy/media/catalogo-servicios/barra-tragos-ak-01.jpeg"
        ],
        "url": "https://akproducciones.uy",
        "telephone": "+59898355530",
        "priceRange": "$$$",
        "address": {
          "@type": "PostalAddress",
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
        "description": "Servicio integral y producción de fiestas de 15 años, bodas y eventos en Salto, Uruguay. Cobertura directa en todos los salones de fiestas de la ciudad con discoteca móvil, pistas de luces LED, fotocabina interactiva, plataforma 360, catering gourmet y barras de tragos.",
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
          "name": "Servicios para Fiestas y Eventos en Salto",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Organización y Producción de Fiestas de 15 Años en Salto"
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
                "name": "Discoteca Móvil, Sonido Profesional e Iluminación LED para Salones"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Fotocabina Interactiva, Impresión de Recuerdos y Plataforma 360"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Servicio de Gastronomía, Catering y Barras de Tragos Premium"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Ambientación Integral y Decoración de Salones de Fiestas"
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
      },
      {
        "@type": "FAQPage",
        "@id": "https://akproducciones.uy/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "¿Cómo contratar el servicio completo para una fiesta de 15 o boda en Salto?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Podés simular y cotizar tu presupuesto online en tiempo real a través del simulador de AK Producciones, elegir los servicios que necesitás (discoteca, catering, fotos, cabina 360) y agendar una reunión para coordinar todos los detalles."
            }
          },
          {
            "@type": "Question",
            "name": "¿En qué salones de Salto brinda servicio AK Producciones?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Brindamos cobertura completa en todos los salones de fiestas, quintas y chacras de Salto, incluyendo Salón Club Uruguay, salones céntricos y espacios privados."
            }
          },
          {
            "@type": "Question",
            "name": "¿Con cuánta anticipación se debe reservar una fecha de fiesta?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Recomendamos coordinar y reservar con 6 a 12 meses de anticipación para asegurar la disponibilidad de fecha y congelar los valores del presupuesto con la seña inicial."
            }
          }
        ]
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}

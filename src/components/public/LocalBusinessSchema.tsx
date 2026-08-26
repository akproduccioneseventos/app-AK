import { AK_SAME_AS_URLS, AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

export function LocalBusinessSchema() {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "AK Producciones Eventos",
    "image": "https://akproducciones.uy/media/catalogo-servicios/quinceanera_hero.png",
    "@id": "https://akproducciones.uy/#localbusiness",
    "url": "https://akproducciones.uy",
    "telephone": `+${AK_WHATSAPP_NUMBER}`,
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
      "latitude": -31.3893,
      "longitude": -57.9592
    },
    "areaServed": {
      "@type": "City",
      "name": "Salto",
      "sameAs": "https://es.wikipedia.org/wiki/Salto_(Uruguay)"
    },
    "description": "Organización completa y producción integral de fiestas de 15 años, bodas y eventos en Salto, Uruguay. Cobertura en todos los salones de fiestas con discoteca, gastronomía gourmet, salones de gala y tecnología interactiva.",
    "sameAs": AK_SAME_AS_URLS
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}

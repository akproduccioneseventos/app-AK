import React from 'react';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

export interface ServiceJsonLdProps {
  name: string;
  description: string;
  image: string;
  url: string;
  serviceType?: string;
  alternateName?: string[];
}

/**
 * La ficha de servicio que lee Google.
 *
 * **ACA NO VA NINGUN PRECIO, y es a proposito.**
 *
 * Esto declaraba una oferta con `price: "1000"` en **dolares**, un valor por defecto que
 * ninguna pagina pasaba. O sea que le decia a Google que una boda de AK sale USD 1000: un
 * numero que el dueno nunca puso, en una moneda que no usa —**se trabaja solo en pesos
 * uruguayos**—. Google puede mostrar ese precio en los resultados, antes de que la persona
 * entre siquiera a la web.
 *
 * Una fiesta no tiene precio de lista: depende de los invitados, la fecha, el salon y los
 * servicios. Por eso se cotiza. **Si alguna vez hace falta declarar un precio, tiene que
 * salir de un dato real de la app, en pesos, y nunca de un valor por defecto.**
 */
export function ServiceJsonLd({
  name,
  description,
  image,
  url,
  serviceType = 'Event Planning',
  alternateName,
}: ServiceJsonLdProps) {
  const schemaData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": serviceType,
    "name": name,
    ...(alternateName && alternateName.length > 0 ? { "alternateName": alternateName } : {}),
    "provider": {
      "@type": "EventPlanner",
      "name": "AK Producciones Eventos",
      "telephone": `+${AK_WHATSAPP_NUMBER}`,
      "url": "https://akproducciones.uy/",
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
    "url": url,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}

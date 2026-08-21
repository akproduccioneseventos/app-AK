'use client';

import Script from 'next/script';
import { idDelPixelMeta } from '@/lib/medicion/identificadores';

/**
 * El pixel de Meta: lo que mide si tus anuncios de Facebook e Instagram traen gente.
 *
 * **Por que se agrega ahora.** Se reporto que el pixel estaba "conectado e
 * inyectado en toda la web". No estaba: la unica mencion en todo el codigo era la
 * pantalla que informa el estado de las conexiones. O sea, la pantalla decia que
 * andaba y no habia pixel en ningun lado.
 *
 * **Sin identificador no se carga nada.** No es un error: es lo correcto. Cargar
 * un pixel vacio no mide y encima suma peso a cada visita.
 *
 * El identificador es publico —viaja en el codigo de la pagina a proposito, como
 * el de Google Analytics— y por eso va como variable del navegador, no como
 * secreto.
 */
/** Con que pixel se miden los anuncios. El porque, en `identificadores.ts`. */
export const META_PIXEL_ID = idDelPixelMeta();

export function MetaPixel() {
  if (!META_PIXEL_ID) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}

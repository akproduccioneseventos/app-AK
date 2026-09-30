'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { idDelPixelMeta } from '@/lib/medicion/identificadores';
import { sePuedeMedir, direccionParaMedir } from '@/lib/medicion-segura';

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
 * **SEGURIDAD.** Con `disablePushState` y `autoConfig: false` el pixel no rastrea
 * navegaciones por su cuenta. Nosotros mandamos el PageView a mano, solo en las
 * pantallas de venta publicas, y limpiamos la URL con `direccionParaMedir` para
 * que no se filtren tokens ni llaves de acceso privadas.
 *
 * El identificador es publico —viaja en el codigo de la pagina a proposito, como
 * el de Google Analytics— y por eso va como variable del navegador, no como
 * secreto.
 */
/** Con que pixel se miden los anuncios. El porque, en `identificadores.ts`. */
export const META_PIXEL_ID = idDelPixelMeta();

export function MetaPixel() {
  const pathname = usePathname();

  useEffect(() => {
    if (!META_PIXEL_ID || typeof window === 'undefined') return;
    const fbq = (window as any).fbq;
    if (typeof fbq !== 'function') return;
    if (!sePuedeMedir(pathname)) return;
    const url = direccionParaMedir(pathname, window.location.search);
    fbq('track', 'PageView', { page_location: url });
  }, [pathname]);

  if (!META_PIXEL_ID) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.disablePushState=true;n.queue=[];
t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}', {}, { autoConfig: false });
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

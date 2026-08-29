'use client';

import { useEffect } from 'react';

/**
 * Hace que el navegador ofrezca instalar SÓLO esta estación.
 *
 * Sin esto, la máquina ofrece instalar **la app entera** —que es lo que el dueño
 * ya tenía— y el ícono abre el sistema completo. Acá se cambia el manifiesto por
 * uno de esta estación, así el ícono se llama "Fotocabina AK" y **abre la
 * fotocabina**.
 *
 * **El ícono no está atado a una fiesta, a propósito.** Se instala una vez y cada
 * vez que se abre se elige de qué fiesta es —o entra derecho, si el aparato ya
 * quedó en una—. Palabras del dueño: *"que quede instalado; cuando entro pongo la
 * fiesta que es y ta, así no hay que instalar a cada rato."*
 *
 * El alcance del manifiesto queda encerrado en las pantallas de evento, así que
 * quien abra ese ícono no puede irse a navegar el resto de la app.
 *
 * Se deshace solo al salir de la pantalla: la app vuelve a ofrecer instalarse
 * entera, como antes.
 */
export function InstalarEstaEstacion({ estacion }: { estacion: string }) {
  useEffect(() => {
    if (typeof document === 'undefined' || !estacion) return;

    const anterior = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const hrefAnterior = anterior?.getAttribute('href') || null;

    const nuevoHref = `/api/manifest-estacion?estacion=${encodeURIComponent(estacion)}`;

    if (anterior) {
      anterior.setAttribute('href', nuevoHref);
    } else {
      const etiqueta = document.createElement('link');
      etiqueta.rel = 'manifest';
      etiqueta.href = nuevoHref;
      etiqueta.dataset.estacion = 'si';
      document.head.appendChild(etiqueta);
    }

    return () => {
      const actual = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      if (!actual) return;
      if (actual.dataset.estacion === 'si') {
        actual.remove();
      } else if (hrefAnterior) {
        actual.setAttribute('href', hrefAnterior);
      }
    };
  }, [estacion]);

  return null;
}

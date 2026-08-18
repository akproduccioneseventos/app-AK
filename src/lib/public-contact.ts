/**
 * Cuentas oficiales de contacto y presencia digital de AK Producciones.
 *
 * REGLA: Todas las pantallas públicas, botones de redes, pies de página
 * y fichas para Google leen de acá. Ningún archivo debe escribir una URL a mano.
 */

export const AK_WHATSAPP_NUMBER = '59898355530';

export function buildAkWhatsAppUrl(message: string, number = AK_WHATSAPP_NUMBER) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export const AK_SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/akproduccionessalto/',
  instagram: 'https://www.instagram.com/akproduccionesfiestasyeventos/',
  tiktok: 'https://www.tiktok.com/@akproduccioneseve',
  youtube: 'https://www.youtube.com/channel/UClq6YnypA9PFuBgunzk306A',
  threads: 'https://www.threads.com/@akproduccionesfiestasyeventos',
  x: 'https://x.com/AkSalto',
  pinterest: 'https://es.pinterest.com/akproduccionessalto/',
  googleMaps: 'https://maps.google.com/?q=AK+Producciones+Eventos+Salto+Uruguay',
} as const;

/**
 * Las mismas 7 cuentas oficiales declaradas exactamente igual para Google Schema.org
 */
export const AK_SAME_AS_URLS: string[] = [
  'https://www.facebook.com/akproduccionessalto/',
  'https://www.instagram.com/akproduccionesfiestasyeventos/',
  'https://www.tiktok.com/@akproduccioneseve',
  'https://www.youtube.com/channel/UClq6YnypA9PFuBgunzk306A',
  'https://www.threads.com/@akproduccionesfiestasyeventos',
  'https://x.com/AkSalto',
  'https://es.pinterest.com/akproduccionessalto/',
];

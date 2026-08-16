import type { CatalogoFoto } from '@/types/catalogo';
import type { GaleriaData, GaleriaFoto, GaleriaVideo } from '@/types/galeria';

/**
 * Qué archivos se pueden borrar de verdad al sacar una foto o un video de la
 * galería.
 *
 * Antes, sacar una foto de la galería sólo la sacaba de la lista: el archivo
 * quedaba para siempre en el depósito, ocupando lugar y pagándose todos los
 * meses. Y como las fotos subidas desde la galería se guardan también en el
 * catálogo apuntando al MISMO archivo, borrarlo a ciegas dejaría al catálogo
 * mostrando un cuadro roto.
 *
 * Por eso hay dos reglas:
 * 1. Sólo se borran archivos nuestros. Si la foto se cargó pegando una
 *    dirección de otro lado, no hay nada que borrar.
 * 2. Sólo se borra si ninguna otra foto o video sigue usando ese mismo archivo.
 */

const HOSTS_PROPIOS = [
  'storage.googleapis.com',
  'firebasestorage.googleapis.com',
  'firebasestorage.app',
];

export function esArchivoPropio(url?: string): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return HOSTS_PROPIOS.some((propio) => host === propio || host.endsWith(`.${propio}`));
  } catch {
    return false;
  }
}

/** Todas las direcciones de archivo que cuelgan de una foto o de un video. */
export function urlsDelItem(item: GaleriaFoto | GaleriaVideo): string[] {
  if (item.tipo === 'foto') return [item.url];
  return [item.youtubeUrl, item.embedUrl, item.thumbnailUrl].filter(
    (url): url is string => Boolean(url),
  );
}

/** Direcciones que siguen en uso después del borrado. */
export function urlsEnUso(galeria: GaleriaData, catalogo: CatalogoFoto[]): Set<string> {
  const enUso = new Set<string>();
  for (const foto of galeria.fotos) enUso.add(foto.url);
  for (const video of galeria.videos) {
    for (const url of urlsDelItem(video)) enUso.add(url);
  }
  for (const foto of catalogo) enUso.add(foto.url);
  return enUso;
}

/**
 * Archivos que quedaron sin dueño y se pueden borrar del depósito.
 *
 * @param item      La foto o el video que se está sacando.
 * @param galeria   Cómo queda la galería DESPUÉS de sacarlo.
 * @param catalogo  Cómo queda el catálogo DESPUÉS de sacarlo.
 */
export function archivosHuerfanos(
  item: GaleriaFoto | GaleriaVideo,
  galeria: GaleriaData,
  catalogo: CatalogoFoto[],
): string[] {
  const enUso = urlsEnUso(galeria, catalogo);
  const huerfanos = new Set(
    urlsDelItem(item).filter((url) => esArchivoPropio(url) && !enUso.has(url)),
  );
  return [...huerfanos];
}

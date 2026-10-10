/**
 * Resultado de leer las fotos del Video de Vida (orden 148, VID96-LECTOR).
 *
 * Antes el lector devolvía `[]` tanto para "la galería está vacía" como para "no pudimos leer
 * Storage" o "falló la firma de una foto". La pantalla del cliente mostraba "Tu Galería (0 de N)"
 * y dos recuadros para subir, y el cliente podía reemplazar fotos que sí estaban. Ahora el
 * resultado dice cuál de los cuatro casos es.
 *
 * - `ok` con `urls: []`  -> galería realmente vacía.
 * - `ok` con fotos       -> todo leído.
 * - `parcial`            -> se leyeron algunas; `fallidas` cuenta las que no se pudieron firmar.
 * - `error`              -> no se pudo ni listar: NO se sabe qué hay, y no es lo mismo que cero.
 */
export type LecturaDeFotos =
  | { estado: 'ok'; urls: string[]; fallidas: 0 }
  | { estado: 'parcial'; urls: string[]; fallidas: number }
  | { estado: 'error'; urls: []; fallidas: 0; error: string };

export const MENSAJE_LECTURA_FALLIDA = 'No pudimos leer tus fotos ahora; no se perdieron. Reintentá.';

export function lecturaOk(urls: string[], fallidas = 0): LecturaDeFotos {
  return fallidas > 0 ? { estado: 'parcial', urls, fallidas } : { estado: 'ok', urls, fallidas: 0 };
}

export function lecturaConError(error: string = MENSAJE_LECTURA_FALLIDA): LecturaDeFotos {
  return { estado: 'error', urls: [], fallidas: 0, error };
}

/** Número de recuadro (01.jpg -> 1) que ocupa una foto, o 0 si el nombre no es numérico. */
function numeroDeRecuadro(url: string): number {
  const nombre = url.split('?')[0].split('/').pop() ?? '';
  return parseInt(nombre.split('.')[0] || '0', 10) || 0;
}

/** Reparte las urls en `cantidad` recuadros; una url por número, sin duplicar. */
export function fotosPorRecuadro(urls: string[], cantidad: number): Array<{ number: number; imageUrl: string | null }> {
  return Array.from({ length: cantidad }).map((_, i) => {
    const number = i + 1;
    const foto = urls.find((u) => numeroDeRecuadro(u) === number);
    return { number, imageUrl: foto || null };
  });
}

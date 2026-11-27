/**
 * Tope máximo de fotos permitidas en el Video de Vida (Orden 69).
 *
 * El tope real es 50 y se respeta en toda la aplicación tanto en la
 * pantalla del operador como en las acciones del servidor para evitar
 * costos adicionales de almacenamiento.
 */
export const TOPE_DE_FOTOS = 50;

export interface ProgresoVideoVida {
  subidas: number;
  total: number;
  completo: boolean;
}

/**
 * Calcula cuantas fotos reales hay subidas respecto del cupo pedido (Orden 359),
 * evitando marcar como completo un Video de Vida con apenas una foto subida.
 */
export function progresoVideoVida(videoVida?: {
  photoCount?: number;
  photosUploaded?: boolean | number;
  uploadedCount?: number;
} | null): ProgresoVideoVida {
  const total = Math.max(1, Number(videoVida?.photoCount || TOPE_DE_FOTOS));
  const subidas = typeof videoVida?.uploadedCount === 'number'
    ? Math.max(0, videoVida.uploadedCount)
    : typeof videoVida?.photosUploaded === 'number'
      ? Math.max(0, videoVida.photosUploaded)
      : (videoVida?.photosUploaded === true ? total : 0);
  const completo = typeof videoVida?.uploadedCount === 'number'
    ? subidas >= total
    : Boolean(videoVida?.photosUploaded) && subidas >= total;
  return { subidas, total, completo };
}

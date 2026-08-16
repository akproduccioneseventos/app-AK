'use server';

import { getGaleriaFotosByTipoFiesta } from '@/app/actions/galeria';
import { tipoDeGaleriaPara } from '@/lib/presentacion/fotos-por-tipo';

/**
 * Las fotos de la galería que le corresponden a este tipo de fiesta.
 *
 * Sirve para los tipos que **no tienen catálogo impreso**, como los infantiles y
 * los empresariales: en vez de tener que armar un catálogo nuevo, la presentación
 * se arma con las fotos que el equipo ya subió. Cada fiesta que se hace y se sube
 * mejora la presentación sola.
 *
 * Si para ese tipo no hay fotos cargadas, devuelve las generales: **es mejor una
 * foto linda de otra fiesta que una pantalla vacía delante del cliente.**
 *
 * Es de sólo lectura y pública a propósito: se muestra en la pantalla grande del
 * salón, que se abre sin sesión.
 */
export async function getFotosDePresentacion(
  tipoFiesta: string,
  cuantas = 4,
): Promise<string[]> {
  try {
    const tipoGaleria = tipoDeGaleriaPara(tipoFiesta);

    const propias = tipoGaleria ? await getGaleriaFotosByTipoFiesta(tipoGaleria) : [];
    const elegidas = propias.length > 0 ? propias : await getGaleriaFotosByTipoFiesta('Todos');

    return elegidas
      .slice()
      .sort((a, b) => Number(b.destacada) - Number(a.destacada) || a.orden - b.orden)
      .map((foto) => foto.url)
      .filter((url) => Boolean(url))
      .slice(0, Math.max(1, cuantas));
  } catch {
    // Si la galería no se puede leer, la pantalla usa sus fotos por defecto.
    return [];
  }
}

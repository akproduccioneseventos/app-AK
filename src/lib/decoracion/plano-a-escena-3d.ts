/**
 * Pasar un mueble del plano de arriba a la escena en tres dimensiones.
 *
 * **Por que vive en un archivo aparte:** esta cuenta estaba escrita adentro del
 * dibujo de la pantalla y **no la comprobaba nadie**. Antes, los muebles se
 * dibujaban todos en la posicion cero y dentro de un bloque oculto: la vista 3D
 * mostraba el salon vacio y nadie se enteraba. Aca se puede comprobar sola.
 *
 * El plano guarda las posiciones en pixeles desde la esquina de arriba a la
 * izquierda. La escena las quiere en metros desde el centro del salon.
 */
export interface MuebleDelPlano {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface MedidasDelSalon {
  salonWidth?: number;
  salonHeight?: number;
  pixelsPerMeter?: number;
}

export interface PosicionEnLaEscena {
  id: string;
  x: number;
  z: number;
}

export const SALON_ANCHO_POR_DEFECTO = 15;
export const SALON_LARGO_POR_DEFECTO = 15;
export const PIXELES_POR_METRO_POR_DEFECTO = 40;

export function ubicarMuebleEnLaEscena(
  mueble: MuebleDelPlano,
  medidas: MedidasDelSalon = {}
): PosicionEnLaEscena {
  const anchoSalon = medidas.salonWidth || SALON_ANCHO_POR_DEFECTO;
  const largoSalon = medidas.salonHeight || SALON_LARGO_POR_DEFECTO;
  const pixelesPorMetro = medidas.pixelsPerMeter || PIXELES_POR_METRO_POR_DEFECTO;

  const anchoMueble = mueble.width ?? 80;
  const altoMueble = mueble.height ?? 80;

  return {
    id: mueble.id,
    x: Number((mueble.x / pixelesPorMetro - anchoSalon / 2 + anchoMueble / pixelesPorMetro / 2).toFixed(2)),
    z: Number((mueble.y / pixelesPorMetro - largoSalon / 2 + altoMueble / pixelesPorMetro / 2).toFixed(2)),
  };
}

export function ubicarMueblesEnLaEscena(
  muebles: MuebleDelPlano[],
  medidas: MedidasDelSalon = {}
): PosicionEnLaEscena[] {
  return muebles.map((m) => ubicarMuebleEnLaEscena(m, medidas));
}

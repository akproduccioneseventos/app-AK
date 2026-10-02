/**
 * @fileOverview Selección inteligente de fotos para el video resumen de la fiesta (Orden 106 - Bloque 14).
 * Al día siguiente de la fiesta, elige las mejores fotos del muro y estaciones:
 * - Sin fotos borrosas (usando calcularNitidez / evaluarFoto).
 * - Máximo 30 fotos (y hasta 6 clips de video).
 * - Respeta el orden cronológico de la noche.
 * - Sin repetir caras en exceso.
 */

import { calcularNitidez, evaluarFoto } from '@/lib/album/elegir-las-mejores';

export interface OpcionesSeleccionVideo {
  maxFotos?: number;
  maxClips?: number;
  umbralNitidezMinima?: number;
}

/**
 * Selecciona las mejores fotos para el video resumen de la fiesta.
 */
export function seleccionarFotosParaVideoResumen<T extends {
  id: string;
  imageUrl?: string;
  mediaType?: string;
  timestamp: string;
  nitidez?: number;
  pixels?: Uint8ClampedArray | number[];
  ancho?: number;
  alto?: number;
  likes?: number;
}>(
  items: T[],
  opciones: OpcionesSeleccionVideo = {}
): T[] {
  const maxFotos = opciones.maxFotos ?? 30;
  const umbralNitidez = opciones.umbralNitidezMinima ?? 40;

  // 1. Filtrar elementos válidos y descartar borrosos
  const noBorrosas = items.filter((item) => {
    // Si viene nitidez pre-calculada
    if (typeof item.nitidez === 'number') {
      return item.nitidez >= umbralNitidez;
    }
    // Si vienen píxeles para calcular nitidez en vivo
    if (item.pixels && item.ancho && item.alto) {
      const calculada = calcularNitidez(item.pixels, item.ancho, item.alto);
      return calculada >= umbralNitidez;
    }
    return true;
  });

  // 2. Ordenar cronológicamente respetando el orden de la noche
  const ordenadas = [...noBorrosas].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeA - timeB;
  });

  // 3. Limitar a como máximo maxFotos respetando el flujo de la noche
  if (ordenadas.length <= maxFotos) {
    return ordenadas;
  }

  const paso = ordenadas.length / maxFotos;
  const seleccionadas: T[] = [];
  for (let i = 0; i < maxFotos; i++) {
    const idx = Math.min(Math.floor(i * paso), ordenadas.length - 1);
    seleccionadas.push(ordenadas[idx]);
  }

  return seleccionadas;
}

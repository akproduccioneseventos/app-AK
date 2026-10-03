/**
 * @fileOverview Selección inteligente de fotos para el video resumen de la fiesta (Órdenes 106 y 111).
 * Al día siguiente de la fiesta, elige las mejores fotos del muro y estaciones:
 * - Descarta tiras de fotocabina (tipo/origen cabina o palabra "tira"/"strip").
 * - Descarta fotos sin cara cuando haya suficientes con cara (protagonismo a las personas).
 * - Descarta fotos borrosas (usando calcularNitidez / umbral de nitidez).
 * - Máximo 30 fotos (y hasta 6 clips de video) respetando el orden cronológico de la noche.
 */

import { calcularNitidez } from '@/lib/album/elegir-las-mejores';

export interface OpcionesSeleccionVideo {
  maxFotos?: number;
  maxClips?: number;
  umbralNitidezMinima?: number;
  minFotosConCara?: number;
}

/**
 * Detecta si un elemento es una tira o proviene de una fotocabina.
 */
export function esTiraFotocabina(item: any): boolean {
  if (!item) return false;
  const campos = [
    item.tipo,
    item.origen,
    item.type,
    item.source,
    item.categoria,
    item.category,
    item.station,
    item.id,
    item.caption,
    item.title,
    item.description,
    item.imageUrl,
    ...(Array.isArray(item.tags) ? item.tags : []),
  ];

  return campos.some((c) => {
    if (typeof c !== 'string') return false;
    const lower = c.toLowerCase();
    return (
      lower.includes('tira') ||
      lower.includes('strip') ||
      lower.includes('cabina') ||
      lower.includes('fotocabina')
    );
  });
}

/**
 * Detecta si el elemento contiene al menos una cara identificada.
 */
export function tieneCara(item: any): boolean {
  if (!item) return false;
  if (typeof item.caras === 'number') return item.caras > 0;
  if (typeof item.faces === 'number') return item.faces > 0;
  if (typeof item.caritasDetectadas === 'number') return item.caritasDetectadas > 0;
  if (typeof item.rostros === 'number') return item.rostros > 0;
  if (typeof item.tieneCara === 'boolean') return item.tieneCara;
  if (typeof item.tieneCaras === 'boolean') return item.tieneCaras;
  if (typeof item.hasFaces === 'boolean') return item.hasFaces;
  if (typeof item.hasFace === 'boolean') return item.hasFace;
  if (typeof item.ojosAbiertos === 'boolean') return true;
  if (typeof item.tamanoCara === 'number' && item.tamanoCara > 0) return true;
  return false;
}

/**
 * Selecciona las mejores fotos para el video resumen de la fiesta.
 */
export function elegirFotosVideo<T extends {
  id: string;
  imageUrl?: string;
  mediaType?: string;
  timestamp: string;
  nitidez?: number;
  pixels?: Uint8ClampedArray | number[];
  ancho?: number;
  alto?: number;
  likes?: number;
  tipo?: string;
  origen?: string;
  caption?: string;
  title?: string;
  tags?: string[];
  caras?: number;
  faces?: number;
  caritasDetectadas?: number;
  tieneCara?: boolean;
}>(
  items: T[],
  opciones: OpcionesSeleccionVideo = {}
): T[] {
  const maxFotos = opciones.maxFotos ?? 30;
  const umbralNitidez = opciones.umbralNitidezMinima ?? 40;

  // 1. Descartar tiras de fotocabina
  const sinTiras = items.filter((item) => !esTiraFotocabina(item));

  // 2. Descartar borrosas
  const noBorrosas = sinTiras.filter((item) => {
    if (typeof item.nitidez === 'number') {
      return item.nitidez >= umbralNitidez;
    }
    if (item.pixels && item.ancho && item.alto) {
      const calculada = calcularNitidez(item.pixels, item.ancho, item.alto);
      return calculada >= umbralNitidez;
    }
    return true;
  });

  // 3. Descartar fotos sin cara cuando haya suficientes con cara
  const conCaras = noBorrosas.filter(tieneCara);
  const suficientesConCara = conCaras.length >= Math.min(10, maxFotos);
  const base = suficientesConCara ? conCaras : noBorrosas;

  // 4. Ordenar cronológicamente respetando el orden de la noche
  const ordenadas = [...base].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeA - timeB;
  });

  // 5. Limitar a como máximo maxFotos
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

export const seleccionarFotosParaVideoResumen = elegirFotosVideo;

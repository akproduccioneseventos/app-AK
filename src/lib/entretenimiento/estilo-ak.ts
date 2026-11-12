/**
 * Estilo AK para fotos de invitados en estaciones de entretenimiento y muro social.
 *
 * Aplica:
 * 1. Color y luz: corrección de niveles y aplicación del ajuste tonal (sombras, medios,
 *    altas o temperatura/curva) modulado por intensidad (0 a 1). Si intensidad es 0, no
 *    altera ningún píxel.
 * 2. Piel: suavizado de piel ÚNICAMENTE dentro del contorno de las caras detectadas
 *    (excluyendo ojos, cejas y boca, difuminando bordes). Si un píxel con tono de piel está
 *    fuera del contorno facial, NO se modifica.
 *
 * 100% en Canvas local, sin dependencias externas ni costos por foto.
 */

export const ESTILO_FOTOS_AK_FILE = 'estilo-fotos-ak.json';

export interface ZonaColorAK {
  r?: number;
  g?: number;
  b?: number;
  brillo?: number;
  saturacion?: number;
}

export interface EstiloAKConfig {
  intensidad?: number; // 0 a 1 (por defecto 1)
  temperatura?: number; // >0 cálido, <0 frío
  contraste?: number;
  exposicion?: number;
  saturacion?: number;
  suavizadoPiel?: number; // 0 a 1
  calido?: boolean;
  sombras?: ZonaColorAK;
  medios?: ZonaColorAK;
  altas?: ZonaColorAK;
  actualizadoEn?: string;
  version?: number | string;
  [key: string]: any;
}

export interface Punto2D {
  x: number;
  y: number;
  z?: number;
}

export interface CaraParaEstilo {
  puntos?: Punto2D[];
  contorno?: Punto2D[];
  ojos?: Punto2D[][];
  cejas?: Punto2D[][];
  boca?: Punto2D[];
  blendshapes?: Record<string, number>;
  [key: string]: any;
}

/**
 * Índices clave de MediaPipe FaceLandmarker (468/478 puntos)
 */
export const INDICES_OVALO_FACIAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109,
];

export const INDICES_OJO_IZQ = [
  33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
];

export const INDICES_OJO_DER = [
  362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398,
];

export const INDICES_CEJA_IZQ = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
export const INDICES_CEJA_DER = [336, 296, 334, 293, 300, 276, 283, 282, 295, 285];

export const INDICES_BOCA = [
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317,
  14, 87, 178, 88, 95,
];

/**
 * Algoritmo de ray-casting para comprobar si un punto (x, y) está dentro de un polígono.
 */
export function puntoEnPoligono(x: number, y: number, poligono: Punto2D[]): boolean {
  if (!poligono || poligono.length < 3) return false;
  let adentro = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const xi = poligono[i].x;
    const yi = poligono[i].y;
    const xj = poligono[j].x;
    const yj = poligono[j].y;
    const intersecta = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersecta) adentro = !adentro;
  }
  return adentro;
}

/**
 * Detección de píxel con tono de piel en espacio de color RGB.
 */
export function esTonoPiel(r: number, g: number, b: number): boolean {
  return r > 60 && g > 35 && b > 20 && r > g && r > b && r - g >= 10;
}

/**
 * Normaliza o escala puntos a dimensiones en píxeles.
 */
function escalarPuntos(puntos: Punto2D[], ancho: number, alto: number): Punto2D[] {
  if (!puntos || puntos.length === 0) return [];
  // Detectar si vienen normalizados entre 0 y 1
  let maxCoord = 0;
  for (const p of puntos) {
    if (p.x > maxCoord) maxCoord = p.x;
    if (p.y > maxCoord) maxCoord = p.y;
  }
  const esNormalizado = maxCoord <= 1.05;
  return puntos.map((p) => ({
    x: esNormalizado ? p.x * ancho : p.x,
    y: esNormalizado ? p.y * alto : p.y,
  }));
}

/**
 * Extrae el contorno exterior y las áreas de exclusión (ojos, cejas, boca) para una cara.
 */
function extraerGeometriaCara(
  cara: any,
  ancho: number,
  alto: number,
): { contorno: Punto2D[]; exclusiones: Punto2D[][] } {
  // 1. Si cara es un arreglo de puntos directamente
  if (Array.isArray(cara)) {
    return { contorno: escalarPuntos(cara, ancho, alto), exclusiones: [] };
  }

  // 2. Si tiene contorno explícito
  if (Array.isArray(cara.contorno) && cara.contorno.length >= 3) {
    const contorno = escalarPuntos(cara.contorno, ancho, alto);
    const exclusiones: Punto2D[][] = [];
    if (Array.isArray(cara.ojos)) {
      for (const ojo of cara.ojos) exclusiones.push(escalarPuntos(ojo, ancho, alto));
    }
    if (Array.isArray(cara.cejas)) {
      for (const ceja of cara.cejas) exclusiones.push(escalarPuntos(ceja, ancho, alto));
    }
    if (Array.isArray(cara.boca)) {
      exclusiones.push(escalarPuntos(cara.boca, ancho, alto));
    }
    return { contorno, exclusiones };
  }

  // 3. Si tiene puntos (MediaPipe o lista personalizada)
  const puntos: Punto2D[] = Array.isArray(cara.puntos)
    ? cara.puntos
    : Array.isArray(cara.landmarks)
      ? cara.landmarks
      : [];

  if (puntos.length >= 468) {
    const ptsEscalados = escalarPuntos(puntos, ancho, alto);
    const contorno = INDICES_OVALO_FACIAL.map((i) => ptsEscalados[i]).filter(Boolean);
    const exclusiones: Punto2D[][] = [
      INDICES_OJO_IZQ.map((i) => ptsEscalados[i]).filter(Boolean),
      INDICES_OJO_DER.map((i) => ptsEscalados[i]).filter(Boolean),
      INDICES_CEJA_IZQ.map((i) => ptsEscalados[i]).filter(Boolean),
      INDICES_CEJA_DER.map((i) => ptsEscalados[i]).filter(Boolean),
      INDICES_BOCA.map((i) => ptsEscalados[i]).filter(Boolean),
    ].filter((poly) => poly.length >= 3);
    return { contorno, exclusiones };
  }

  if (puntos.length >= 3) {
    return { contorno: escalarPuntos(puntos, ancho, alto), exclusiones: [] };
  }

  return { contorno: [], exclusiones: [] };
}

/**
 * Aplica el Estilo AK sobre un CanvasRenderingContext2D.
 *
 * @param ctx Contexto 2D del canvas de la foto
 * @param ancho Ancho del lienzo
 * @param alto Alto del lienzo
 * @param estilo Ajustes tonales y de luz (estilo-ak.json)
 * @param caras Caras detectadas opcionales (MediaPipe o contornos poligonales)
 * @param opciones Opciones adicionales (ej: soloColor para subida de invitados)
 */
export function aplicarEstiloAK(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  alto: number,
  estilo: EstiloAKConfig | null | undefined,
  caras?: any[] | null,
  opciones?: { soloColor?: boolean },
): void {
  if (!estilo || typeof estilo !== 'object') return;

  const intensidad = typeof estilo.intensidad === 'number' ? estilo.intensidad : 1;
  // Si la intensidad es 0, no altera los píxeles de la imagen bajo ningún concepto.
  if (intensidad <= 0) return;

  const frame = ctx.getImageData(0, 0, ancho, alto);
  const data = frame.data;
  const len = data.length;

  // ─────────────────────────────────────────────────────────────
  // 1. Color y luz: corrección de niveles y curvas por zona tonal
  // ─────────────────────────────────────────────────────────────
  const temperatura = typeof estilo.temperatura === 'number' ? estilo.temperatura : (estilo.calido ? 20 : 0);
  const tempOffset = temperatura * 0.5;
  const expOffset = typeof estilo.exposicion === 'number' ? estilo.exposicion * 20 : 0;

  const sombras = estilo.sombras || {};
  const medios = estilo.medios || {};
  const altas = estilo.altas || {};

  const tieneAjusteColor =
    temperatura !== 0 ||
    expOffset !== 0 ||
    Boolean(sombras.r || sombras.g || sombras.b || sombras.brillo) ||
    Boolean(medios.r || medios.g || medios.b || medios.brillo) ||
    Boolean(altas.r || altas.g || altas.b || altas.brillo);

  if (tieneAjusteColor) {
    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Luminancia relativa normalizada de 0 a 1
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      // Ponderación de sombras, medios y altas
      const wS = Math.max(0, 1 - lum * 2);
      const wA = Math.max(0, (lum - 0.5) * 2);
      const wM = Math.max(0, 1 - Math.abs(lum - 0.5) * 2);

      const deltaR =
        ((sombras.r ?? 0) * wS +
          (medios.r ?? 0) * wM +
          (altas.r ?? 0) * wA +
          tempOffset +
          expOffset) *
        intensidad;

      const deltaG =
        ((sombras.g ?? 0) * wS +
          (medios.g ?? 0) * wM +
          (altas.g ?? 0) * wA +
          expOffset) *
        intensidad;

      const deltaB =
        ((sombras.b ?? 0) * wS +
          (medios.b ?? 0) * wM +
          (altas.b ?? 0) * wA -
          tempOffset +
          expOffset) *
        intensidad;

      data[i] = Math.max(0, Math.min(255, Math.round(r + deltaR)));
      data[i + 1] = Math.max(0, Math.min(255, Math.round(g + deltaG)));
      data[i + 2] = Math.max(0, Math.min(255, Math.round(b + deltaB)));
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Piel: suavizado ÚNICAMENTE dentro del contorno de las caras
  //    (Sin tocar ojos, cejas ni boca, difuminando bordes).
  // ─────────────────────────────────────────────────────────────
  const aplicarPiel = !opciones?.soloColor && Array.isArray(caras) && caras.length > 0;

  if (aplicarPiel) {
    // Clon de los píxeles antes del suavizado para cálculo bilateral local
    const copiaData = new Uint8ClampedArray(data);
    const suavizadoBase = typeof estilo.suavizadoPiel === 'number' ? estilo.suavizadoPiel : 0.8;
    const intensidadPiel = suavizadoBase * intensidad;

    for (const cara of caras) {
      const { contorno, exclusiones } = extraerGeometriaCara(cara, ancho, alto);
      if (contorno.length < 3) continue;

      // Bounding box para optimizar recorrido de píxeles
      let minX = ancho;
      let maxX = 0;
      let minY = alto;
      let maxY = 0;
      for (const p of contorno) {
        if (p.x < minX) minX = Math.floor(p.x);
        if (p.x > maxX) maxX = Math.ceil(p.x);
        if (p.y < minY) minY = Math.floor(p.y);
        if (p.y > maxY) maxY = Math.ceil(p.y);
      }
      minX = Math.max(0, minX);
      maxX = Math.min(ancho - 1, maxX);
      minY = Math.max(0, minY);
      maxY = Math.min(alto - 1, maxY);

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const idx = (y * ancho + x) * 4;
          const r = copiaData[idx];
          const g = copiaData[idx + 1];
          const b = copiaData[idx + 2];

          // 1. Debe ser un tono de piel
          if (!esTonoPiel(r, g, b)) continue;

          // 2. Debe estar dentro del contorno de la cara
          if (!puntoEnPoligono(x, y, contorno)) continue;

          // 3. NO debe estar en los ojos, cejas ni boca
          let excluido = false;
          for (const poly of exclusiones) {
            if (puntoEnPoligono(x, y, poly)) {
              excluido = true;
              break;
            }
          }
          if (excluido) continue;

          // Suavizado bilateral local (vecindad de radio 2 con preservación de bordes)
          let rSum = 0;
          let gSum = 0;
          let bSum = 0;
          let count = 0;

          for (let dy = -2; dy <= 2; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= alto) continue;
            for (let dx = -2; dx <= 2; dx++) {
              const nx = x + dx;
              if (nx < 0 || nx >= ancho) continue;
              const nIdx = (ny * ancho + nx) * 4;
              const nr = copiaData[nIdx];
              const ng = copiaData[nIdx + 1];
              const nb = copiaData[nIdx + 2];

              // Preservar rasgos contrastados (solo promediar píxeles de tonalidad similar)
              if (Math.abs(nr - r) < 32 && Math.abs(ng - g) < 32 && Math.abs(nb - b) < 32) {
                rSum += nr;
                gSum += ng;
                bSum += nb;
                count++;
              }
            }
          }

          if (count > 0) {
            const avgR = rSum / count;
            const avgG = gSum / count;
            const avgB = bSum / count;

            const factor = 0.6 * intensidadPiel;
            data[idx] = Math.max(0, Math.min(255, Math.round(r * (1 - factor) + avgR * factor + 3 * factor)));
            data[idx + 1] = Math.max(0, Math.min(255, Math.round(g * (1 - factor) + avgG * factor + 1 * factor)));
            data[idx + 2] = Math.max(0, Math.min(255, Math.round(b * (1 - factor) + avgB * factor)));
          }
        }
      }
    }
  }

  ctx.putImageData(frame, 0, 0);
}

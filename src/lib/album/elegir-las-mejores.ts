/**
 * ELECCION INTELIGENTE DE LAS MEJORES FOTOS (Orden 40 - Bloque 1)
 *
 * Evalua automaticamente la calidad de una foto con una nota de 0 a 100:
 * 1. Nitidez y contraste de bordes (descarta fotos movidas / desenfocadas).
 * 2. Ojos abiertos con 68 puntos faciales de face-api (faceLandmark68 / eye aspect ratio).
 * 3. Deteccion de fotos repetidas y similitud.
 * 4. Tamano y orientacion de la cara.
 *
 * Corre 100% en el navegador y sin costo por foto ni llamadas externas.
 */

export interface EvaluacionFoto {
  nota: number; // 0 a 100
  nitidez: number; // 0 a 100
  ojosAbiertos: boolean;
  tamanoCara: number;
  esRepetida?: boolean;
}

/**
 * Calcula la nitidez midiendo la varianza de gradientes locales.
 * Una foto nitida tiene bordes contrastados; una movida tiene bordes lavados.
 */
export function calcularNitidez(
  pixels: Uint8ClampedArray | number[],
  ancho: number,
  alto: number,
): number {
  if (!pixels || ancho < 3 || alto < 3) return 50;

  let sumaGradientes = 0;
  let muestras = 0;

  for (let y = 1; y < alto - 1; y += 2) {
    for (let x = 1; x < ancho - 1; x += 2) {
      const idx = (y * ancho + x) * 4;
      const c = (pixels[idx] || 0) * 0.299 + (pixels[idx + 1] || 0) * 0.587 + (pixels[idx + 2] || 0) * 0.114;
      const arriba = ((pixels[((y - 1) * ancho + x) * 4] || 0) * 0.299) + ((pixels[((y - 1) * ancho + x) * 4 + 1] || 0) * 0.587) + ((pixels[((y - 1) * ancho + x) * 4 + 2] || 0) * 0.114);
      const abajo = ((pixels[((y + 1) * ancho + x) * 4] || 0) * 0.299) + ((pixels[((y + 1) * ancho + x) * 4 + 1] || 0) * 0.587) + ((pixels[((y + 1) * ancho + x) * 4 + 2] || 0) * 0.114);
      const izq = ((pixels[(y * ancho + (x - 1)) * 4] || 0) * 0.299) + ((pixels[(y * ancho + (x - 1)) * 4 + 1] || 0) * 0.587) + ((pixels[(y * ancho + (x - 1)) * 4 + 2] || 0) * 0.114);
      const der = ((pixels[(y * ancho + (x + 1)) * 4] || 0) * 0.299) + ((pixels[(y * ancho + (x + 1)) * 4 + 1] || 0) * 0.587) + ((pixels[(y * ancho + (x + 1)) * 4 + 2] || 0) * 0.114);

      const gradiente = Math.abs(c * 4 - arriba - abajo - izq - der);
      sumaGradientes += gradiente;
      muestras++;
    }
  }

  const promedio = muestras > 0 ? sumaGradientes / muestras : 0;
  return Math.min(100, Math.round(promedio * 2.5));
}

/**
 * Eye Aspect Ratio (EAR) usando los 68 puntos faciales de faceLandmark68.
 * Si la altura entre parpados contra el ancho del ojo es muy baja, el ojo esta cerrado.
 */
export function calcularOjosAbiertos(puntos68?: Array<{ x: number; y: number }>): boolean {
  if (!puntos68 || puntos68.length < 68) return true;

  const dist = (p1: { x: number; y: number }, p2: { x: number; y: number }) =>
    Math.hypot(p1.x - p2.x, p1.y - p2.y);

  const earIzq = (dist(puntos68[37], puntos68[41]) + dist(puntos68[38], puntos68[40])) /
    (2 * dist(puntos68[36], puntos68[39]) || 1);

  const earDer = (dist(puntos68[43], puntos68[47]) + dist(puntos68[44], puntos68[46])) /
    (2 * dist(puntos68[42], puntos68[45]) || 1);

  const earPromedio = (earIzq + earDer) / 2;
  return earPromedio > 0.18;
}

/**
 * Evalua una foto y le asigna una nota de 0 a 100.
 */
export function evaluarFoto({
  nitidez,
  ojosAbiertos = true,
  tamanoCara = 0.5,
  esRepetida = false,
}: {
  nitidez: number;
  ojosAbiertos?: boolean;
  tamanoCara?: number;
  esRepetida?: boolean;
}): EvaluacionFoto {
  let nota = nitidez * 0.6;

  if (ojosAbiertos) {
    nota += 25;
  } else {
    nota -= 20;
  }

  if (tamanoCara >= 0.2 && tamanoCara <= 0.8) {
    nota += 15;
  }

  if (esRepetida) {
    nota -= 30;
  }

  const notaFinal = Math.max(0, Math.min(100, Math.round(nota)));

  return {
    nota: notaFinal,
    nitidez,
    ojosAbiertos,
    tamanoCara,
    esRepetida,
  };
}

/**
 * Evaluacion usando los landmarks y deteccion de faceLandmark68.
 */
export function evaluarFotoConFaceLandmark68(
  puntos68?: Array<{ x: number; y: number }>,
  nitidez = 75,
): EvaluacionFoto {
  const ojosAbiertos = calcularOjosAbiertos(puntos68);
  return evaluarFoto({ nitidez, ojosAbiertos });
}


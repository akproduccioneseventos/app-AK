export type EstiloEdicion360 = 'lento_y_vuelta' | 'solo_camara_lenta' | 'normal';

/**
 * Normaliza cualquier variante de texto para el estilo de edición 360
 * (ej: "Lento y vuelta", "Sólo cámara lenta", "Solo camara lenta", "Normal").
 */
export function normalizarEstiloEdicion360(estilo?: EstiloEdicion360 | string): EstiloEdicion360 {
  const norm = String(estilo || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (norm === 'normal') return 'normal';
  if (norm.includes('solo') || norm === 'solo_camara_lenta') return 'solo_camara_lenta';
  return 'lento_y_vuelta';
}

/**
 * Construye la secuencia de índices de cuadro para renderizar el video 360 editado.
 *
 * Receta:
 * 1. Tramo 1 (Arranque normal): 0 al 25% de los cuadros originales a 1x sin repetir.
 * 2. Transición suave de entrada a cámara lenta (~0.4s, interpolando velocidad de 1x a 1/3x).
 * 3. Tramo 2 (Cámara lenta): del 25% al 75% a 1/3 de velocidad (cuadros repetidos unas 3 veces).
 * 4. Transición suave de salida (~0.4s, volviendo de 1/3x a 1x).
 * 5. Tramo 3 (Vuelta a normal): último 25% a velocidad real 1x sin repetir.
 * 6. Tramo 4 (Ida y vuelta / boomerang): si estilo === 'lento_y_vuelta', agrega los últimos
 *    1.5 segundos en orden inverso.
 *
 * Para grabaciones de 10 a 15 segundos (300 a 450 cuadros a 30 fps), la duración
 * final resultante queda acotada entre 12 y 20 segundos.
 */
export function armarLineaDeTiempo360(
  cantidadCuadros: number,
  fps: number = 30,
  estilo: EstiloEdicion360 | string = 'lento_y_vuelta'
): number[] {
  if (!cantidadCuadros || cantidadCuadros <= 0) return [];
  if (cantidadCuadros === 1) return [0];

  const estiloNorm = normalizarEstiloEdicion360(estilo);
  if (estiloNorm === 'normal') {
    return Array.from({ length: cantidadCuadros }, (_, i) => i);
  }

  // Casos borde con muy pocos cuadros: devolver secuencia simple sin crashear
  if (cantidadCuadros < 8) {
    return Array.from({ length: cantidadCuadros }, (_, i) => i);
  }

  const c1 = Math.floor(cantidadCuadros * 0.25);
  const c2 = Math.floor(cantidadCuadros * 0.75);

  const forward: number[] = [];

  // 1. Tramo 1 (Arranque normal): 0 al 25% a velocidad real 1x (sin repetir)
  for (let i = 0; i < c1; i++) {
    forward.push(i);
  }

  // 2. Transición suave de entrada a cámara lenta (~0.4s)
  const duracionTransicionSec = 0.4;
  let transicionCuadros = Math.round(duracionTransicionSec * fps);
  const rangoMedio = c2 - c1;
  if (rangoMedio < transicionCuadros * 2 + 1) {
    transicionCuadros = Math.max(1, Math.floor(rangoMedio / 4));
  }

  const transInStart = c1;
  const transInEnd = c1 + transicionCuadros;
  const transOutStart = c2 - transicionCuadros;
  const transOutEnd = c2;

  for (let i = transInStart; i < transInEnd; i++) {
    const p = transicionCuadros > 1 ? (i - transInStart) / (transicionCuadros - 1) : 1;
    const repeticiones = Math.max(1, Math.min(3, Math.round(1 + p * 2)));
    for (let r = 0; r < repeticiones; r++) {
      forward.push(i);
    }
  }

  // 3. Tramo 2 (Cámara lenta pura): del 25% al 75%
  // Mantiene cada cuadro repetido unas 3 veces de manera fluida
  const esBoomerang = estiloNorm === 'lento_y_vuelta';
  const maxSegundos = 20;
  const maxTotalFrames = Math.round(maxSegundos * fps);
  const cuadrosBoomerangDeseados = esBoomerang ? Math.round(1.5 * fps) : 0;
  const maxForwardFrames = maxTotalFrames - cuadrosBoomerangDeseados;

  const pureSlowIndices: number[] = [];
  for (let i = transInEnd; i < transOutStart; i++) {
    pureSlowIndices.push(i);
  }

  // Calculamos el espacio restante para la zona lenta pura
  const framesEstimadosFinal = (cantidadCuadros - c2) + transicionCuadros * 2;
  const framesDisponibles = Math.max(3, maxForwardFrames - forward.length - framesEstimadosFinal);

  // Si entran todos con 3 repeticiones
  if (pureSlowIndices.length * 3 <= framesDisponibles) {
    for (const idx of pureSlowIndices) {
      forward.push(idx, idx, idx);
    }
  } else if (pureSlowIndices.length * 2 <= framesDisponibles) {
    // Si entran todos los cuadros entre 2 y 3 repeticiones sin saltear ninguno
    const extras = framesDisponibles - pureSlowIndices.length * 2;
    for (let i = 0; i < pureSlowIndices.length; i++) {
      const idx = pureSlowIndices[i];
      const rep = i < extras ? 3 : 2;
      for (let r = 0; r < rep; r++) {
        forward.push(idx);
      }
    }
  } else {
    // Grabaciones largas (ej. 15s): muestreo uniforme a 3 repeticiones para no exceder los 20s
    const count = Math.floor(framesDisponibles / 3);
    for (let k = 0; k < count; k++) {
      const idxInArray = Math.floor((k * pureSlowIndices.length) / count);
      const frameIdx = pureSlowIndices[idxInArray];
      forward.push(frameIdx, frameIdx, frameIdx);
    }
  }

  // 4. Transición suave de salida (~0.4s, volviendo de 1/3x a 1x)
  for (let i = transOutStart; i < transOutEnd; i++) {
    const p = transicionCuadros > 1 ? (i - transOutStart) / (transicionCuadros - 1) : 1;
    const repeticiones = Math.max(1, Math.min(3, Math.round(3 - p * 2)));
    for (let r = 0; r < repeticiones; r++) {
      forward.push(i);
    }
  }

  // 5. Tramo 3 (Vuelta a normal): último 25% a velocidad real 1x (sin repetir)
  for (let i = c2; i < cantidadCuadros; i++) {
    forward.push(i);
  }

  // 6. Tramo 4 (Ida y vuelta / boomerang)
  if (esBoomerang) {
    const nBoomerang = Math.min(forward.length, Math.round(1.5 * fps));
    const tramoInverso = forward.slice(-nBoomerang).reverse();
    forward.push(...tramoInverso);
  }

  return forward;
}
